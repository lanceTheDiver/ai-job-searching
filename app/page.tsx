import { JobAnalyzer } from "@/components/jobs/job-analyzer";

const navItems = ["岗位分析", "简历版本", "投递记录"];

export default function Home() {
  return (
    <main id="main-content" className="app-grid min-h-[100dvh] text-[#172033]">
      <a
        href="#workspace"
        className="fixed top-3 left-3 z-50 -translate-y-20 bg-[#172033] px-4 py-2 text-sm text-white transition-transform focus:translate-y-0"
      >
        跳到分析工作区
      </a>

      <header className="border-b border-[#172033]/8 bg-[#f1f3f0]/92">
        <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-6 px-4 sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-10">
            <div className="flex shrink-0 items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[11px] bg-[#172033] font-mono text-xs font-bold text-[#9ce0cf]">
                AP
              </span>
              <div>
                <p className="text-sm font-semibold tracking-[-0.025em]">
                  ApplyPilot
                </p>
                <p className="text-[10px] text-[#172033]/38">AI 求职实验室</p>
              </div>
            </div>

            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="产品导航"
            >
              {navItems.map((item, index) => (
                <span
                  key={item}
                  aria-current={index === 0 ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    index === 0
                      ? "bg-white text-[#172033] shadow-[0_1px_2px_rgba(23,32,51,0.06)]"
                      : "cursor-not-allowed text-[#172033]/32"
                  }`}
                >
                  {item}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden font-mono text-[10px] text-[#172033]/36 sm:block">
              BUILD 01 / 05
            </span>
            <span className="h-4 w-px bg-[#172033]/10" />
            <span className="flex items-center gap-2 text-xs text-[#172033]/55">
              <span className="size-1.5 rounded-full bg-[#1f8a70] ring-4 ring-[#1f8a70]/10" />
              本地工作区
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 pt-9 pb-10 sm:px-7 sm:pt-12 lg:px-10 lg:pt-14">
        <header className="grid gap-7 border-b border-[#172033]/9 pb-9 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-end">
          <div>
            <p className="mb-4 font-mono text-[10px] tracking-[0.16em] text-[#1f7565] uppercase">
              Workspace / Job intelligence
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.04] font-semibold tracking-[-0.055em] text-balance sm:text-5xl lg:text-[3.6rem]">
              先用证据判断匹配，
              <br className="hidden sm:block" />
              再决定是否投递。
            </h1>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-[58ch] text-sm leading-7 text-[#172033]/52 text-pretty">
              粘贴职位描述和简历。系统会拆解岗位要求、从经历中寻找证据，并用经过
              Zod 验证的结构化数据生成报告。
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-[#172033]/36">
              <span>01 输入</span>
              <span>02 推理</span>
              <span>03 验证</span>
              <span>04 行动</span>
            </div>
          </div>
        </header>

        <section
          id="workspace"
          className="scroll-mt-5 pt-7"
          aria-labelledby="workspace-title"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#172033]/38">当前任务</p>
              <h2
                id="workspace-title"
                className="mt-1 text-lg font-semibold tracking-[-0.025em]"
              >
                创建岗位匹配报告
              </h2>
            </div>
            <p className="hidden text-right text-[11px] leading-5 text-[#172033]/36 sm:block">
              输入只发送至服务端分析接口
              <br />
              API key 不会进入浏览器
            </p>
          </div>
          <JobAnalyzer />
        </section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-[#172033]/8 pt-5 text-[10px] text-[#172033]/34 sm:flex-row sm:items-center sm:justify-between">
          <p>下一阶段：保存岗位、管理简历版本与记录投递状态。</p>
          <p className="font-mono">NEXT.JS 16 · RESPONSES API · ZOD 4</p>
        </footer>
      </div>
    </main>
  );
}
