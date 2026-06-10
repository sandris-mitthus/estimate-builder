"use client";

import type { ReactNode } from "react";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

export function ModuleProjectDescriptionForm() {
  return (
    <section className="min-w-0">
      <h2 className="text-sm font-semibold text-zinc-900">Projekta apraksts</h2>

      <div className="mt-3 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Field label="Īsais apraksts" id="module-desc-summary">
          <textarea
            id="module-desc-summary"
            rows={4}
            placeholder="Īss projekta kopsavilkums…"
            className={`${formInputFullWidthClass} ${formInputClassName()} resize-y`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platība (m²)" id="module-desc-area">
            <input
              id="module-desc-area"
              type="text"
              inputMode="decimal"
              placeholder="420"
              className={`${formInputFullWidthClass} ${formInputClassName()}`}
            />
          </Field>

          <Field label="Stāvu skaits" id="module-desc-floors">
            <input
              id="module-desc-floors"
              type="text"
              placeholder="3"
              className={`${formInputFullWidthClass} ${formInputClassName()}`}
            />
          </Field>
        </div>

        <Field label="Ēkas tips" id="module-desc-type">
          <input
            id="module-desc-type"
            type="text"
            placeholder="Biroja ēka, noliktava…"
            className={`${formInputFullWidthClass} ${formInputClassName()}`}
          />
        </Field>

        <Field label="Piezīmes" id="module-desc-notes">
          <textarea
            id="module-desc-notes"
            rows={3}
            placeholder="Papildu informācija…"
            className={`${formInputFullWidthClass} ${formInputClassName()} resize-y`}
          />
        </Field>
      </div>
    </section>
  );
}
