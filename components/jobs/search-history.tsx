"use client";

import { useEffect, useState } from "react";
import { Clock3, History, LoaderCircle, RefreshCw } from "lucide-react";

import {
  JobSearchNotices,
  JobSearchResults,
} from "@/components/jobs/job-search-results";
import { fetchSearchHistoryRecords } from "@/lib/services/search-history-service";
import type { Workplace } from "@/schemas/job-search";
import type { SearchHistoryRecord } from "@/schemas/search-history";

const workplaceLabels: Record<Workplace, string> = {
  any: "全部办公方式",
  remote: "远程",
  hybrid: "混合办公",
  onsite: "现场办公",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function historyTitle(record: SearchHistoryRecord) {
  if (record.criteria?.keywords) return record.criteria.keywords;
  if (record.jobs[0]?.title) return record.jobs[0].title;
  return "岗位搜索";
}

export function SearchHistory() {
  const [records, setRecords] = useState<SearchHistoryRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords() {
    setError("");
    setIsLoading(true);
    try {
      const data = await fetchSearchHistoryRecords();
      setRecords(data);
      setSelectedId((current) =>
        data.some((record) => record.id === current)
          ? current
          : (data[0]?.id ?? ""),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "读取搜索历史失败",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;
    void fetchSearchHistoryRecords()
      .then((data) => {
        if (!isActive) return;
        setRecords(data);
        setSelectedId(data[0]?.id ?? "");
      })
      .catch((caughtError: unknown) => {
        if (isActive) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "读取搜索历史失败",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const selected =
    records.find((record) => record.id === selectedId) ?? records[0] ?? null;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#172033]/9 pb-7">
        <div>
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#1f7565] uppercase">
            Search archive / Local
          </p>
          <h1
            id="search-history-title"
            className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl"
          >
            搜索历史
          </h1>
          <p className="mt-3 text-xs leading-6 text-[#172033]/48">
            搜索结果保存在当前设备，刷新后仍可查看岗位并继续辅助投递。
          </p>
        </div>
        <button
          type="button"
          onClick={loadRecords}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-[9px] border border-[#172033]/10 bg-white px-3 py-2 text-[11px] disabled:opacity-40"
        >
          <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-[#fff8f6] p-3 text-xs text-[#9d5148]"
        >
          {error}
        </p>
      )}

      {isLoading && records.length === 0 ? (
        <div className="grid min-h-64 place-items-center text-xs text-[#172033]/45">
          <span className="flex items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" /> 正在读取搜索历史
          </span>
        </div>
      ) : records.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-[20px] border border-dashed border-[#172033]/12 bg-white/55 text-center">
          <div>
            <History className="mx-auto size-6 text-[#172033]/25" />
            <p className="mt-3 text-sm font-semibold">还没有搜索历史</p>
            <p className="mt-1 text-xs text-[#172033]/40">
              完成一次岗位搜索后，结果会自动保存在这里。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside aria-label="历史搜索批次" className="space-y-2">
            {records.map((record) => {
              const isActive = record.id === selected?.id;
              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedId(record.id)}
                  className={`w-full rounded-[14px] border p-4 text-left transition-colors ${
                    isActive
                      ? "border-[#1f7565]/22 bg-white"
                      : "border-transparent bg-white/48 hover:bg-white/75"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold">
                    {historyTitle(record)}
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#172033]/42">
                    <span className="flex items-center gap-1">
                      <Clock3 className="size-3" />
                      {formatDateTime(record.createdAt)}
                    </span>
                    <span>{record.jobs.length} 个岗位</span>
                  </span>
                </button>
              );
            })}
          </aside>

          {selected && (
            <section className="min-w-0">
              <div className="mb-5 rounded-[16px] bg-white/62 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.035em]">
                      {historyTitle(selected)}
                    </h2>
                    <p className="mt-1 text-[11px] text-[#172033]/42">
                      {[
                        selected.criteria?.location ||
                          selected.criteria?.bossCity,
                        workplaceLabels[selected.workplace],
                        selected.resumeFileName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#e8f3ef] px-3 py-1.5 font-mono text-[9px] text-[#1f7565]">
                    {selected.completedAt
                      ? "SEARCH COMPLETE"
                      : `${selected.completedSources.length}/2 SOURCES`}
                  </span>
                </div>
              </div>

              {selected.notices.length > 0 && (
                <div className="mb-4">
                  <JobSearchNotices notices={selected.notices} />
                </div>
              )}
              {selected.errors.map((item) => (
                <p
                  key={item.source}
                  className="mb-3 rounded-xl bg-[#fff8f6] p-3 text-xs text-[#9d5148]"
                >
                  {item.source === "boss" ? "Boss 直聘" : "LinkedIn"}：
                  {item.message}
                </p>
              ))}
              <JobSearchResults results={selected.jobs} isSearching={false} />
              {selected.jobs.length === 0 && (
                <div className="rounded-[18px] border border-dashed border-[#172033]/12 bg-white/45 p-10 text-center text-xs text-[#172033]/42">
                  本次搜索没有保存到可展示的岗位。
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
