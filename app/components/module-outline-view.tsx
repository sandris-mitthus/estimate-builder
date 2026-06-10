import type { ModuleOutline } from "@/app/lib/modules/types";

export function ModuleOutlineView({ outline }: { outline: ModuleOutline }) {
  if (outline.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <ol className="divide-y divide-zinc-100">
        {outline.map((category, categoryIndex) => (
          <li key={category.id} className="px-5 py-4">
            <p className="text-base font-semibold text-zinc-900">
              {category.title}
            </p>

            {category.subcategories.length > 0 ? (
              <ol className="mt-3 space-y-2 border-l border-zinc-200 pl-4">
                {category.subcategories.map((subcategory, subcategoryIndex) => (
                  <li
                    key={subcategory.id}
                    className="text-sm text-zinc-600"
                  >
                    <span className="font-medium text-zinc-700">
                      {categoryIndex + 1}.{subcategoryIndex + 1}
                    </span>{" "}
                    {subcategory.title}
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
