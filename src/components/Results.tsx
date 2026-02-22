"use client";

/**
 * =============================================================================
 * RESULTS COMPONENT
 * =============================================================================
 *
 * Displays processing results in either success or error state.
 *
 * SUCCESS STATE (based on Figma v1 flow):
 * - Large headline: "Your files are ready to use!"
 * - Blue stat card: Rows cleaned (with suppressed/invalid breakdown)
 * - Green stat card: Clean email count
 * - "Download Results" button for full ZIP
 *
 * ERROR STATE (based on Figma v1 flow):
 * - Large headline: "Oops! Something didn't work."
 * - Red error banner with specific error message
 * - Generic helper text with troubleshooting tips
 * - "Try Again" button
 *
 * =============================================================================
 */

import { ProcessingResult } from "@/lib/processor";

/* -----------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * -------------------------------------------------------------------------- */

interface ResultsProps {
  /** Processing result (null if error occurred) */
  result: ProcessingResult | null;
  /** Error message (null if success) */
  error: string | null;
  /** Handler for downloading all results as ZIP */
  onDownload: () => void;
  /** Handler for downloading just the cleaned email list */
  onDownloadCleanedList: () => void;
  /** Handler for downloading just the audit report (removed emails) */
  onDownloadAuditReport: () => void;
  /** Handler for "Try Again" button */
  onTryAgain: () => void;
  /** Original contact list filename for display */
  contactListName?: string;
}

/* -----------------------------------------------------------------------------
 * ICON COMPONENTS
 * -------------------------------------------------------------------------- */

/**
 * Download icon for download buttons
 */
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/**
 * Arrow icon for clickable stat cards
 */
function ArrowDownIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/**
 * Check circle icon for warning/info states (multiple sheets banner)
 */
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/**
 * Alert circle icon for error states
 */
function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/**
 * Undo/refresh icon for "Try Again" button
 */
function UndoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

/* -----------------------------------------------------------------------------
 * CONSTANTS
 * -------------------------------------------------------------------------- */

/**
 * Generic helper text for error state
 * Covers common troubleshooting scenarios
 */
const ERROR_HELPER_TEXT = `Make sure the email column is labeled clearly in your file.

If you are using an XLSX double check that the relevant data is in the first sheet of your document.`;

/* -----------------------------------------------------------------------------
 * MAIN COMPONENT
 * -------------------------------------------------------------------------- */

export function Results({
  result,
  error,
  onDownload,
  onDownloadCleanedList,
  onDownloadAuditReport,
  onTryAgain,
  contactListName,
}: ResultsProps) {
  /* ---------------------------------------------------------------------------
   * ERROR STATE
   * ------------------------------------------------------------------------- */
  if (error) {
    return (
      <div className="flex flex-col gap-4 md:gap-8">
        {/* Error headline */}
        <h2
          className="text-display-responsive"
          style={{ color: "var(--destructive)" }}
        >
          Oops! Something didn&apos;t work.
        </h2>

        {/* Error banner with specific message */}
        <div
          className="flex items-center gap-2 rounded border px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5 md:gap-3 md:px-6 md:py-3"
          style={{
            backgroundColor: "var(--error-bg)",
            borderColor: "var(--error-border)",
          }}
        >
          {/* Error icon */}
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded md:h-8 md:w-8"
            style={{ backgroundColor: "var(--error-icon-bg)" }}
          >
            <AlertCircleIcon className="h-4 w-4 text-white md:h-5 md:w-5" />
          </div>
          {/* Error message */}
          <p
            className="text-xs md:text-body"
            style={{ color: "var(--error-text)" }}
          >
            {error}
          </p>
        </div>

        {/* Helper text with troubleshooting tips */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <p
            className="whitespace-pre-line text-xs md:text-body"
            style={{ color: "var(--muted)" }}
          >
            {ERROR_HELPER_TEXT}
          </p>

          {/* Try Again button */}
          <button
            onClick={onTryAgain}
            className="flex items-center gap-1.5 rounded px-2.5 py-2 text-sm font-semibold transition-colors hover:opacity-90 md:gap-2 md:px-3.5 md:py-3 md:text-label"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <span>Try Again</span>
            <UndoIcon className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------------
   * NO RESULT - Should not happen, but handle gracefully
   * ------------------------------------------------------------------------- */
  if (!result) {
    return null;
  }

  /* ---------------------------------------------------------------------------
   * SUCCESS STATE
   * ------------------------------------------------------------------------- */
  const { stats } = result;
  const totalRemoved = stats.suppressedCount + stats.invalidCount;

  // Generate output filename based on input filename
  const outputFilename = contactListName
    ? `cleaned_${contactListName.replace(/\.(csv|xlsx?)$/i, "")}.csv`
    : "cleaned_list.csv";

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      {/* Success headline */}
      <h2
        className="text-display-responsive"
        style={{ color: "var(--primary)" }}
      >
        Your files are ready to use!
      </h2>

      {/* -----------------------------------------------------------------------
       * STAT CARDS
       * Two clickable cards showing processing results
       * Each card can download its respective file
       * ----------------------------------------------------------------------- */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* -----------------------------------------------------------------
         * REMOVED EMAILS CARD (Blue)
         * Shows count of emails removed with breakdown
         * Downloads the audit report (removed emails CSV)
         * ----------------------------------------------------------------- */}
        <button
          onClick={onDownloadAuditReport}
          className="w-full rounded-lg p-3 text-left transition-opacity hover:opacity-90 sm:p-4 md:rounded-xl md:p-5"
          style={{ backgroundColor: "var(--results-removed-bg)" }}
          title="Download removed emails report"
        >
          {/* Main stat */}
          <p
            className="mb-2 text-2xl font-semibold md:mb-3 md:text-display"
            style={{ color: "var(--results-removed-text)" }}
          >
            {totalRemoved.toLocaleString()} rows cleaned
          </p>

          {/* Breakdown and download indicator */}
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex flex-col gap-1 text-xs font-semibold sm:flex-row sm:items-center sm:gap-3 md:text-title"
              style={{ color: "var(--results-removed-text)" }}
            >
              <span>{stats.suppressedCount.toLocaleString()} Suppressed</span>
              <span>{stats.invalidCount.toLocaleString()} Invalid</span>
            </div>
            <ArrowDownIcon
              className="h-5 w-5 shrink-0 md:h-6 md:w-6"
              style={{ color: "var(--results-removed-text)" }}
            />
          </div>
        </button>

        {/* -----------------------------------------------------------------
         * CLEAN EMAILS CARD (Green)
         * Shows count of clean emails remaining
         * Downloads the cleaned email list CSV
         * ----------------------------------------------------------------- */}
        <button
          onClick={onDownloadCleanedList}
          className="w-full rounded-lg p-3 text-left transition-opacity hover:opacity-90 sm:p-4 md:rounded-xl md:p-5"
          style={{ backgroundColor: "var(--results-clean-bg)" }}
          title="Download cleaned email list"
        >
          {/* Main stat */}
          <p
            className="mb-2 text-2xl font-semibold md:mb-3 md:text-display"
            style={{ color: "var(--results-clean-text)" }}
          >
            {stats.cleanedCount.toLocaleString()}
          </p>

          {/* Filename and download indicator */}
          <div className="flex items-center justify-between gap-2">
            <p
              className="truncate text-xs font-semibold md:text-title"
              style={{ color: "var(--results-clean-text)" }}
            >
              <span className="hidden sm:inline">Emails are in </span>
              <span className="underline">{outputFilename}</span>
            </p>
            <ArrowDownIcon
              className="h-5 w-5 shrink-0 md:h-6 md:w-6"
              style={{ color: "var(--results-clean-text)" }}
            />
          </div>
        </button>
      </div>

      {/* -----------------------------------------------------------------------
       * DOWNLOAD ALL BUTTON
       * Downloads full ZIP with all output files
       * ----------------------------------------------------------------------- */}
      <div className="flex justify-end">
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 rounded px-2.5 py-2 text-sm font-semibold transition-colors hover:opacity-90 md:gap-2 md:px-3.5 md:py-3 md:text-label"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <span>Download Results</span>
          <DownloadIcon className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* -----------------------------------------------------------------------
       * MULTIPLE SHEETS WARNING
       * Shown if either file had multiple sheets (only first was used)
       * Amber-themed info banner matching Figma design
       * ----------------------------------------------------------------------- */}
      {(result.contactListHasMultipleSheets ||
        result.suppressionListHasMultipleSheets) && (
        <div
          className="flex items-center gap-2 rounded border px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5 md:gap-3 md:px-6 md:py-3"
          style={{
            backgroundColor: "var(--warning-bg)",
            borderColor: "var(--warning-border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {/* Warning icon */}
          <div
            className="flex h-[24px] w-[26px] shrink-0 items-center justify-center rounded md:h-[31px] md:w-[34px]"
            style={{
              backgroundColor: "var(--warning-icon-bg)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <CheckCircleIcon className="h-[14px] w-[14px] text-white md:h-[18px] md:w-[18px]" />
          </div>
          {/* Warning message */}
          <p
            className="text-xs md:text-body"
            style={{ color: "var(--warning-text)" }}
          >
            First sheet was used.
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
  );
}
