"use client";

/**
 * =============================================================================
 * RINSELIST - MAIN APPLICATION PAGE
 * =============================================================================
 *
 * This is the main entry point for the RinseList application.
 *
 * LAYOUT STRUCTURE (based on Figma v1 flow):
 * - Upload state: Hero section (left) + Input Surface (right)
 * - Loading state: Input Surface animates to left position
 * - Results state: Input Surface (left, disabled) + Results Panel (right)
 *
 * STATE MACHINE:
 * "upload" -> User is uploading files
 * "loading" -> Files are being processed
 * "results" -> Processing complete (success or error)
 *
 * =============================================================================
 */

import { useState, useCallback, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Results } from "@/components/Results";
import { ResetModal } from "@/components/ResetModal";
import { HowItWorksPanel } from "@/components/HowItWorksPanel";
import { processFiles, ProcessingResult } from "@/lib/processor";

/* -----------------------------------------------------------------------------
 * ANALYTICS HELPERS
 * -------------------------------------------------------------------------- */

/**
 * Track a list processing event
 * Fire-and-forget - failures are silent to not affect UX
 */
function trackListProcessed(
  result: ProcessingResult,
  contactFile: File,
  suppressionFile: File
) {
  const getFileType = (filename: string) => {
    const ext = filename.toLowerCase().split(".").pop();
    return ext === "xlsx" || ext === "xls" ? "excel" : "csv";
  };

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "list_processed",
      totalRows: result.stats.totalRows,
      cleanedCount: result.stats.cleanedCount,
      suppressedCount: result.stats.suppressedCount,
      invalidCount: result.stats.invalidCount,
      contactFileType: getFileType(contactFile.name),
      suppressionFileType: getFileType(suppressionFile.name),
    }),
  }).catch(() => {
    // Silent fail - analytics should never break the app
  });
}

/* -----------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * -------------------------------------------------------------------------- */

/**
 * Application state machine states
 * - upload: Initial state, user can upload files
 * - loading: Processing in progress
 * - results: Processing complete, showing success or error
 */
type AppState = "upload" | "loading" | "results";

/**
 * Represents an uploaded file with metadata
 */
interface UploadedFile {
  file: File;
  name: string;
}

/* -----------------------------------------------------------------------------
 * ICON COMPONENTS
 * Inline SVG icons used in the header
 * -------------------------------------------------------------------------- */

/**
 * Undo/reset icon for "Clean Another List" button
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
 * MAIN COMPONENT
 * -------------------------------------------------------------------------- */

export default function Home() {
  /* ---------------------------------------------------------------------------
   * STATE MANAGEMENT
   * ------------------------------------------------------------------------- */

  // Core application state
  const [state, setState] = useState<AppState>("upload");

  // File upload state
  const [contactList, setContactList] = useState<UploadedFile | null>(null);
  const [suppressionList, setSuppressionList] = useState<UploadedFile | null>(null);

  // Processing options (kept enabled by default, UI hidden per Figma v1)
  // These can be exposed in future UI iterations
  const [generateAuditReport] = useState(true);
  const [removeInvalidEmails] = useState(true);

  // Results state
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  /* ---------------------------------------------------------------------------
   * BROWSER NAVIGATION PROTECTION
   * Warns user before leaving page with undownloaded results
   * ------------------------------------------------------------------------- */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === "results" && !hasDownloaded && result) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state, hasDownloaded, result]);

  /* ---------------------------------------------------------------------------
   * EVENT HANDLERS
   * ------------------------------------------------------------------------- */

  /**
   * Process the uploaded files
   * Transitions: upload -> loading -> results
   */
  const handleProcess = useCallback(async () => {
    if (!contactList || !suppressionList) return;

    setState("loading");
    setError(null);

    try {
      const processingResult = await processFiles(
        contactList.file,
        suppressionList.file,
        { generateAuditReport, removeInvalidEmails }
      );
      setResult(processingResult);
      setState("results");

      // Track successful processing for analytics
      trackListProcessed(processingResult, contactList.file, suppressionList.file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setState("results");
    }
  }, [contactList, suppressionList, generateAuditReport, removeInvalidEmails]);

  /**
   * Reset application to initial state
   * Called after user confirms in ResetModal or clicks "Try Again" on error
   */
  const handleReset = useCallback(() => {
    setShowResetModal(false);
    setState("upload");
    setContactList(null);
    setSuppressionList(null);
    setResult(null);
    setError(null);
    setHasDownloaded(false);
  }, []);

  /**
   * Download all results as a ZIP file
   */
  const handleDownload = useCallback(() => {
    if (!result?.zipBlob) return;

    const url = URL.createObjectURL(result.zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rinselist-output.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
  }, [result]);

  /**
   * Download just the cleaned email list (individual file)
   */
  const handleDownloadCleanedList = useCallback(() => {
    if (!result?.cleanedListBlob) return;

    const filename = contactList?.name
      ? `cleaned_${contactList.name.replace(/\.(csv|xlsx?)$/i, "")}.csv`
      : "cleaned_list.csv";

    const url = URL.createObjectURL(result.cleanedListBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
  }, [result, contactList]);

  /**
   * Download just the audit report (removed emails)
   */
  const handleDownloadAuditReport = useCallback(() => {
    if (!result?.auditReportBlob) return;

    const url = URL.createObjectURL(result.auditReportBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "removed_emails_report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
  }, [result]);

  /**
   * Handle reset button click
   * Shows confirmation modal if there are undownloaded results
   */
  const handleResetClick = useCallback(() => {
    if (result && !hasDownloaded) {
      setShowResetModal(true);
    } else {
      handleReset();
    }
  }, [result, hasDownloaded, handleReset]);

  // Derived state
  const canProcess = contactList && suppressionList;
  const isProcessingOrResults = state === "loading" || state === "results";

  /* ---------------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------------- */
  return (
    <main className="min-h-screen">
      {/* -----------------------------------------------------------------------
       * HEADER
       * Logo on left, "Clean Another List" button on right (results state only)
       * ----------------------------------------------------------------------- */}
      <header className="flex items-center justify-between px-4 py-4 md:px-8 md:py-5">
        {/* Logo */}
        <h1
          className="text-[32px] font-black tracking-tight md:text-[40px]"
          style={{ color: "var(--primary)", letterSpacing: "-1.6px" }}
        >
          RinseList
        </h1>

        {/* Reset button - only visible in results state */}
        {isProcessingOrResults && (
          <button
            onClick={handleResetClick}
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:opacity-80 md:px-3 md:py-2 md:text-label"
            style={{ color: "var(--primary)" }}
          >
            <UndoIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="hidden sm:inline">Clean Another List</span>
            <span className="sm:hidden">Reset</span>
          </button>
        )}
      </header>

      {/* -----------------------------------------------------------------------
       * MAIN CONTENT AREA
       * Layout changes based on state:
       * - Upload: Hero (left) + Input Surface (right)
       * - Loading/Results: Input Surface (left) + Results (right)
       * Mobile: Stacked vertically
       * ----------------------------------------------------------------------- */}
      <div className="px-4 md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* -----------------------------------------------------------------
           * LEFT COLUMN
           * Upload state: Hero section with tagline
           * Loading/Results state: Input surface (disabled)
           * ----------------------------------------------------------------- */}
          <div className="flex-1">
            {state === "upload" ? (
              /* HERO SECTION - Shown during upload state */
              <div className="flex h-full flex-col items-center justify-center py-8 text-center lg:items-start lg:py-16 lg:text-left">
                <div className="max-w-[500px] lg:max-w-[441px]">
                  {/* Main tagline */}
                  <h2
                    className="text-headline-responsive mb-4 lg:mb-6"
                    style={{ color: "var(--foreground)" }}
                  >
                    Instantly clean your email list in your browser without sharing customer data
                  </h2>

                  {/* Privacy assurance */}
                  <p
                    className="mb-4 text-sm font-bold leading-snug lg:mb-6 lg:text-body-bold"
                    style={{ color: "var(--muted)" }}
                  >
                    For email marketers who need to clean contact lists before uploading to their ESP
                  </p>

                  {/* How it Works button */}
                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="rounded px-3 py-2 text-sm font-semibold transition-colors hover:opacity-90 lg:text-label"
                    style={{
                      backgroundColor: "var(--zinc-600)",
                      color: "white",
                    }}
                  >
                    How it Works
                  </button>
                </div>
              </div>
            ) : (
              /* INPUT SURFACE - Shown during loading/results (disabled state) */
              <InputSurface
                contactList={contactList}
                suppressionList={suppressionList}
                onContactListChange={setContactList}
                onSuppressionListChange={setSuppressionList}
                canProcess={!!canProcess}
                onProcess={handleProcess}
                disabled={true}
                isLoading={state === "loading"}
              />
            )}
          </div>

          {/* -----------------------------------------------------------------
           * RIGHT COLUMN
           * Upload state: Input surface (active)
           * Loading/Results state: Results panel or loading indicator
           * ----------------------------------------------------------------- */}
          <div className="flex-1">
            {state === "upload" ? (
              /* INPUT SURFACE - Active during upload state */
              <InputSurface
                contactList={contactList}
                suppressionList={suppressionList}
                onContactListChange={setContactList}
                onSuppressionListChange={setSuppressionList}
                canProcess={!!canProcess}
                onProcess={handleProcess}
                disabled={false}
                isLoading={false}
              />
            ) : (
              /* RESULTS PANEL - Shown during loading/results state */
              <div className="py-4 md:py-6">
                {state === "loading" ? (
                  /* Loading state - minimal indicator since panel animates */
                  <div className="flex h-[300px] flex-col items-center justify-center md:h-[537px]">
                    <div
                      className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                      style={{
                        borderColor: "var(--primary-muted)",
                        borderTopColor: "transparent",
                      }}
                    />
                    <p className="mt-4 text-sm md:text-body" style={{ color: "var(--muted)" }}>
                      Processing your files...
                    </p>
                  </div>
                ) : (
                  /* Results component - handles both success and error states */
                  <Results
                    result={result}
                    error={error}
                    onDownload={handleDownload}
                    onDownloadCleanedList={handleDownloadCleanedList}
                    onDownloadAuditReport={handleDownloadAuditReport}
                    onTryAgain={handleReset}
                    contactListName={contactList?.name}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
       * MODALS & OVERLAYS
       * ----------------------------------------------------------------------- */}

      {/* Reset confirmation modal */}
      {showResetModal && (
        <ResetModal
          onDownload={() => {
            handleDownload();
            setShowResetModal(false);
          }}
          onContinueWithReset={handleReset}
          onClose={() => setShowResetModal(false)}
        />
      )}

      {/* How it Works slide-out panel */}
      {showHowItWorks && (
        <HowItWorksPanel onClose={() => setShowHowItWorks(false)} />
      )}
    </main>
  );
}

/* -----------------------------------------------------------------------------
 * INPUT SURFACE COMPONENT
 * -----------------------------------------------------------------------------
 * The main input panel containing file upload zones and process button.
 * Can be in active or disabled state based on application flow.
 *
 * Props:
 * - contactList/suppressionList: Currently uploaded files
 * - onContactListChange/onSuppressionListChange: File change handlers
 * - canProcess: Whether both files are uploaded
 * - onProcess: Handler for process button click
 * - disabled: Whether inputs are disabled (during loading/results)
 * - isLoading: Whether processing is in progress
 * -------------------------------------------------------------------------- */

interface InputSurfaceProps {
  contactList: UploadedFile | null;
  suppressionList: UploadedFile | null;
  onContactListChange: (file: UploadedFile | null) => void;
  onSuppressionListChange: (file: UploadedFile | null) => void;
  canProcess: boolean;
  onProcess: () => void;
  disabled: boolean;
  isLoading: boolean;
}

function InputSurface({
  contactList,
  suppressionList,
  onContactListChange,
  onSuppressionListChange,
  canProcess,
  onProcess,
  disabled,
  isLoading,
}: InputSurfaceProps) {
  // Check if same file was uploaded to both inputs
  const isSameFile =
    contactList &&
    suppressionList &&
    contactList.name === suppressionList.name &&
    contactList.file.size === suppressionList.file.size;

  return (
    <div
      className={`rounded-xl border px-5 py-6 transition-opacity sm:px-8 sm:py-10 md:px-14 md:py-16 ${
        disabled ? "opacity-50" : ""
      }`}
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border)",
      }}
    >
      {/* Section title */}
      <h2
        className="mb-4 text-base font-semibold md:mb-6 md:text-title"
        style={{ color: "var(--foreground)" }}
      >
        Add Your Files
      </h2>

      {/* File upload zones */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Contact List upload */}
        <FileUpload
          type="contact"
          file={contactList}
          onFileSelect={onContactListChange}
          disabled={disabled}
        />

        {/* Suppression List upload */}
        <FileUpload
          type="suppression"
          file={suppressionList}
          onFileSelect={onSuppressionListChange}
          disabled={disabled}
        />
      </div>

      {/* Error message for same file */}
      {isSameFile && (
        <div
          className="mt-4 flex items-center gap-2 rounded border px-3 py-2 sm:mt-5 sm:gap-2.5 sm:px-4 sm:py-2.5 md:mt-6 md:gap-3 md:px-6 md:py-3"
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
            <svg
              className="h-4 w-4 text-white md:h-5 md:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-xs md:text-body" style={{ color: "var(--error-text)" }}>
            The Contact List and Suppression List must be different files.
          </p>
        </div>
      )}

      {/* Process button */}
      <div className="mt-4 flex justify-end sm:mt-6 md:mt-8">
        <button
          onClick={onProcess}
          disabled={!canProcess || disabled || !!isSameFile || isLoading}
          className="flex items-center gap-1.5 rounded px-2.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:gap-2 md:px-3.5 md:py-3 md:text-label"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <span>Clean Your List</span>
          {/* Arrow right icon */}
          <svg
            className="h-5 w-5 md:h-6 md:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
