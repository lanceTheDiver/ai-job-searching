import { JobSearchWorkspace } from "@/components/jobs/job-search-workspace";
import { AppHeader } from "@/components/layout/app-header";

export default function JobSearchPage() {
  return (
    <main className="app-grid min-h-[100dvh] text-[#172033]">
      <AppHeader activeHref="/job-search" />
      <div className="mx-auto max-w-[1480px] px-4 pt-9 pb-12 sm:px-7 sm:pt-12 lg:px-10 lg:pt-14">
        <header className="mb-8 grid gap-5 border-b border-[#172033]/9 pb-8 lg:grid-cols-[1fr_28rem] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[10px] tracking-[0.16em] text-[#1f7565] uppercase">
              Workspace / Job discovery
            </p>
            <h1
              id="job-search-title"
              className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl"
            >
              从公开岗位里，找到更值得投递的机会。
            </h1>
          </div>
          <p className="text-sm leading-7 text-[#172033]/52">
            AI 会从候选人简历识别适合的岗位方向和搜索范围，再读取 LinkedIn 与
            Boss 直聘岗位要求，逐项比较并按匹配度排序。
          </p>
        </header>
        <JobSearchWorkspace />
      </div>
    </main>
  );
}
