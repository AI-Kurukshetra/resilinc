"use client";

import { FormEvent, useMemo, useState } from "react";
import { ResetPasswordRequestSchema } from "@/lib/validations/auth";
import { postAuth } from "./auth-api";

interface ResetPasswordResponse {
  message: string;
}

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
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

    const response = await postAuth<ResetPasswordResponse>("/api/auth/reset", parsed.data);

    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage(response.error.message);
      setFieldErrors(response.error.fieldErrors);
      return;
    }

    setSuccessMessage(response.data.message);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />
        {fieldErrors?.email?.[0] ? (
          <p className="text-sm text-red-600">{fieldErrors.email[0]}</p>
        ) : null}
      </div>

      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
