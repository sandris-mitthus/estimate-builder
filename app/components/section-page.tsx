import { PageSectionHeader } from "@/app/components/page-section-header";
import type { ReactNode } from "react";

export function SectionPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="page">
      <div className="space-y-3">
        <PageSectionHeader title={title} subtitle={subtitle} />
        {children}
      </div>
    </main>
  );
}
