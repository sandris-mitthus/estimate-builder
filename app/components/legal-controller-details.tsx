import type { LegalControllerDetails } from "@/app/lib/legal/documents";

export type LegalControllerLabels = {
  name: string;
  registrationNumber: string;
  address: string;
  email: string;
  supervisoryAuthority: string;
};

export function LegalControllerDetailsCard({
  details,
  labels,
}: {
  details: LegalControllerDetails;
  labels: LegalControllerLabels;
}) {
  const rows = [
    { label: labels.name, value: details.name },
    { label: labels.registrationNumber, value: details.registrationNumber },
    { label: labels.address, value: details.address },
    { label: labels.email, value: details.email },
    {
      label: labels.supervisoryAuthority,
      value: details.supervisoryAuthority,
    },
  ];

  return (
    <dl className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4"
        >
          <dt className="text-sm font-semibold text-zinc-500 sm:w-56 sm:shrink-0">
            {row.label}
          </dt>
          <dd className="min-w-0 text-sm leading-6 text-zinc-800">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
