"use client";

import Link from "next/link";
import { ModuleCardActions } from "@/app/components/module-card-actions";
import { ModuleMissingDataIcon } from "@/app/components/module-missing-data-icon";
import {
  isPlainPrimaryNavigationClick,
  useOptionalNavigationLoading,
} from "@/app/components/navigation-loading-context";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

const cardClassName =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md";

export function ModuleCard({ module }: { module: BuildingModuleSummary }) {
  const navigationLoading = useOptionalNavigationLoading();
  const moduleHref = `/modules/${module.id}`;

  return (
    <div className={cardClassName}>
      <div className="flex items-center gap-3">
        <Link
          href={moduleHref}
          className="group min-w-0 flex-1"
          onClick={(event) => {
            if (!isPlainPrimaryNavigationClick(event)) {
              return;
            }

            navigationLoading?.beginNavigation(moduleHref, "Ielādē moduli…");
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 text-base font-semibold text-zinc-900 group-hover:text-zinc-700">
              {module.name}
            </p>
            {!module.moduleDataComplete ? <ModuleMissingDataIcon /> : null}
          </div>
        </Link>

        <ModuleCardActions module={module} />
      </div>
    </div>
  );
}
