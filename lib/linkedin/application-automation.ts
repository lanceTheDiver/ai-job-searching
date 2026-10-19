"server-only";

import {
  clickTagged,
  closeSession,
  fillTagged,
  isSessionAlive,
  openPage,
  pageEval,
  serializeRegex,
  sleep,
  uploadTagged,
} from "@/lib/applications/opencli-browser";
import { getStoredResume } from "@/lib/resumes/resume-storage";
import type { ApplicationStatus } from "@/schemas/application";

type AutomationResult = {
  status: ApplicationStatus;
  message: string;
};

type ApplicationSession = {
  session: string;
  jobUrl: string;
  resumeFilePath: string;
  resumeText: string;
};

type AutomationGlobals = typeof globalThis & {
  linkedinApplicationSessions?: Map<string, ApplicationSession>;
};

const automationGlobals = globalThis as AutomationGlobals;
const sessions =
  automationGlobals.linkedinApplicationSessions ??
  new Map<string, ApplicationSession>();
automationGlobals.linkedinApplicationSessions = sessions;

const EASY_APPLY_PATTERN = serializeRegex(/Easy Apply|轻松申请|简易申请/i);
const SUBMIT_PATTERN = serializeRegex(
  /Submit application|提交.*申请|发送.*申请/i,
);
const REVIEW_PATTERN = serializeRegex(/Review|检查.*申请|审核.*申请/i);
const NEXT_PATTERN = serializeRegex(/Next|Continue|下一步|继续/i);
const LOGIN_URL_PATTERN = serializeRegex(/\/login|\/checkpoint/i);
const JOB_URL_PATTERN = serializeRegex(
  /linkedin\.com\/jobs\/(?:view|collections)/i,
);
const DIALOG_PATTERN = serializeRegex(
  /Easy Apply|Contact info|Resume|Work experience|轻松申请|联系方式|简历/i,
);
const RESUME_CONTEXT_PATTERN = serializeRegex(
  /resume|curriculum vitae|\bCV\b|简历/i,
);
const SUCCESS_PATTERN = serializeRegex(
  /Application sent|application was sent|申请已发送|申请已提交/i,
);
const EMAIL_LABEL_PATTERN = serializeRegex(/email|电子邮件|邮箱/i);
const PHONE_LABEL_PATTERN = serializeRegex(/phone|mobile|电话号码|手机/i);

const BUTTON_SELECTOR = 'button, [role="button"]';

/** 页面脚本公共前缀：定位 Easy Apply 弹窗。 */
const ROOT_JS = `
const root =
  visible(document, ".jobs-easy-apply-modal")[0] ||
  visible(document, '[role="dialog"]', ${DIALOG_PATTERN})[0] ||
  null;
`;

function extractContact(resumeText: string) {
  const phoneLine = resumeText
    .split(/\r?\n/)
    .find((line) => /phone|mobile|电话|手机/i.test(line));
  return {
    email: resumeText.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? null,
    phone:
      phoneLine?.match(/(?:\+?\d[\d\s()-]{7,}\d)/)?.[0]?.trim() ??
      resumeText.match(/(?:\+\d[\d\s()-]{7,}\d)/)?.[0]?.trim() ??
      null,
  };
}

/** 标记弹窗里匹配名称且为空、可编辑的输入框。 */
async function tagEmptyField(session: string, labelPattern: string) {
  const { found } = await pageEval<{ found: boolean }>(
    session,
    `${ROOT_JS}
    if (!root) return { found: false };
    const re = rx(${labelPattern});
    const input = visible(root, "input:not([type=hidden]):not([type=file]), textarea").find((el) => {
      const label = [...(el.labels || [])].map((l) => l.textContent).join(" ") + " " + (el.getAttribute("aria-label") || "");
      return re.test(label) && !el.readOnly && !el.disabled && !el.value.trim();
    });
    return { found: tag(input) };`,
  );
  return found;
}

async function fillKnownContactFields(session: string, resumeText: string) {
  const contact = extractContact(resumeText);
  const fields = [
    { pattern: EMAIL_LABEL_PATTERN, value: contact.email },
    { pattern: PHONE_LABEL_PATTERN, value: contact.phone },
  ];
  for (const field of fields) {
    if (!field.value) continue;
    if (await tagEmptyField(session, field.pattern)) {
      await fillTagged(session, field.value);
    }
  }
}

async function uploadResume(session: string, resumeFilePath: string) {
  // 最多处理 3 个未上传的简历 input，避免上传失败时死循环
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { found } = await pageEval<{ found: boolean }>(
      session,
      `${ROOT_JS}
      if (!root) return { found: false };
      const re = rx(${RESUME_CONTEXT_PATTERN});
      const input = [...root.querySelectorAll('input[type="file"]')].find((el) => {
        const container = el.closest(".jobs-document-upload, fieldset, section, form");
        const context = [
          el.getAttribute("name"),
          el.getAttribute("aria-label"),
          ...[...(el.labels || [])].map((l) => l.textContent),
          container && container.textContent,
        ].filter(Boolean).join(" ");
        return re.test(context) && (!el.files || el.files.length === 0);
      });
      return { found: tag(input) };`,
    );
    if (!found) return;
    await uploadTagged(session, resumeFilePath);
  }
}

type FormState = {
  hasRoot: boolean;
  hasSubmit: boolean;
  hasUnansweredRequired: boolean;
};

function readFormState(session: string) {
  return pageEval<FormState>(
    session,
    `${ROOT_JS}
    if (!root) return { hasRoot: false, hasSubmit: false, hasUnansweredRequired: false };
    const required = visible(
      root,
      'input[required], input[aria-required="true"], textarea[required], textarea[aria-required="true"], select[required], select[aria-required="true"]',
    );
    const hasUnansweredRequired = required.some((field) => {
      const type = field.getAttribute("type");
      if (type === "radio" || type === "checkbox") {
        const name = field.getAttribute("name");
        return !name || !root.querySelector('input[name="' + CSS.escape(name) + '"]:checked');
      }
      return !String(field.value || "").trim();
    });
    return {
      hasRoot: true,
      hasSubmit: visible(root, ${JSON.stringify(BUTTON_SELECTOR)}, ${SUBMIT_PATTERN}).length > 0,
      hasUnansweredRequired,
    };`,
  );
}

/** 标记弹窗内第一个匹配的按钮。 */
async function tagButton(session: string, patterns: string[]) {
  const { found } = await pageEval<{ found: boolean }>(
    session,
    `${ROOT_JS}
    if (!root) return { found: false };
    let button = null;
    for (const pattern of [${patterns.join(", ")}]) {
      button = visible(root, ${JSON.stringify(BUTTON_SELECTOR)}, pattern)[0];
      if (button) break;
    }
    return { found: tag(button) };`,
  );
  return found;
}

async function isLoginRequired(session: string) {
  const { loginRequired } = await pageEval<{ loginRequired: boolean }>(
    session,
    `return { loginRequired:
      rx(${LOGIN_URL_PATTERN}).test(location.href) ||
      visible(document, 'input[type="password"]').length > 0 };`,
  );
  return loginRequired;
}

async function advanceApplication(
  entry: ApplicationSession,
): Promise<AutomationResult> {
  const { session, jobUrl, resumeFilePath, resumeText } = entry;

  if (await isLoginRequired(session)) {
    return {
      status: "awaiting_login",
      message: "请在浏览器中完成 LinkedIn 登录，然后点击“继续自动填写”",
    };
  }

  const { onJobPage } = await pageEval<{ onJobPage: boolean }>(
    session,
    `return { onJobPage: rx(${JOB_URL_PATTERN}).test(location.href) };`,
  );
  if (!onJobPage) {
    await openPage(session, jobUrl);
    await sleep(1_000);
  }

  const { clicked } = await pageEval<{ clicked: boolean }>(
    session,
    `return { clicked: tag(visible(document, 'button, [role="button"], a', ${EASY_APPLY_PATTERN})[0]) };`,
  );
  if (clicked) {
    await clickTagged(session);
    await sleep(800);
  }

  for (let step = 0; step < 12; step += 1) {
    const state = await readFormState(session);
    if (!state.hasRoot) {
      return {
        status: "needs_attention",
        message:
          "没有检测到 LinkedIn Easy Apply 表单，可能需要手动打开或该岗位不支持站内申请",
      };
    }
    await fillKnownContactFields(session, resumeText);
    await uploadResume(session, resumeFilePath);

    if (state.hasSubmit) {
      return {
        status: "awaiting_confirmation",
        message: "表单已填写到最终提交步骤，请检查已打开的浏览器并确认提交",
      };
    }

    if (state.hasUnansweredRequired) {
      return {
        status: "needs_attention",
        message:
          "申请中存在无法确定的必填项，请在浏览器中填写后点击“继续自动填写”",
      };
    }

    if (!(await tagButton(session, [REVIEW_PATTERN, NEXT_PATTERN]))) {
      return {
        status: "needs_attention",
        message:
          "未找到可继续的 Easy Apply 步骤，可能不是 Easy Apply 岗位，请在浏览器中检查",
      };
    }
    await clickTagged(session);
    await sleep(700);
  }

  return {
    status: "needs_attention",
    message: "申请步骤较多，已暂停自动填写，请在浏览器中检查后继续",
  };
}

export async function prepareLinkedInApplication(input: {
  applicationId: string;
  jobUrl: string;
  resumeFileId: string;
  resumeText: string;
}) {
  const resume = await getStoredResume(input.resumeFileId);
  const entry = {
    session: `linkedin-${input.applicationId}`,
    jobUrl: input.jobUrl,
    resumeFilePath: resume.filePath,
    resumeText: input.resumeText,
  };
  sessions.set(input.applicationId, entry);
  await openPage(entry.session, input.jobUrl);
  return advanceApplication(entry);
}

async function getLiveSession(applicationId: string) {
  const entry = sessions.get(applicationId);
  return entry && (await isSessionAlive(entry.session)) ? entry : null;
}

export async function continueLinkedInApplication(applicationId: string) {
  const entry = await getLiveSession(applicationId);
  if (!entry) {
    return {
      status: "failed",
      message: "浏览器投递会话已失效，请从岗位搜索页重新发起",
    } satisfies AutomationResult;
  }
  return advanceApplication(entry);
}

export async function confirmLinkedInApplication(applicationId: string) {
  const entry = await getLiveSession(applicationId);
  if (!entry) {
    return {
      status: "failed",
      message: "浏览器投递会话已失效，未执行提交",
    } satisfies AutomationResult;
  }
  const { session } = entry;
  const state = await readFormState(session);
  if (!state.hasRoot) {
    return {
      status: "needs_attention",
      message: "未检测到 Easy Apply 确认表单，未执行提交",
    } satisfies AutomationResult;
  }
  if (!(await tagButton(session, [SUBMIT_PATTERN]))) {
    return {
      status: "needs_attention",
      message: "当前页面不在最终提交步骤，未执行提交，请在浏览器中检查",
    } satisfies AutomationResult;
  }
  await clickTagged(session);
  await sleep(1_500);

  const { success } = await pageEval<{ success: boolean }>(
    session,
    `return { success: rx(${SUCCESS_PATTERN}).test(document.body.innerText) };`,
  );
  const after = await readFormState(session);
  if (!success && after.hasSubmit) {
    return {
      status: "needs_attention",
      message: "点击提交后页面未确认成功，可能仍有校验项，请在浏览器中检查",
    } satisfies AutomationResult;
  }
  sessions.delete(applicationId);
  await closeSession(session);
  return {
    status: "submitted",
    message: "已按你的确认提交 LinkedIn 申请",
  } satisfies AutomationResult;
}

export async function cancelLinkedInApplication(applicationId: string) {
  const entry = sessions.get(applicationId);
  sessions.delete(applicationId);
  if (entry) await closeSession(entry.session);
}
