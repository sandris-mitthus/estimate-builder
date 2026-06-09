import Link from "next/link";
import type { ReactNode } from "react";

type ListEntryCardProps = {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  href?: string;
  className?: string;
};

function CardContent({
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
}: Omit<ListEntryCardProps, "href" | "className">) {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {primaryLabel}
      </p>
      <p className="mt-1 text-base font-semibold text-zinc-900 group-hover:text-zinc-700">
        {primaryValue}
      </p>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {secondaryLabel}
      </p>
      <p className="mt-1 text-sm text-zinc-600">{secondaryValue}</p>
    </>
  );
}

const cardClassName =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md";

export function ListEntryCard({
  href,
  className = "",
  ...content
}: ListEntryCardProps) {
  if (href) {
    return (
      <Link href={href} className={`group block ${cardClassName} ${className}`}>
        <CardContent {...content} />
      </Link>
    );
  }

  return (
    <div className={`${cardClassName} ${className}`}>
      <CardContent {...content} />
    </div>
  );
}

export function ListEntryGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
