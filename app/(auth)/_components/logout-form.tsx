"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { postAuth } from "@/app/(auth)/_components/auth-api";

interface LogoutResponse {
  redirectTo: string;
}

export function LogoutForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const response = await postAuth<LogoutResponse>("/api/auth/logout", {});

    setIsSubmitting(false);

    if (!response.ok) {
      setErrorMessage(response.error.message);
      return;
    }

    router.push(response.data.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Signing out..." : "Sign out"}
      </button>
    </form>
  );
}
