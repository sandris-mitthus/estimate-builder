export const approvedEstimateSurfaceClassName =
  "border-green-200 bg-green-50 text-green-800";

export const approvedEstimateStatusClassName =
  `flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${approvedEstimateSurfaceClassName}`;

type ApprovedEstimateStatusLabelProps = {
  className?: string;
};

export function ApprovedEstimateStatusLabel({
  className,
}: ApprovedEstimateStatusLabelProps) {
  return (
    <div
      role="status"
      className={
        className
          ? `${approvedEstimateStatusClassName} ${className}`
          : approvedEstimateStatusClassName
      }
    >
      <i className="fas fa-check text-xs" aria-hidden="true" />
      Tāme apstiprināta — izmaiņas vairs nav iespējamas
    </div>
  );
}
