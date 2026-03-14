"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { LoginRequestSchema } from "@/lib/validations/auth";
import { postAuth } from "./auth-api";

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  const payload = useMemo(
    () => ({ email, password, next: nextPath }),
    [email, password, nextPath],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors(undefined);

    const parsed = LoginRequestSchema.safeParse(payload);

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);

    const response = await postAuth<{ redirectTo: string }>("/api/auth/login", parsed.data);

    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage(response.error.message);
      setFieldErrors(response.error.fieldErrors);
      return;
    }

    router.push(response.data.redirectTo);
    router.refresh();
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

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />
        {fieldErrors?.password?.[0] ? (
          <p className="text-sm text-red-600">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
