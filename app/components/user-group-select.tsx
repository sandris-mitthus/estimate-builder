"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignUserGroupAction } from "@/app/(protected)/users/actions";
import type { UserGroupSummary } from "@/app/lib/auth/permissions";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";

type UserGroupSelectProps = {
  userId: string;
  groupId: string;
  groups: UserGroupSummary[];
  disabled?: boolean;
};

export function UserGroupSelect({
  userId,
  groupId,
  groups,
  disabled = false,
}: UserGroupSelectProps) {
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextGroupId = event.target.value;
    if (!nextGroupId || nextGroupId === groupId) {
      return;
    }

    startTransition(async () => {
      const result = await assignUserGroupAction(userId, nextGroupId);
      if (!result.ok) {
        showFeedback({ type: "error", text: result.error });
        return;
      }

      showFeedback({ type: "success", text: "Grupa atjaunināta." });
      router.refresh();
    });
  }

  return (
    <label className="mt-4 block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Grupa
      </span>
      <select
        value={groupId}
        onChange={handleChange}
        disabled={disabled || isPending}
        className={`${formInputFullWidthClass} ${formInputClassName()} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </label>
  );
}
