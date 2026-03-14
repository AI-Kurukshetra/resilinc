import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageShellProps {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthPageShell({
  title,
  description,
  footer,
  children,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{description}</p>
        </header>

        {children}

        <footer className="text-sm text-slate-600">{footer}</footer>
      </section>
    </main>
  );
}

export function AuthLink({ href, text }: { href: string; text: string }) {
  return (
    <Link href={href} className="font-medium text-slate-900 underline underline-offset-4">
      {text}
    </Link>
  );
}
