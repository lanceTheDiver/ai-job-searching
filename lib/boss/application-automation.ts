"server-only";

import {
  clickTagged,
  closeSession,
  isSessionAlive,
  openPage,
  pageEval,
  serializeRegex,
  sleep,
} from "@/lib/applications/opencli-browser";
import type { ApplicationStatus } from "@/schemas/application";

type AutomationResult = {
  status: ApplicationStatus;
  message: string;
};

type ApplicationSession = {
  session: string;
  jobUrl: string;
};

type AutomationGlobals = typeof globalThis & {
  bossApplicationSessions?: Map<string, ApplicationSession>;
};

const automationGlobals = globalThis as AutomationGlobals;
const sessions =
  automationGlobals.bossApplicationSessions ??
  new Map<string, ApplicationSession>();
automationGlobals.bossApplicationSessions = sessions;

const CHAT_PATTERN = serializeRegex(/立即沟通|继续沟通/);
const SENT_PATTERN = serializeRegex(/已向BOSS发送消息|已发送|继续沟通/);
const LOGIN_URL_PATTERN = serializeRegex(/\/web\/user|\/login|security-check/i);
const LOGIN_BUTTON_PATTERN = serializeRegex(/^\s*(登录|注册)/);
const CHAT_URL_PATTERN = serializeRegex(/\/web\/geek\/chat/i);
const CHAT_SELECTOR = "a.btn-startchat, .btn-startchat, a, button";
const LOGIN_MESSAGE =
  "请在浏览器中完成 Boss 直聘登录（可扫码），然后点击“继续自动填写”";

type PageState = { url: string; loginRequired: boolean; hasChat: boolean };

function readPageState(session: string) {
  return pageEval<PageState>(
    session,
    `
    const loginRequired =
      rx(${LOGIN_URL_PATTERN}).test(location.href) ||
      visible(document, ".login-dialog-wrap, .sign-form, .login-card-wrap").length > 0 ||
      visible(document, "a, button", ${LOGIN_BUTTON_PATTERN}).length > 0;
    return {
      url: location.href,
      loginRequired,
      hasChat: visible(document, ${JSON.stringify(CHAT_SELECTOR)}, ${CHAT_PATTERN}).length > 0,
    };`,
  );
}

async function inspectJobPage(
  entry: ApplicationSession,
): Promise<AutomationResult> {
  let state = await readPageState(entry.session);
  if (state.loginRequired) {
    return { status: "awaiting_login", message: LOGIN_MESSAGE };
  }

  if (!/zhipin\.com\/job_detail/i.test(state.url)) {
    await openPage(entry.session, entry.jobUrl);
    await sleep(1_000);
    state = await readPageState(entry.session);
    if (state.loginRequired) {
      return { status: "awaiting_login", message: LOGIN_MESSAGE };
    }
  }

  if (!state.hasChat) {
    return {
      status: "needs_attention",
      message:
        "未找到“立即沟通”按钮，岗位可能已关闭或需要先完善在线简历，请在浏览器中检查",
    };
  }
  return {
    status: "awaiting_confirmation",
    message:
      "已打开岗位页。确认后会点击“立即沟通”向招聘者发送打招呼消息，请先在浏览器中核对岗位",
  };
}

export async function prepareBossApplication(input: {
  applicationId: string;
  jobUrl: string;
}) {
  const entry = {
    session: `boss-${input.applicationId}`,
    jobUrl: input.jobUrl,
  };
  sessions.set(input.applicationId, entry);
  await openPage(entry.session, input.jobUrl);
  await sleep(1_000);
  return inspectAndChat(input.applicationId, entry);
}

/** 岗位页就绪后直接点击“立即沟通”，无需二次确认。 */
async function inspectAndChat(
  applicationId: string,
  entry: ApplicationSession,
) {
  const result = await inspectJobPage(entry);
  return result.status === "awaiting_confirmation"
    ? confirmBossApplication(applicationId)
    : result;
}

async function getLiveSession(applicationId: string) {
  const entry = sessions.get(applicationId);
  return entry && (await isSessionAlive(entry.session)) ? entry : null;
}

export async function continueBossApplication(applicationId: string) {
  const entry = await getLiveSession(applicationId);
  if (!entry) {
    return {
      status: "failed",
      message: "浏览器投递会话已失效，请从岗位搜索页重新发起",
    } satisfies AutomationResult;
  }
  return inspectAndChat(applicationId, entry);
}

export async function confirmBossApplication(applicationId: string) {
  const entry = await getLiveSession(applicationId);
  if (!entry) {
    return {
      status: "failed",
      message: "浏览器投递会话已失效，未执行沟通",
    } satisfies AutomationResult;
  }
  const { session } = entry;
  const found = await pageEval<{ found: boolean }>(
    session,
    `return { found: tag(visible(document, ${JSON.stringify(CHAT_SELECTOR)}, ${CHAT_PATTERN})[0]) };`,
  );
  if (!found.found) {
    return {
      status: "needs_attention",
      message: "未检测到“立即沟通”按钮，未执行操作，请在浏览器中检查",
    } satisfies AutomationResult;
  }
  await clickTagged(session);
  await sleep(2_000);

  const { sent } = await pageEval<{ sent: boolean }>(
    session,
    `return { sent: rx(${CHAT_URL_PATTERN}).test(location.href) || rx(${SENT_PATTERN}).test(document.body.innerText) };`,
  );
  if (!sent) {
    return {
      status: "needs_attention",
      message: "点击后未确认沟通已发起，可能出现验证或限制，请在浏览器中检查",
    } satisfies AutomationResult;
  }
  sessions.delete(applicationId);
  return {
    status: "submitted",
    message:
      "已按你的确认向招聘者发起沟通；如需发送简历，请在已打开的聊天窗口中操作",
  } satisfies AutomationResult;
}

export async function cancelBossApplication(applicationId: string) {
  const entry = sessions.get(applicationId);
  sessions.delete(applicationId);
  if (entry) await closeSession(entry.session);
}
