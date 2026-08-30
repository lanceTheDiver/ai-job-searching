"server-only";

import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  chromium,
  type BrowserContext,
  type Locator,
  type Page,
} from "playwright";

import { getStoredResume } from "@/lib/resumes/resume-storage";
import type { ApplicationStatus } from "@/schemas/application";

type AutomationResult = {
  status: ApplicationStatus;
  message: string;
};

type ApplicationSession = {
  page: Page;
  jobUrl: string;
  resumeFilePath: string;
  resumeText: string;
};

type AutomationGlobals = typeof globalThis & {
  linkedinApplicationContext?: Promise<BrowserContext>;
  linkedinApplicationSessions?: Map<string, ApplicationSession>;
};

const automationGlobals = globalThis as AutomationGlobals;
const sessions =
  automationGlobals.linkedinApplicationSessions ??
  new Map<string, ApplicationSession>();
automationGlobals.linkedinApplicationSessions = sessions;

const USER_DATA_DIRECTORY = resolve(
  process.env.LINKEDIN_BROWSER_DATA_DIR ||
    join(process.cwd(), ".data", "browsers", "linkedin"),
);

const EASY_APPLY_PATTERN = /Easy Apply|轻松申请|简易申请/i;
const SUBMIT_PATTERN = /Submit application|提交.*申请|发送.*申请/i;
const REVIEW_PATTERN = /Review|检查.*申请|审核.*申请/i;
const NEXT_PATTERN = /Next|Continue|下一步|继续/i;

async function getBrowserContext() {
  if (!automationGlobals.linkedinApplicationContext) {
    automationGlobals.linkedinApplicationContext = (async () => {
      await mkdir(USER_DATA_DIRECTORY, { recursive: true, mode: 0o700 });
      const context = await chromium.launchPersistentContext(
        USER_DATA_DIRECTORY,
        {
          channel: process.env.LINKEDIN_BROWSER_CHANNEL || "chrome",
          headless: false,
          viewport: null,
        },
      );
      context.on("close", () => {
        automationGlobals.linkedinApplicationContext = undefined;
        sessions.clear();
      });
      return context;
    })().catch((error) => {
      automationGlobals.linkedinApplicationContext = undefined;
      throw error;
    });
  }
  return automationGlobals.linkedinApplicationContext;
}

async function firstVisible(locator: Locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function getApplicationRoot(page: Page) {
  const linkedInModal = await firstVisible(
    page.locator(".jobs-easy-apply-modal"),
  );
  if (linkedInModal) return linkedInModal;
  return firstVisible(
    page.getByRole("dialog").filter({
      hasText:
        /Easy Apply|Contact info|Resume|Work experience|轻松申请|联系方式|简历/i,
    }),
  );
}

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

async function fillKnownContactFields(root: Locator, resumeText: string) {
  const contact = extractContact(resumeText);
  const fields = [
    { name: /email|电子邮件|邮箱/i, value: contact.email },
    { name: /phone|mobile|电话号码|手机/i, value: contact.phone },
  ];

  for (const field of fields) {
    if (!field.value) continue;
    const input = await firstVisible(root.getByLabel(field.name));
    if (!input || !(await input.isEditable().catch(() => false))) continue;
    if (!(await input.inputValue().catch(() => "")).trim()) {
      await input.fill(field.value);
    }
  }
}

async function uploadResume(root: Locator, resumeFilePath: string) {
  const inputs = root.locator('input[type="file"]');
  const count = await inputs.count();
  for (let index = 0; index < count; index += 1) {
    const input = inputs.nth(index);
    const contextText = await input.evaluate((element) => {
      const fileInput = element as HTMLInputElement;
      const container = element.closest(
        ".jobs-document-upload, fieldset, section, form",
      );
      return [
        element.getAttribute("name"),
        element.getAttribute("aria-label"),
        ...Array.from(fileInput.labels ?? []).map((label) => label.textContent),
        container?.textContent,
      ]
        .filter(Boolean)
        .join(" ");
    });
    if (!/resume|curriculum vitae|\bCV\b|简历/i.test(contextText)) {
      continue;
    }
    const currentFiles = await input.evaluate((element: HTMLInputElement) =>
      Array.from(element.files ?? []).map((file) => file.name),
    );
    if (currentFiles.length === 0) await input.setInputFiles(resumeFilePath);
  }
}

async function hasUnansweredRequiredFields(root: Locator) {
  const fields = root.locator(
    'input[required], input[aria-required="true"], textarea[required], textarea[aria-required="true"], select[required], select[aria-required="true"]',
  );
  const count = await fields.count();
  for (let index = 0; index < count; index += 1) {
    const field = fields.nth(index);
    if (!(await field.isVisible().catch(() => false))) continue;
    const tagName = await field.evaluate((element) => element.tagName);
    const type = await field.getAttribute("type");
    if (type === "radio" || type === "checkbox") {
      const name = await field.getAttribute("name");
      const selector = name
        ? `input[name=${JSON.stringify(name)}]:checked`
        : undefined;
      if (!selector || (await root.locator(selector).count()) === 0)
        return true;
      continue;
    }
    if (tagName === "SELECT") {
      if (!(await field.inputValue()).trim()) return true;
      continue;
    }
    if (!(await field.inputValue()).trim()) return true;
  }
  return false;
}

async function isLoginRequired(page: Page) {
  if (/\/login|\/checkpoint/i.test(page.url())) return true;
  const passwordInput = page.locator('input[type="password"]');
  return (
    (await passwordInput.count()) > 0 &&
    (await passwordInput.first().isVisible())
  );
}

async function advanceApplication(
  session: ApplicationSession,
): Promise<AutomationResult> {
  const { page, jobUrl, resumeFilePath, resumeText } = session;
  await page.bringToFront();

  if (await isLoginRequired(page)) {
    return {
      status: "awaiting_login",
      message:
        "请在已打开的 Chrome 中完成 LinkedIn 登录，然后点击“继续自动填写”",
    };
  }

  if (!/linkedin\.com\/jobs\/(?:view|collections)/i.test(page.url())) {
    await page.goto(jobUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
  }

  const easyApplyButton = await firstVisible(
    page.getByRole("button", { name: EASY_APPLY_PATTERN }),
  );
  if (easyApplyButton) {
    await easyApplyButton.click();
    await page.waitForTimeout(800);
  }

  for (let step = 0; step < 12; step += 1) {
    const root = await getApplicationRoot(page);
    if (!root) {
      return {
        status: "needs_attention",
        message:
          "没有检测到 LinkedIn Easy Apply 表单，可能需要手动打开或该岗位不支持站内申请",
      };
    }
    await fillKnownContactFields(root, resumeText);
    await uploadResume(root, resumeFilePath);

    const submitButton = await firstVisible(
      root.getByRole("button", { name: SUBMIT_PATTERN }),
    );
    if (submitButton) {
      return {
        status: "awaiting_confirmation",
        message: "表单已填写到最终提交步骤，请检查已打开的浏览器并确认提交",
      };
    }

    if (await hasUnansweredRequiredFields(root)) {
      return {
        status: "needs_attention",
        message:
          "申请中存在无法确定的必填项，请在浏览器中填写后点击“继续自动填写”",
      };
    }

    const reviewButton = await firstVisible(
      root.getByRole("button", { name: REVIEW_PATTERN }),
    );
    const nextButton = await firstVisible(
      root.getByRole("button", { name: NEXT_PATTERN }),
    );
    const advanceButton = reviewButton ?? nextButton;
    if (!advanceButton) {
      return {
        status: "needs_attention",
        message:
          "未找到可继续的 Easy Apply 步骤，可能不是 Easy Apply 岗位，请在浏览器中检查",
      };
    }
    await advanceButton.click();
    await page.waitForTimeout(700);
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
  const context = await getBrowserContext();
  const resume = await getStoredResume(input.resumeFileId);
  const existingSession = sessions.get(input.applicationId);
  const page = existingSession?.page ?? (await context.newPage());
  const session = {
    page,
    jobUrl: input.jobUrl,
    resumeFilePath: resume.filePath,
    resumeText: input.resumeText,
  };
  sessions.set(input.applicationId, session);
  await page.goto(input.jobUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  return advanceApplication(session);
}

export async function continueLinkedInApplication(applicationId: string) {
  const session = sessions.get(applicationId);
  if (!session || session.page.isClosed()) {
    return {
      status: "failed",
      message: "浏览器投递会话已失效，请从岗位搜索页重新发起",
    } satisfies AutomationResult;
  }
  return advanceApplication(session);
}

export async function confirmLinkedInApplication(applicationId: string) {
  const session = sessions.get(applicationId);
  if (!session || session.page.isClosed()) {
    return {
      status: "failed",
      message: "浏览器投递会话已失效，未执行提交",
    } satisfies AutomationResult;
  }
  await session.page.bringToFront();
  const root = await getApplicationRoot(session.page);
  if (!root) {
    return {
      status: "needs_attention",
      message: "未检测到 Easy Apply 确认表单，未执行提交",
    } satisfies AutomationResult;
  }
  const submitButton = await firstVisible(
    root.getByRole("button", { name: SUBMIT_PATTERN }),
  );
  if (!submitButton) {
    return {
      status: "needs_attention",
      message: "当前页面不在最终提交步骤，未执行提交，请在浏览器中检查",
    } satisfies AutomationResult;
  }
  await submitButton.click();
  await session.page.waitForTimeout(1_500);
  const successMessage = await firstVisible(
    session.page.getByText(
      /Application sent|application was sent|申请已发送|申请已提交/i,
    ),
  );
  const submitStillVisible = await submitButton.isVisible().catch(() => false);
  if (!successMessage && submitStillVisible) {
    return {
      status: "needs_attention",
      message: "点击提交后页面未确认成功，可能仍有校验项，请在浏览器中检查",
    } satisfies AutomationResult;
  }
  sessions.delete(applicationId);
  await session.page.close().catch(() => undefined);
  return {
    status: "submitted",
    message: "已按你的确认提交 LinkedIn 申请",
  } satisfies AutomationResult;
}

export async function cancelLinkedInApplication(applicationId: string) {
  const session = sessions.get(applicationId);
  sessions.delete(applicationId);
  if (session && !session.page.isClosed()) {
    await session.page.close().catch(() => undefined);
  }
}
