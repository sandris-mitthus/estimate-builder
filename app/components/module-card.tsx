import Link from "next/link";
import { ModuleCardActions } from "@/app/components/module-card-actions";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";

const cardClassName =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md";

export function ModuleCard({ module }: { module: BuildingModuleSummary }) {
  return (
    <div className={cardClassName}>
      <div className="flex items-center gap-3">
        <Link
          href={`/modules/${module.id}`}
          className="group min-w-0 flex-1"
        >
          <p className="text-base font-semibold text-zinc-900 group-hover:text-zinc-700">
            {module.name}
          </p>
        </Link>

        <ModuleCardActions module={module} />
      </div>
    </div>
  );
}
