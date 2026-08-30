"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { ResumeInput } from "@/components/resumes/resume-input";
import { requestLinkedInJobSearch } from "@/lib/services/job-search-service";
import type {
  LinkedInJobMatch,
  LinkedInJobSearchRequest,
} from "@/schemas/job-search";
import { useCandidateProfileStore } from "@/stores/candidate-profile-store";

const workplaceOptions = [
  { value: "any", label: "全部办公方式" },
  { value: "remote", label: "远程" },
  { value: "hybrid", label: "混合办公" },
  { value: "onsite", label: "现场办公" },
] as const;

export function JobSearchWorkspace() {
  const resumeText = useCandidateProfileStore((state) => state.resumeText);
  const [workplace, setWorkplace] =
    useState<LinkedInJobSearchRequest["workplace"]>("any");
  const [results, setResults] = useState<LinkedInJobMatch[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);

  const canSearch = resumeText.trim().length >= 80;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSearching(true);
    try {
      setResults(
        await requestLinkedInJobSearch({
          resumeText,
          workplace,
        }),
      );
    } catch (caughtError) {
      setResults([]);
      setError(
        caughtError instanceof Error ? caughtError.message : "岗位搜索失败",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_18px_55px_rgba(23,32,51,0.055)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#172033]/8 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold">候选人简历</p>
            <p className="mt-1 text-[11px] text-[#172033]/38">
              与岗位分析共用，修改后会自动保存在当前浏览器
            </p>
          </div>
          <span className="rounded-full bg-[#e8f3ef] px-3 py-1.5 font-mono text-[9px] text-[#1f7565]">
            SHARED PROFILE
          </span>
        </div>
        <ResumeInput
          disabled={isSearching}
          onError={setError}
          onUploadingChange={setIsResumeUploading}
        />
      </section>

      <section aria-labelledby="linkedin-search-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.14em] text-[#1f7565] uppercase">
              Source 01 / LinkedIn
            </p>
            <h2
              id="linkedin-search-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.04em]"
            >
              搜索并匹配岗位
            </h2>
          </div>
          <p className="hidden max-w-sm text-right text-[11px] leading-5 text-[#172033]/38 sm:block">
            调用公开职位页面，每次最多分析 5 个结果
            <br />
            仅供个人低频使用
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="rounded-[22px] bg-[#172033] p-4 text-white sm:p-5"
          aria-busy={isSearching}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_13rem_auto] sm:items-end">
            <div className="self-center">
              <p className="text-xs font-medium text-white/90">
                AI 将从简历自动提取目标岗位与搜索地点
              </p>
              <p className="mt-1 text-[10px] leading-5 text-white/40">
                获取公开职位后，会根据简历证据计算匹配度并排序
              </p>
            </div>
            <label className="grid gap-2 text-[10px] text-white/48">
              办公方式
              <select
                value={workplace}
                onChange={(event) =>
                  setWorkplace(
                    event.target.value as LinkedInJobSearchRequest["workplace"],
                  )
                }
                className="h-11 rounded-[10px] border border-white/10 bg-white/7 px-3 text-xs text-white outline-none focus:border-[#9ce0cf]/55"
              >
                {workplaceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={!canSearch || isSearching || isResumeUploading}
              className="mt-auto flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#9ce0cf] px-5 text-xs font-semibold text-[#172033] transition-all hover:-translate-y-0.5 hover:bg-[#b3eadc] focus-visible:ring-4 focus-visible:ring-[#9ce0cf]/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
            >
              {isSearching ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              {isSearching ? "搜索并匹配中" : "搜索岗位"}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-[14px] border border-[#b6574d]/20 bg-[#fff8f6] px-4 py-3 text-xs leading-5 text-[#9d443d]"
        >
          {error}
        </div>
      )}

      <JobSearchResults results={results} isSearching={isSearching} />
    </div>
  );
}

function JobSearchResults({
  results,
  isSearching,
}: {
  results: LinkedInJobMatch[];
  isSearching: boolean;
}) {
  if (isSearching) {
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
          {results.length} JOBS / SORTED BY FIT
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
              <h3 className="text-lg font-semibold tracking-[-0.03em]">
                {job.title}
              </h3>
              <p className="mt-1 text-xs text-[#172033]/45">
                {[job.company, job.location, job.postedAt]
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
