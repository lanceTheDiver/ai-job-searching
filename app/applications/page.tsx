import { AppHeader } from "@/components/layout/app-header";

export default function ApplicationsPage() {
  return (
    <main className="app-grid min-h-[100dvh] text-[#172033]">
      <AppHeader activeHref="/applications" />
      <section
        aria-labelledby="applications-title"
        className="mx-auto max-w-[1480px] px-4 py-12 sm:px-7 lg:px-10"
      >
        <h1 id="applications-title" className="sr-only">
          投递记录
        </h1>
      </section>
    </main>
  );
}
