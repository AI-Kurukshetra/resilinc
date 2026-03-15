"use client";

import { FormEvent, useMemo, useState } from "react";
import { ResetPasswordRequestSchema } from "@/lib/validations/auth";
import { postAuth } from "@/app/(auth)/_components/auth-api";

interface ResendConfirmationFormProps {
  defaultEmail?: string;
}

interface ResendConfirmationResponse {
  message: string;
}

export function ResendConfirmationForm({ defaultEmail = "" }: ResendConfirmationFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  const payload = useMemo(() => ({ email }), [email]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors(undefined);

    const parsed = ResetPasswordRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const response = await postAuth<ResendConfirmationResponse>(
      "/api/auth/resend-confirmation",
      parsed.data,
    );
    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage(response.error.message);
      setFieldErrors(response.error.fieldErrors);
      return;
    }

    setSuccessMessage(response.data.message);
  }

  return (
    <form
      className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
      onSubmit={onSubmit}
      noValidate
    >
      <p className="text-xs font-medium text-slate-700">Did not receive confirmation email?</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Resend"}
        </button>
      </div>
      {fieldErrors?.email?.[0] ? (
        <p className="text-xs text-rose-700">{fieldErrors.email[0]}</p>
      ) : null}
      {errorMessage ? <p className="text-xs text-rose-700">{errorMessage}</p> : null}
      {successMessage ? <p className="text-xs text-emerald-700">{successMessage}</p> : null}
    </form>
  );
}
