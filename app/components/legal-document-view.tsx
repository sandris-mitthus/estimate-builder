import type { ReactNode } from "react";
import type { LegalDocumentContent } from "@/app/lib/legal/documents";

export function LegalDocumentView({
  content,
  updatedAtLabel,
  sectionExtras,
}: {
  content: LegalDocumentContent;
  updatedAtLabel: string;
  /** Papildu bloks (tabula, rekvizīti), ko rādīt zem konkrētas sadaļas. */
  sectionExtras?: Record<string, ReactNode>;
}) {
  return (
    <article className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {updatedAtLabel}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-zinc-950">
        {content.title}
      </h1>
      <p className="mt-5 text-base leading-8 text-zinc-600">{content.intro}</p>

      <div className="mt-10 space-y-9">
        {content.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-950">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-base leading-8 text-zinc-600">
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
            {sectionExtras?.[section.id] ? (
              <div className="mt-5">{sectionExtras[section.id]}</div>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
