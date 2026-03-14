import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resilinc Lite",
  description: "Supply chain risk intelligence platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
