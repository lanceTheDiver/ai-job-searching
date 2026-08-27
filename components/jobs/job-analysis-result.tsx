import { ArrowUpRight, Check, CircleAlert } from "lucide-react";

import type { JobAnalysis } from "@/schemas/job";

export function JobAnalysisResult({ analysis }: { analysis: JobAnalysis }) {
  const matchedCount = analysis.requirements.filter(
    (item) => item.matched,
  ).length;

  return (
    <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_18px_55px_rgba(23,32,51,0.055)]">
      <header className="grid border-b border-[#172033]/8 sm:grid-cols-[10.5rem_1fr]">
        <div className="bg-[#dcebe6] p-6 sm:p-7">
          <p className="font-mono text-[9px] tracking-[0.14em] text-[#1f7565] uppercase">
            Match score
          </p>
          <div className="mt-4 flex items-baseline gap-1 tabular-nums">
            <strong className="text-6xl font-semibold tracking-[-0.08em]">
              {analysis.matchScore}
            </strong>
            <span className="font-mono text-xs text-[#172033]/35">/100</span>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#1f7565]">
            {analysis.verdict}
          </p>
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#172033]/38">
            <span>{analysis.companyName ?? "公司未识别"}</span>
            <span className="size-1 rounded-full bg-[#1f8a70]" />
            <span>Zod 已验证</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-balance">
            {analysis.roleTitle}
          </h2>
          <p className="mt-3 max-w-[68ch] text-xs leading-6 text-[#172033]/52 text-pretty">
            {analysis.summary}
          </p>
        </div>
      </header>

      <section className="p-6 sm:p-7" aria-labelledby="requirements-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] text-[#172033]/38">Evidence map</p>
            <h3 id="requirements-title" className="mt-1 text-sm font-semibold">
              岗位要求与简历证据
            </h3>
          </div>
          <p className="font-mono text-[10px] text-[#172033]/38">
            {matchedCount} / {analysis.requirements.length} MATCHED
          </p>
        </div>
        <div className="mt-5 divide-y divide-[#172033]/7 border-y border-[#172033]/7">
          {analysis.requirements.map((item) => (
            <div
              key={`${item.skill}-${item.importance}`}
              className="grid gap-3 py-4 sm:grid-cols-[1.15rem_minmax(8rem,0.65fr)_1fr_auto] sm:items-start"
            >
              <span
                className={`mt-0.5 grid size-[18px] place-items-center rounded-full ${item.matched ? "bg-[#d9efe9] text-[#1f7565]" : "bg-[#f4e5e2] text-[#a54f47]"}`}
              >
                {item.matched ? (
                  <Check className="size-2.5" />
                ) : (
                  <CircleAlert className="size-2.5" />
                )}
              </span>
              <p className="text-xs font-medium">{item.skill}</p>
              <p className="text-[11px] leading-5 text-[#172033]/46">
                {item.evidence}
              </p>
              <span className="font-mono text-[8px] tracking-wider text-[#172033]/30 uppercase">
                {item.importance}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid border-t border-[#172033]/8 lg:grid-cols-2">
        <section
          className="border-b border-[#172033]/8 p-6 sm:p-7 lg:border-r lg:border-b-0"
          aria-labelledby="resume-title"
        >
          <h3 id="resume-title" className="text-sm font-semibold">
            投递前修改简历
          </h3>
          <ol className="mt-5 space-y-4">
            {analysis.resumeSuggestions.slice(0, 3).map((suggestion, index) => (
              <li
                key={suggestion}
                className="grid grid-cols-[1.5rem_1fr] gap-2 text-[11px] leading-5 text-[#172033]/52"
              >
                <span className="font-mono text-[#1f7565]">0{index + 1}</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ol>
          {analysis.missingKeywords.length > 0 && (
            <div className="mt-6 border-t border-[#172033]/7 pt-5">
              <p className="text-[10px] text-[#172033]/38">缺失关键词</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {analysis.missingKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-md bg-[#eff3f0] px-2 py-1 font-mono text-[9px] text-[#172033]/48"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="p-6 sm:p-7" aria-labelledby="interview-title">
          <h3 id="interview-title" className="text-sm font-semibold">
            提前准备这些问题
          </h3>
          <ul className="mt-5 space-y-3">
            {analysis.interviewQuestions.slice(0, 3).map((question) => (
              <li
                key={question}
                className="border-l border-[#1f8a70]/35 pl-3 text-[11px] leading-5 text-[#172033]/52"
              >
                {question}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className="border-t border-[#172033]/8 bg-[#e5f0ec] p-5 sm:px-7"
        aria-label="下一步行动"
      >
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="font-mono text-[9px] tracking-[0.12em] text-[#1f7565] uppercase">
              Recommended next action
            </p>
            <p className="mt-2 text-xs font-semibold leading-5">
              {analysis.nextAction}
            </p>
          </div>
          <ArrowUpRight className="size-5 shrink-0 text-[#1f7565]" />
        </div>
      </section>
    </article>
  );
}
