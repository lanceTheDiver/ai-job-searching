import type { Workplace } from "@/schemas/job-search";

const SEARCH_URL =
  "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";
const DETAIL_URL = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting";
const USER_AGENT = "Mozilla/5.0 (compatible; ApplyPilot/1.0; personal-use)";
const MAX_RESULTS = 5;

export type LinkedInJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  postedAt: string | null;
  url: string;
  description: string;
};

type LinkedInJobSearchCriteria = {
  keywords: string;
  location: string;
  workplace: Workplace;
};

export class LinkedInSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinkedInSearchError";
  }
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function cleanText(value: string) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractElementByClass(
  html: string,
  tagName: string,
  className: string,
) {
  const tag = escapeRegExp(tagName);
  const classPattern = escapeRegExp(className);
  const match = new RegExp(
    `<${tag}[^>]*class=["'][^"']*${classPattern}[^"']*["'][^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  ).exec(html);
  return match ? cleanText(match[1]) : null;
}

function extractDivContent(html: string, className: string) {
  const escaped = escapeRegExp(className);
  const open = new RegExp(
    `<div[^>]*class=["'][^"']*${escaped}[^"']*["'][^>]*>`,
    "i",
  ).exec(html);
  if (!open) return null;

  let cursor = open.index + open[0].length;
  let depth = 1;
  while (depth > 0 && cursor < html.length) {
    const nextOpen = html.indexOf("<div", cursor);
    const nextClose = html.indexOf("</div>", cursor);
    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + 4;
    } else {
      depth -= 1;
      cursor = nextClose + 6;
    }
  }

  return html.slice(open.index + open[0].length, cursor - 6);
}

async function fetchLinkedInHtml(url: string) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(12_000),
    });
    lastStatus = response.status;
    if (response.ok) return response.text();
    if (response.status !== 429 && response.status < 500) break;
  }

  throw new LinkedInSearchError(
    lastStatus === 429
      ? "LinkedIn 请求过于频繁，请稍后再试"
      : `LinkedIn 暂时无法访问（${lastStatus || "网络错误"}）`,
  );
}

function workplaceCode(workplace: Workplace) {
  if (workplace === "any") return undefined;
  return { remote: "2", hybrid: "3", onsite: "1" }[workplace];
}

function parseSearchCards(html: string) {
  const cards: Omit<LinkedInJob, "description">[] = [];
  const listItems = html.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) ?? [];

  for (const item of listItems) {
    const id = /data-entity-urn=["']urn:li:jobPosting:(\d+)["']/i.exec(
      item,
    )?.[1];
    const title = extractElementByClass(item, "h3", "base-search-card__title");
    if (!id || !title) continue;

    const href =
      /<a[^>]*class=["'][^"']*base-card__full-link[^"']*["'][^>]*href=["']([^"']+)["']/i.exec(
        item,
      )?.[1] ?? `https://www.linkedin.com/jobs/view/${id}`;
    const date = /<time[^>]*datetime=["']([^"']+)["']/i.exec(item)?.[1];

    cards.push({
      id,
      title,
      company: extractElementByClass(item, "h4", "base-search-card__subtitle"),
      location: extractElementByClass(
        item,
        "span",
        "job-search-card__location",
      ),
      postedAt: date ?? null,
      url: decodeHtml(href.split("?")[0]),
    });
  }

  return cards.slice(0, MAX_RESULTS);
}

async function fetchJobDescription(id: string) {
  try {
    const html = await fetchLinkedInHtml(`${DETAIL_URL}/${id}`);
    const content =
      extractDivContent(html, "show-more-less-html__markup") ??
      extractDivContent(html, "description__text");
    return content ? cleanText(content).slice(0, 6_000) : "";
  } catch {
    return "";
  }
}

export async function searchLinkedInJobs(
  input: LinkedInJobSearchCriteria,
): Promise<LinkedInJob[]> {
  const params = new URLSearchParams({
    keywords: input.keywords,
    location: input.location,
    start: "0",
  });
  const workplace = workplaceCode(input.workplace);
  if (workplace) params.set("f_WT", workplace);

  const html = await fetchLinkedInHtml(`${SEARCH_URL}?${params.toString()}`);
  const cards = parseSearchCards(html);
  if (cards.length === 0) {
    throw new LinkedInSearchError(
      "没有找到符合条件的 LinkedIn 岗位，请尝试其他办公方式或补充简历中的所在地",
    );
  }

  const jobs: LinkedInJob[] = [];
  for (const card of cards) {
    jobs.push({ ...card, description: await fetchJobDescription(card.id) });
  }
  return jobs;
}
