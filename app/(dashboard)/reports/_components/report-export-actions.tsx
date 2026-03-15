"use client";

import { useMemo } from "react";

interface ReportExportActionsProps {
  generatedAt: string;
  reportText: string;
}

export function ReportExportActions({ generatedAt, reportText }: ReportExportActionsProps) {
  const fileName = useMemo(() => {
    const safe = generatedAt.replace(/[:\s]/g, "-");
    return `resilinc-risk-summary-${safe}.txt`;
  }, [generatedAt]);

  function downloadReport() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(objectUrl);
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={downloadReport}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Download TXT
      </button>
      <button
        type="button"
        onClick={printReport}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
      >
        Print View
      </button>
    </div>
  );
}
