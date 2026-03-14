"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ResetPasswordRequestSchema } from "@/lib/validations/auth";
import { postAuth } from "./auth-api";

interface ResetPasswordResponse {
  message: string;
}

const COOLDOWN_STORAGE_KEY = "resilinc:auth:reset-cooldown-until";
const MIN_WAIT_SECONDS = 60;
const SAFETY_BUFFER_SECONDS = 5;

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>();

  const payload = useMemo(() => ({ email }), [email]);

  useEffect(() => {
    const persistedSeconds = readPersistedCooldownSeconds();

    if (persistedSeconds > 0) {
      setCooldownSeconds(persistedSeconds);
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      clearPersistedCooldown();
      return;
    }

    const timer = setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

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
      if (response.error.code === "AUTH_RATE_LIMITED") {
        const waitSeconds = Math.max(response.error.retryAfterSeconds ?? MIN_WAIT_SECONDS, MIN_WAIT_SECONDS);
        const cooldownSecondsWithBuffer = waitSeconds + SAFETY_BUFFER_SECONDS;
        setCooldownSeconds(cooldownSecondsWithBuffer);
        persistCooldown(cooldownSecondsWithBuffer);
      }
      setErrorMessage(response.error.message);
      setFieldErrors(response.error.fieldErrors);
      return;
    }

    clearPersistedCooldown();
    setCooldownSeconds(0);
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
      {cooldownSeconds > 0 ? (
        <p className="text-xs text-slate-500">
          Please wait {cooldownSeconds}s before requesting another email.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || cooldownSeconds > 0}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}

function persistCooldown(seconds: number) {
  if (typeof window === "undefined") {
    return;
  }

  const cooldownUntil = Date.now() + seconds * 1000;
  window.localStorage.setItem(COOLDOWN_STORAGE_KEY, cooldownUntil.toString());
}

function clearPersistedCooldown() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(COOLDOWN_STORAGE_KEY);
}

function readPersistedCooldownSeconds(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const rawCooldownUntil = window.localStorage.getItem(COOLDOWN_STORAGE_KEY);

  if (!rawCooldownUntil) {
    return 0;
  }

  const cooldownUntil = Number.parseInt(rawCooldownUntil, 10);

  if (!Number.isFinite(cooldownUntil)) {
    return 0;
  }

  return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
}
