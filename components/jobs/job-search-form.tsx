import { LoaderCircle, LogIn, Search } from "lucide-react";
import type { FormEvent } from "react";

import type { JobSearchCriteria, Workplace } from "@/schemas/job-search";

const workplaceOptions = [
  { value: "any", label: "全部办公方式" },
  { value: "remote", label: "远程" },
  { value: "hybrid", label: "混合办公" },
  { value: "onsite", label: "现场办公" },
] as const;

type JobSearchFormProps = {
  criteria: JobSearchCriteria;
  workplace: Workplace;
  isSearching: boolean;
  isDisabled: boolean;
  onCriteriaChange: (criteria: JobSearchCriteria) => void;
  onWorkplaceChange: (workplace: Workplace) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function JobSearchForm({
  criteria,
  workplace,
  isSearching,
  isDisabled,
  onCriteriaChange,
  onWorkplaceChange,
  onSubmit,
}: JobSearchFormProps) {
  const visibleLocation = criteria.location ?? criteria.bossCity;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[22px] bg-[#172033] p-4 text-white sm:p-5"
      aria-busy={isSearching}
    >
      <div className="mb-4">
        <p className="text-xs font-medium text-white/90">
          上传简历后 AI 会自动填写，搜索前仍可手动调整
        </p>
        <p className="mt-1 text-[10px] leading-5 text-white/40">
          最终填写的岗位、地点和办公方式会同时用于岗位搜索与历史记录
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_13rem_auto] xl:items-end">
        <label className="grid gap-2 text-[10px] text-white/48">
          岗位
          <input
            value={criteria.keywords}
            onChange={(event) => {
              const keywords = event.target.value;
              onCriteriaChange({
                ...criteria,
                keywords,
                bossKeywords: keywords,
              });
            }}
            placeholder="例如 Frontend Engineer"
            maxLength={100}
            className="h-11 rounded-[10px] border border-white/10 bg-white/7 px-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#9ce0cf]/55"
          />
        </label>
        <label className="grid gap-2 text-[10px] text-white/48">
          工作地点
          <input
            value={visibleLocation}
            onChange={(event) =>
              onCriteriaChange({
                ...criteria,
                location: event.target.value,
              })
            }
            placeholder="例如 Kuala Lumpur 或 上海"
            maxLength={100}
            className="h-11 rounded-[10px] border border-white/10 bg-white/7 px-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#9ce0cf]/55"
          />
        </label>
        <label className="grid gap-2 text-[10px] text-white/48">
          办公方式
          <select
            value={workplace}
            onChange={(event) =>
              onWorkplaceChange(event.target.value as Workplace)
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
          disabled={isDisabled}
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
          搜索 Boss 直聘前，请先在 Chrome 登录并启用 OpenCLI Browser Bridge。
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
  );
}
