import type { CookieRegistryRow } from "@/app/lib/legal/cookie-registry";

export type CookieRegistryLabels = {
  name: string;
  category: string;
  purpose: string;
  retention: string;
};

export function CookieRegistryTable({
  rows,
  labels,
}: {
  rows: CookieRegistryRow[];
  labels: CookieRegistryLabels;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-zinc-500">
              {labels.name}
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-500">
              {labels.category}
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-500">
              {labels.purpose}
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-500">
              {labels.retention}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.name} className="align-top">
              <td className="px-4 py-3">
                <code className="break-all font-mono text-xs text-zinc-700">
                  {row.name}
                </code>
              </td>
              <td className="px-4 py-3 text-zinc-600">{row.category}</td>
              <td className="px-4 py-3 leading-6 text-zinc-600">
                {row.purpose}
              </td>
              <td className="px-4 py-3 text-zinc-600">{row.retention}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
