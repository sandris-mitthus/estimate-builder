"use client";

import { Tooltip } from "@/app/components/tooltip";

type IconActionButtonProps = {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: "edit" | "delete" | "approve" | "reject";
  className?: string;
};

const variantClassName = {
  edit: "text-zinc-400 hover:bg-sky-50 hover:text-sky-600",
  delete: "text-zinc-400 hover:bg-red-50 hover:text-red-600",
  approve: "text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600",
  reject: "text-zinc-400 hover:bg-orange-50 hover:text-orange-600",
};

export function IconActionButton({
  label,
  icon,
  onClick,
  variant = "edit",
  className = "",
}: IconActionButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${variantClassName[variant]} ${className}`.trim()}
      >
        <i className={`${icon} text-sm`} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
