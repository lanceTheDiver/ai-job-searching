import { SearchHistory } from "@/components/jobs/search-history";
import { AppHeader } from "@/components/layout/app-header";

export default function SearchHistoryPage() {
  return (
    <main className="app-grid min-h-[100dvh] text-[#172033]">
      <AppHeader activeHref="/search-history" />
      <section
        aria-labelledby="search-history-title"
        className="mx-auto w-full max-w-[1480px] px-4 py-12 sm:px-7 lg:px-10"
      >
        <SearchHistory />
      </section>
    </main>
  );
}
