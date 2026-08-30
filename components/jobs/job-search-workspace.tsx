"use client";

import { useState, type FormEvent } from "react";

import { JobSearchForm } from "@/components/jobs/job-search-form";
import {
  JobSearchNotices,
  JobSearchResults,
} from "@/components/jobs/job-search-results";
import { ResumeInput } from "@/components/resumes/resume-input";
import {
  requestJobSearch,
  requestJobSearchCriteria,
} from "@/lib/services/job-search-service";
import {
  createSearchHistoryRecord,
  updateSearchHistoryRecord,
} from "@/lib/services/search-history-service";
import type {
  JobMatch,
  JobSearchCriteria,
  JobSource,
  JobSearchNotice,
  Workplace,
} from "@/schemas/job-search";
import { useCandidateProfileStore } from "@/stores/candidate-profile-store";

const jobSources = ["linkedin", "boss"] as const satisfies JobSource[];
const sourceLabels: Record<JobSource, string> = {
  linkedin: "LinkedIn",
  boss: "Boss 直聘",
};

export function JobSearchWorkspace() {
  const resumeText = useCandidateProfileStore((state) => state.resumeText);
  const resumeFileName = useCandidateProfileStore(
    (state) => state.resumeFileName,
  );
  const [workplace, setWorkplace] = useState<Workplace>("any");
  const [criteria, setCriteria] = useState<JobSearchCriteria>({
    keywords: "",
    bossKeywords: "",
    location: null,
    bossCity: "全国",
  });
  const [results, setResults] = useState<JobMatch[]>([]);
  const [notices, setNotices] = useState<JobSearchNotice[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isResumeUploading, setIsResumeUploading] = useState(false);

  const visibleLocation = criteria.location ?? criteria.bossCity;
  const canSearch =
    resumeText.trim().length >= 80 &&
    criteria.keywords.trim().length >= 2 &&
    visibleLocation.trim().length >= 2;

  async function fillCriteriaFromResume(parsedResumeText: string) {
    try {
      const suggested = await requestJobSearchCriteria({
        resumeText: parsedResumeText,
        workplace,
      });
      setCriteria({
        ...suggested,
        location:
          suggested.location ??
          (workplace === "remote" ? "Remote" : "Worldwide"),
      });
    } catch (caughtError) {
      setError(
        `简历已解析，但自动填写搜索条件失败：${
          caughtError instanceof Error ? caughtError.message : "未知错误"
        }`,
      );
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotices([]);
    setResults([]);
    setIsSearching(true);
    try {
      const setupMessages: string[] = [];
      let historyId = "";
      try {
        const history = await createSearchHistoryRecord({
          workplace,
          resumeFileName: resumeFileName || null,
        });
        historyId = history.id;
      } catch (caughtError) {
        setupMessages.push(
          caughtError instanceof Error
            ? `无法创建搜索历史：${caughtError.message}`
            : "无法创建搜索历史",
        );
      }

      const searches = jobSources.map(async (source) => {
        let response: Awaited<ReturnType<typeof requestJobSearch>>;
        try {
          response = await requestJobSearch(
            { resumeText, workplace, criteria },
            source,
          );
        } catch (caughtError) {
          const message =
            caughtError instanceof Error
              ? caughtError.message
              : `${sourceLabels[source]} 搜索失败`;
          if (historyId) {
            await updateSearchHistoryRecord(historyId, {
              source,
              jobs: [],
              notices: [],
              error: message,
            }).catch(() => undefined);
          }
          throw caughtError;
        }

        setResults((current) => {
          const incomingIds = new Set(response.results.map((job) => job.id));
          return [
            ...current.filter((job) => !incomingIds.has(job.id)),
            ...response.results,
          ].sort((a, b) => b.matchScore - a.matchScore);
        });
        setNotices((current) => [
          ...current.filter((notice) => notice.source !== source),
          ...response.notices,
        ]);

        if (historyId) {
          try {
            await updateSearchHistoryRecord(historyId, {
              source,
              jobs: response.results,
              notices: response.notices,
              criteria: response.criteria,
              error: null,
            });
          } catch (caughtError) {
            throw new Error(
              `${sourceLabels[source]} 搜索成功，但历史保存失败：${
                caughtError instanceof Error ? caughtError.message : "未知错误"
              }`,
            );
          }
        }
      });
      const outcomes = await Promise.allSettled(searches);
      const messages = outcomes.flatMap((outcome) =>
        outcome.status === "rejected"
          ? [
              outcome.reason instanceof Error
                ? outcome.reason.message
                : "岗位搜索失败",
            ]
          : [],
      );
      setError([...new Set([...setupMessages, ...messages])].join("；"));
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
          onParsedResume={fillCriteriaFromResume}
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

        <JobSearchForm
          criteria={criteria}
          workplace={workplace}
          isSearching={isSearching}
          isDisabled={!canSearch || isSearching || isResumeUploading}
          onCriteriaChange={setCriteria}
          onWorkplaceChange={setWorkplace}
          onSubmit={handleSearch}
        />
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
