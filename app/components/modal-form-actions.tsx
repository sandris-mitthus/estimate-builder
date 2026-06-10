import type { ReactNode } from "react";

type ModalFormActionsProps = {
  onCancel: () => void;
  cancelDisabled?: boolean;
  children: ReactNode;
};

export function ModalFormActions({
  onCancel,
  cancelDisabled = false,
  children,
}: ModalFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={cancelDisabled}
        className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Atcelt
      </button>
      {children}
    </div>
  );
}
