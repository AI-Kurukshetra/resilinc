"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { UpdatePasswordRequestSchema } from "@/lib/validations/auth";

interface UpdatePasswordFormProps {
  hasRecoveryError: boolean;
}

export function UpdatePasswordForm({ hasRecoveryError }: UpdatePasswordFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    hasRecoveryError ? "Reset link is invalid or expired. Request a new one." : null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setHasRecoverySession(false);
        setIsCheckingSession(false);
        return;
      }

      setHasRecoverySession(Boolean(data.session));
      setIsCheckingSession(false);

      if (!data.session && !hasRecoveryError) {
        setErrorMessage("Reset link is invalid or expired. Request a new one.");
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasRecoverySession(Boolean(session));
      setIsCheckingSession(false);

      if (session) {
        setErrorMessage(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hasRecoveryError, supabase.auth]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors(undefined);

    const parsed = UpdatePasswordRequestSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    if (!hasRecoverySession) {
      setErrorMessage("Reset link is invalid or expired. Request a new one.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message || "Unable to update password.");
      return;
    }

    await supabase.auth.signOut();

    setIsSubmitting(false);
    setSuccessMessage("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/login?passwordReset=1");
      router.refresh();
    }, 600);
  }

  if (isCheckingSession) {
    return <p className="text-sm text-slate-600">Validating reset link...</p>;
  }

  if (!hasRecoverySession) {
    return (
      <div className="space-y-3">
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        <Link
          href="/reset-password"
          className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />
        {fieldErrors?.password?.[0] ? (
          <p className="text-sm text-red-600">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />
        {fieldErrors?.confirmPassword?.[0] ? (
          <p className="text-sm text-red-600">{fieldErrors.confirmPassword[0]}</p>
        ) : null}
      </div>

      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
