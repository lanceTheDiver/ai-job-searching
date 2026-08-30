import { ArrowUpRight, Check, CircleAlert, Sparkles, X } from "lucide-react";

import { ApplicationAssistant } from "@/components/applications/application-assistant";
import type { JobMatch, JobSearchNotice } from "@/schemas/job-search";

export function JobSearchNotices({ notices }: { notices: JobSearchNotice[] }) {
  return (
    <div className="grid gap-2" aria-live="polite">
      {notices.map((notice) => (
        <div
          key={`${notice.source}-${notice.code}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#c08335]/18 bg-[#fffaf1] px-4 py-3 text-xs leading-5 text-[#835c28]"
        >
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-1 size-3.5 shrink-0" />
            {notice.message}
          </span>
          {notice.actionUrl && (
            <a
              href={notice.actionUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-4"
            >
              前往登录
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function JobSearchResults({
  results,
  isSearching,
}: {
  results: JobMatch[];
  isSearching: boolean;
}) {
  if (isSearching && results.length === 0) {
    return (
      <div className="grid gap-3" aria-live="polite">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-[18px] bg-white/70"
          />
        ))}
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <section aria-labelledby="search-results-title">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="search-results-title" className="text-sm font-semibold">
          匹配结果
        </h2>
        <span className="font-mono text-[10px] text-[#172033]/38">
          {results.length} JOBS /{" "}
          {isSearching ? "STILL SEARCHING" : "SORTED BY FIT"}
        </span>
      </div>
      <div className="grid gap-3">
        {results.map((job, index) => (
          <article
            key={job.id}
            className="grid gap-5 rounded-[18px] bg-white p-5 shadow-[0_12px_38px_rgba(23,32,51,0.04)] sm:grid-cols-[5rem_1fr_auto] sm:items-start"
          >
            <div>
              <p className="font-mono text-[9px] text-[#172033]/30">
                #{String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#1f7565]">
                {job.matchScore}
                <span className="ml-1 text-xs tracking-normal text-[#172033]/30">
                  %
                </span>
              </p>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-[-0.03em]">
                  {job.title}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[8px] uppercase ${
                    job.source === "boss"
                      ? "bg-[#fff3dc] text-[#9a611c]"
                      : "bg-[#e8f0f8] text-[#35658d]"
                  }`}
                >
                  {job.source === "boss" ? "Boss 直聘" : "LinkedIn"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#172033]/45">
                {[job.company, job.location, job.salary, job.postedAt]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-3 text-xs leading-6 text-[#172033]/62">
                {job.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.matchedSkills.map((skill) => (
                  <span
                    key={`match-${skill}`}
                    className="flex items-center gap-1 rounded-full bg-[#e8f3ef] px-2.5 py-1 text-[10px] text-[#1f7565]"
                  >
                    <Check className="size-2.5" /> {skill}
                  </span>
                ))}
                {job.missingSkills.map((skill) => (
                  <span
                    key={`gap-${skill}`}
                    className="flex items-center gap-1 rounded-full bg-[#f4ece9] px-2.5 py-1 text-[10px] text-[#9d5148]"
                  >
                    <X className="size-2.5" /> {skill}
                  </span>
                ))}
              </div>
              <ApplicationAssistant job={job} />
            </div>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-[9px] border border-[#172033]/10 px-3 py-2 text-[11px] font-medium transition-colors hover:border-[#1f7565]/30 hover:bg-[#edf3ef] hover:text-[#1f7565] focus-visible:ring-3 focus-visible:ring-[#1f8a70]/18 focus-visible:outline-none"
            >
              查看岗位 <ArrowUpRight className="size-3" />
            </a>
          </article>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-[10px] text-[#172033]/34">
        <Sparkles className="size-3 text-[#1f7565]" />
        匹配度由 AI 根据当前简历与公开职位描述生成，仅作为投递决策参考。
      </p>
    </section>
  );
}
