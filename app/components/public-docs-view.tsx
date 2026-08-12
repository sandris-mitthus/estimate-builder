"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/app/components/site-footer";
import type {
  SiteDocCategorySummary,
  SiteDocSummary,
} from "@/app/lib/site-admin/repository";

export type PublicDocsCapability = {
  title: string;
  description: string;
};

export type PublicDocsLabels = {
  backToLogin: string;
  title: string;
  subtitle: string;
  navLabel: string;
  getStartedNav: string;
  getStartedEyebrow: string;
  getStartedTitle: string;
  getStartedBody1: string;
  getStartedBody2: string;
  capabilitiesTitle: string;
  capabilities: PublicDocsCapability[];
  browseTitle: string;
  browseSubtitle: string;
  categoryLabel: string;
  emptyCategory: string;
  emptyTitle: string;
  emptyDescription: string;
  backToList: string;
  openArticle: string;
};

function firstCategoryId(categories: SiteDocCategorySummary[]) {
  return categories.find((category) => category.docs.length > 0)?.id ?? categories[0]?.id ?? null;
}

function findDoc(categories: SiteDocCategorySummary[], docId: string | null) {
  if (!docId) return null;

  for (const category of categories) {
    const doc = category.docs.find((item) => item.id === docId);
    if (doc) {
      return { doc, category };
    }
  }

  return null;
}

function docHash(docId: string) {
  return `doc-${docId}`;
}

function getDocIdFromHash(hash: string) {
  return hash.startsWith("#doc-") ? hash.slice("#doc-".length) : null;
}

function setArticleHash(docId: string | null) {
  if (docId) {
    window.history.replaceState(null, "", `#${docHash(docId)}`);
    return;
  }

  window.history.replaceState(null, "", window.location.pathname);
}

type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function splitContent(description: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  for (const chunk of description.split(/\n{2,}/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    const listItems = lines
      .filter((line) => /^[-•]\s+/.test(line))
      .map((line) => line.replace(/^[-•]\s+/, "").trim())
      .filter(Boolean);

    if (listItems.length > 0 && listItems.length === lines.length) {
      blocks.push({ type: "list", items: listItems });
      continue;
    }

    blocks.push({ type: "paragraph", text: lines.join(" ") });
  }

  return blocks;
}

function DocsCard({
  doc,
  onSelect,
  openArticleLabel,
}: {
  doc: SiteDocSummary;
  onSelect: (docId: string) => void;
  openArticleLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(doc.id)}
      className="group min-h-28 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
    >
      <span className="flex items-start justify-between gap-4">
        <span className="min-w-0">
          <span className="block text-base font-semibold tracking-[-0.03em] text-zinc-950">
            {doc.title}
          </span>
          <span className="mt-2 line-clamp-2 block text-sm leading-6 text-zinc-500">
            {doc.description}
          </span>
        </span>
        <span
          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition group-hover:bg-blue-50 group-hover:text-blue-600"
          aria-hidden="true"
        >
          <i className="fas fa-arrow-right text-xs" />
        </span>
      </span>
      <span className="sr-only">{openArticleLabel}</span>
    </button>
  );
}

export function PublicDocsView({
  systemName,
  categories,
  labels,
}: {
  systemName: string;
  categories: SiteDocCategorySummary[];
  labels: PublicDocsLabels;
}) {
  const visibleCategories = useMemo(
    () => categories.filter((category) => category.title.trim() || category.docs.length > 0),
    [categories],
  );
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => new Set(firstCategoryId(visibleCategories) ? [firstCategoryId(visibleCategories)!] : []),
  );
  const selected = useMemo(
    () => findDoc(visibleCategories, selectedDocId),
    [selectedDocId, visibleCategories],
  );
  const showingOverview = selected == null;

  useEffect(() => {
    const initialDocId = getDocIdFromHash(window.location.hash);
    const initialDoc = findDoc(visibleCategories, initialDocId);
    if (!initialDoc) return;

    setSelectedDocId(initialDoc.doc.id);
    setExpandedCategoryIds((current) => new Set(current).add(initialDoc.category.id));
  }, [visibleCategories]);

  function toggleCategory(categoryId: string) {
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function selectDoc(docId: string) {
    const next = findDoc(visibleCategories, docId);
    if (!next) return;

    setSelectedDocId(docId);
    setExpandedCategoryIds((current) => new Set(current).add(next.category.id));
    setArticleHash(docId);
  }

  function showOverview() {
    setSelectedDocId(null);
    setArticleHash(null);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto min-h-screen max-w-7xl px-5 py-6 lg:px-8">
        <aside className="mb-8 lg:fixed lg:bottom-6 lg:left-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:top-6 lg:mb-0 lg:w-72">
          <div className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.10)]">
            <Link
              href="/login"
              className="inline-flex text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
            >
              {labels.backToLogin}
            </Link>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {systemName}
              </p>
              <button
                type="button"
                onClick={showOverview}
                className="mt-2 block text-left text-2xl font-semibold tracking-[-0.05em] text-zinc-950 transition hover:text-blue-700"
              >
                {labels.title}
              </button>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{labels.subtitle}</p>
            </div>

            <nav
              className="mt-7 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
              aria-label={labels.navLabel}
            >
              <button
                type="button"
                onClick={showOverview}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  showingOverview
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {labels.getStartedNav}
              </button>

              {visibleCategories.map((category) => {
                const expanded = expandedCategoryIds.has(category.id);
                return (
                  <section key={category.id}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="flex w-full items-center justify-between gap-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 transition hover:text-zinc-800"
                    >
                      <span>{category.title}</span>
                      <i
                        className={`fas ${expanded ? "fa-minus" : "fa-plus"} text-[10px]`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="mt-2 space-y-1">
                          {category.docs.map((doc) => {
                            const active = selectedDocId === doc.id;
                            return (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => selectDoc(doc.id)}
                                className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                                  active
                                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                                }`}
                              >
                                {doc.title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 lg:ml-[20rem]">
          {visibleCategories.length === 0 ? (
            <article className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-[0_16px_45px_rgba(24,24,27,0.08)] md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {labels.categoryLabel}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-zinc-950">
                {labels.emptyTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-500">
                {labels.emptyDescription}
              </p>
            </article>
          ) : selected ? (
            <article className="max-w-4xl">
              <button
                type="button"
                onClick={showOverview}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
                {labels.backToList}
              </button>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {selected.category.title}
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-zinc-950 md:text-5xl">
                {selected.doc.title}
              </h1>
              <div className="mt-8 max-w-3xl space-y-5 text-base leading-8 text-zinc-600">
                {splitContent(selected.doc.description).map((block, index) =>
                  block.type === "list" ? (
                    <ul key={`list-${index}`} className="list-disc space-y-2 pl-5">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={block.text}>{block.text}</p>
                  ),
                )}
              </div>
            </article>
          ) : (
            <div className="max-w-4xl space-y-12">
              <article>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {labels.getStartedEyebrow}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-zinc-950 md:text-5xl">
                  {labels.getStartedTitle}
                </h1>
                <div className="mt-6 max-w-3xl space-y-5 text-base leading-8 text-zinc-600">
                  <p>{labels.getStartedBody1}</p>
                  <p>{labels.getStartedBody2}</p>
                </div>
              </article>

              <section className="space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
                    {labels.capabilitiesTitle}
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {labels.capabilities.map((capability) => (
                    <div
                      key={capability.title}
                      className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm"
                    >
                      <h3 className="text-base font-semibold tracking-[-0.03em] text-zinc-950">
                        {capability.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        {capability.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
                    {labels.browseTitle}
                  </h2>
                  <p className="mt-2 max-w-3xl text-base leading-7 text-zinc-500">
                    {labels.browseSubtitle}
                  </p>
                </div>

                {visibleCategories.map((category) => (
                  <section key={category.id} className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      {category.title}
                    </h3>
                    {category.docs.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {category.docs.map((doc) => (
                          <DocsCard
                            key={doc.id}
                            doc={doc}
                            onSelect={selectDoc}
                            openArticleLabel={labels.openArticle}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-500">
                        {labels.emptyCategory}
                      </p>
                    )}
                  </section>
                ))}
              </section>
            </div>
          )}
        </section>

        <SiteFooter
          systemName={systemName}
          className="mt-12 lg:ml-[20rem]"
        />
      </div>
    </main>
  );
}
