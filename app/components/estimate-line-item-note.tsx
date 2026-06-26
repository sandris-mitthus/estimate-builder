type EstimateLineItemNoteProps = {
  note?: string | null;
  className?: string;
};

export function EstimateLineItemNote({
  note,
  className = "",
}: EstimateLineItemNoteProps) {
  const trimmed = note?.trim();
  if (!trimmed) {
    return null;
  }

  return (
    <p
      className={`-mt-0.5 text-[0.7875rem] leading-5 text-zinc-500 ${className}`.trim()}
    >
      {trimmed}
    </p>
  );
}
