"use client";

import { useEffect } from "react";

type IndividualProjectModuleDataSpotlightProps = {
  onDismiss: () => void;
};

export function IndividualProjectModuleDataSpotlight({
  onDismiss,
}: IndividualProjectModuleDataSpotlightProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-[2px]">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Aizvērt"
        className="absolute right-4 top-4 z-[120] inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-zinc-600 shadow-md transition hover:bg-white hover:text-zinc-900"
      >
        <i className="fas fa-times text-sm" aria-hidden="true" />
      </button>
    </div>
  );
}
