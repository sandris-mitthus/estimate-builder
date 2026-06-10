"use client";

import { Tooltip } from "@/app/components/tooltip";

type IconActionButtonProps = {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: "edit" | "delete" | "approve" | "reject" | "moduleData";
  highlighted?: boolean;
  spotlight?: boolean;
  className?: string;
};

const variantClassName = {
  edit: "text-zinc-400 hover:bg-sky-50 hover:text-sky-600",
  delete: "text-zinc-400 hover:bg-red-50 hover:text-red-600",
  approve: "text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600",
  reject: "text-zinc-400 hover:bg-orange-50 hover:text-orange-600",
  moduleData: "text-zinc-400 hover:bg-violet-50 hover:text-violet-600",
};

const highlightedVariantClassName = {
  moduleData:
    "bg-amber-50 text-amber-600 ring-2 ring-amber-400/70 hover:bg-amber-100 hover:text-amber-700",
};

export function IconActionButton({
  label,
  icon,
  onClick,
  variant = "edit",
  highlighted = false,
  spotlight = false,
  className = "",
}: IconActionButtonProps) {
  const toneClassName =
    highlighted && variant in highlightedVariantClassName
      ? highlightedVariantClassName[variant as keyof typeof highlightedVariantClassName]
      : variantClassName[variant];

  const spotlightClassName = spotlight
    ? "relative z-[110] bg-white shadow-[0_0_0_4px_rgba(251,191,36,0.55),0_8px_24px_rgba(0,0,0,0.35)]"
    : "";

  return (
    <Tooltip label={label} elevated={spotlight}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${toneClassName} ${spotlightClassName} ${className}`.trim()}
      >
        <i className={`${icon} text-sm`} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
