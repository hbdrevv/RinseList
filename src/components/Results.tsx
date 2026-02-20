"use client";

import { ProcessingResult } from "@/lib/processor";

interface ResultsProps {
  result: ProcessingResult | null;
  error: string | null;
  onDownload: () => void;
  onReset: () => void;
  onTryAgain: () => void;
}

export function Results({
  result,
  error,
  onDownload,
  onReset,
  onTryAgain,
}: ResultsProps) {
  if (error) {
    return (
      <div className="flex h-full flex-col">
        <h2
          className="mb-6 text-xl font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Processing Failed
        </h2>

        <div
          className="mb-6 rounded-lg p-4"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              style={{ color: "var(--destructive)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>
              {error}
            </p>
          </div>
        </div>

        <button
          onClick={onTryAgain}
          className="w-full rounded-lg py-3 font-medium transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { stats } = result;
  const totalRemoved = stats.suppressedCount + stats.invalidCount;

  return (
    <div className="flex h-full flex-col">
      <h2
        className="mb-6 text-xl font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        Results
      </h2>

      <div className="mb-6 space-y-3">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Total Rows
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {stats.totalRows.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Cleaned Rows
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--success)" }}
              >
                {stats.cleanedCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <p className="mb-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Removed ({totalRemoved.toLocaleString()} total)
          </p>
          <div className="space-y-1 text-sm" style={{ color: "var(--muted)" }}>
            <p>Suppressed: {stats.suppressedCount.toLocaleString()}</p>
            <p>Invalid format: {stats.invalidCount.toLocaleString()}</p>
          </div>
        </div>

        {(result.contactListHasMultipleSheets ||
          result.suppressionListHasMultipleSheets) && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--muted)",
            }}
          >
            <p>
              Note: First sheet was used.
              {result.contactListHasMultipleSheets &&
                result.suppressionListHasMultipleSheets
                ? " Both files had multiple sheets."
                : result.contactListHasMultipleSheets
                  ? " Contact List had multiple sheets."
                  : " Suppression List had multiple sheets."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={onDownload}
          className="w-full rounded-lg py-3 font-medium transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Download Results
        </button>

        <button
          onClick={onReset}
          className="w-full rounded-lg py-3 font-medium transition-colors"
          style={{
            backgroundColor: "transparent",
            color: "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
