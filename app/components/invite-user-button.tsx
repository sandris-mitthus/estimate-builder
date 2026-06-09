"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteUserAction } from "@/app/(protected)/users/actions";
import { AppModal } from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import {
  formInputClassName,
  formInputFullWidthClass,
} from "@/app/lib/form/input-styles";
import { validateRequiredEmail } from "@/app/lib/validation/contact-fields";

export function InviteUserButton() {
  const router = useRouter();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setEmail("");
    setEmailError(null);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      resetForm();
    }
    setOpen(nextOpen);
  }

  function validateForm(): boolean {
    const validationError = validateRequiredEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return false;
    }

    setEmailError(null);
    return true;
  }

  function handleEmailBlur() {
    if (!email.trim()) {
      return;
    }

    setEmailError(validateRequiredEmail(email));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    clearFeedback();

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const result = await inviteUserAction(email);

      if (!result.ok) {
        const fieldError = validateRequiredEmail(email);
        if (fieldError === result.error) {
          setEmailError(result.error);
        } else {
          setError(result.error);
        }
        return;
      }

      handleOpenChange(false);
      showFeedback({ type: "success", text: "Uzaicinājums nosūtīts." });
      router.refresh();
    });
  }

  const invalid = Boolean(emailError);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        <i className="fas fa-user-plus text-xs" aria-hidden="true" />
        Uzaicināt
      </button>

      <AppModal
        open={open}
        onOpenChange={handleOpenChange}
        title="Uzaicināt lietotāju"
        description="Ievadi e-pasta adresi, lai nosūtītu uzaicinājumu"
        blocking={isPending}
      >
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="invite-email" className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Epasts
            </span>
            <input
              id="invite-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
                setError(null);
              }}
              onBlur={handleEmailBlur}
              className={`${formInputFullWidthClass} ${formInputClassName(invalid)}`}
              aria-invalid={invalid}
              aria-describedby={emailError ? "invite-email-error" : undefined}
            />
            {emailError ? (
              <p
                id="invite-email-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {emailError}
              </p>
            ) : null}
          </label>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Sūta…" : "Nosūtīt uzaicinājumu"}
            </button>
          </div>
        </form>
      </AppModal>
    </>
  );
}
