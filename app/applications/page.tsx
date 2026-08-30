import { ApplicationRecords } from "@/components/applications/application-records";
import { AppHeader } from "@/components/layout/app-header";

export default function ApplicationsPage() {
  return (
    <main className="app-grid min-h-[100dvh] text-[#172033]">
      <AppHeader activeHref="/applications" />
      <section
        aria-labelledby="applications-title"
        className="mx-auto max-w-[1480px] px-4 py-12 sm:px-7 lg:px-10"
      >
        <ApplicationRecords />
      </section>
    </main>
  );
}
