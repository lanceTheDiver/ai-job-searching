import Link from "next/link";

const navItems = [
  { label: "岗位分析", href: "/" },
  { label: "岗位搜索", href: "/job-search" },
  { label: "搜索历史", href: "/search-history" },
  { label: "投递记录", href: "/applications" },
] as const;

type AppHeaderProps = {
  activeHref: (typeof navItems)[number]["href"];
};

export function AppHeader({ activeHref }: AppHeaderProps) {
  return (
    <header className="border-b border-[#172033]/8 bg-[#f1f3f0]/92">
      <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-6 px-4 sm:px-7 lg:px-10">
        <div className="flex min-w-0 items-center gap-10">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[11px] bg-[#172033] font-mono text-xs font-bold text-[#9ce0cf]">
              AP
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[-0.025em]">
                ApplyPilot
              </span>
              <span className="block text-[10px] text-[#172033]/38">
                AI 求职实验室
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="产品导航"
          >
            {navItems.map((item) => {
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white text-[#172033] shadow-[0_1px_2px_rgba(23,32,51,0.06)]"
                      : "text-[#172033]/48 hover:bg-white/55 hover:text-[#172033]/75"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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
  );
}
