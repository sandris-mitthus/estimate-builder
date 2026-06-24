"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  SiteDocCategorySummary,
  SiteDocSummary,
} from "@/app/lib/site-admin/repository";

export type PublicDocsLabels = {
  backToLogin: string;
  title: string;
  subtitle: string;
  navLabel: string;
  allDocsTitle: string;
  allDocsSubtitle: string;
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

function splitContent(description: string) {
  return description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
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

  function showAllDocs() {
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
                onClick={showAllDocs}
                className="mt-2 block text-left text-2xl font-semibold tracking-[-0.05em] text-zinc-950 transition hover:text-blue-700"
              >
                {labels.title}
              </button>
            </div>

            <nav
              className="mt-7 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
              aria-label={labels.navLabel}
            >
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
                onClick={showAllDocs}
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
                {splitContent(selected.doc.description).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ) : (
            <div className="space-y-12">
              {visibleCategories.map((category) => (
                <section key={category.id} className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {category.title}
                  </h2>
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
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
