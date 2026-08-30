"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, LogIn, Search } from "lucide-react";

import {
  JobSearchNotices,
  JobSearchResults,
} from "@/components/jobs/job-search-results";
import { ResumeInput } from "@/components/resumes/resume-input";
import { requestJobSearch } from "@/lib/services/job-search-service";
import type {
  JobMatch,
  JobSearchNotice,
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
  const [results, setResults] = useState<JobMatch[]>([]);
  const [notices, setNotices] = useState<JobSearchNotice[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);

  const canSearch = resumeText.trim().length >= 80;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotices([]);
    setIsSearching(true);
    try {
      const response = await requestJobSearch({ resumeText, workplace });
      setResults(response.results);
      setNotices(response.notices);
    } catch (caughtError) {
      setResults([]);
      setNotices([]);
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

      <section aria-labelledby="job-provider-search-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.14em] text-[#1f7565] uppercase">
              Sources / LinkedIn + Boss 直聘
            </p>
            <h2
              id="job-provider-search-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.04em]"
            >
              搜索并匹配岗位
            </h2>
          </div>
          <p className="hidden max-w-sm text-right text-[11px] leading-5 text-[#172033]/38 sm:block">
            每个平台最多保留 10 个岗位并统一分析
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-4 text-[10px] leading-5 text-white/45">
            <span className="flex items-center gap-2">
              <LogIn className="size-3.5 text-[#9ce0cf]" />
              搜索 Boss 直聘前，请先在 Chrome 登录并启用 OpenCLI Browser
              Bridge。
            </span>
            <a
              href="https://www.zhipin.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[#9ce0cf] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ce0cf]/30"
            >
              前往 Boss 直聘登录
            </a>
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

      {notices.length > 0 && <JobSearchNotices notices={notices} />}

      <JobSearchResults results={results} isSearching={isSearching} />
    </div>
  );
}
