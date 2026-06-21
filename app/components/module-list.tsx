"use client";

import { ListEntryGrid } from "@/app/components/list-entry-card";
import { ModuleCard } from "@/app/components/module-card";
import { useTranslations } from "@/app/components/translations-provider";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

export function ModuleList({ modules }: { modules: BuildingModuleSummary[] }) {
  const { t } = useTranslations();

  if (modules.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">
        {t("modules.empty", "Nav moduļu katalogā.")}
      </p>
    );
  }

  return (
    <ListEntryGrid>
      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
    </ListEntryGrid>
  );
}
