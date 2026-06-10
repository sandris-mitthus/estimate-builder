import type { ComponentProps } from "react";
import { formInputFullWidthClass } from "@/app/lib/form/input-styles";

type InputWithSuffixProps = {
  suffix: string;
  invalid?: boolean;
} & Omit<ComponentProps<"input">, "className">;

export function InputWithSuffix({
  suffix,
  invalid = false,
  ...inputProps
}: InputWithSuffixProps) {
  const borderClassName = invalid
    ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-500/10"
    : "border-zinc-200 focus-within:border-zinc-400 focus-within:ring-zinc-900/5";

  return (
    <div
      className={`flex w-full overflow-hidden rounded-lg border bg-white transition focus-within:ring-2 ${borderClassName}`}
    >
      <input
        {...inputProps}
        className={`${formInputFullWidthClass} min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-0`}
        aria-invalid={invalid || undefined}
      />
      <span className="flex shrink-0 items-center border-l border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500">
        {suffix}
      </span>
    </div>
  );
}
