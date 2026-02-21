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
      <header className="flex items-center justify-between px-8 py-5">
        {/* Logo */}
        <h1
          className="text-[40px] font-black tracking-tight"
          style={{ color: "var(--primary)", letterSpacing: "-1.6px" }}
        >
          RinseList
        </h1>

        {/* Reset button - only visible in results state */}
        {isProcessingOrResults && (
          <button
            onClick={handleResetClick}
            className="flex items-center gap-2 rounded px-3 py-2 text-label transition-colors hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            <UndoIcon className="h-6 w-6" />
            <span>Clean Another List</span>
          </button>
        )}
      </header>

      {/* -----------------------------------------------------------------------
       * MAIN CONTENT AREA
       * Layout changes based on state:
       * - Upload: Hero (left) + Input Surface (right)
       * - Loading/Results: Input Surface (left) + Results (right)
       * ----------------------------------------------------------------------- */}
      <div className="px-8">
        <div className="flex gap-8">
          {/* -----------------------------------------------------------------
           * LEFT COLUMN
           * Upload state: Hero section with tagline
           * Loading/Results state: Input surface (disabled)
           * ----------------------------------------------------------------- */}
          <div className="flex-1">
            {state === "upload" ? (
              /* HERO SECTION - Shown during upload state */
              <div className="flex h-full flex-col justify-center py-16">
                <div className="max-w-[441px]">
                  {/* Main tagline */}
                  <h2
                    className="text-headline mb-6"
                    style={{ color: "var(--foreground)" }}
                  >
                    Safely clean your new email list with ease
                  </h2>

                  {/* Privacy assurance */}
                  <p
                    className="text-body-bold mb-6"
                    style={{ color: "var(--muted)" }}
                  >
                    We never store or access your customer data. All processing
                    happens locally in your browser.
                  </p>

                  {/* How it Works button */}
                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="rounded px-3 py-2 text-label transition-colors hover:opacity-90"
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
              <div className="py-6">
                {state === "loading" ? (
                  /* Loading state - minimal indicator since panel animates */
                  <div className="flex h-[537px] flex-col items-center justify-center">
                    <div
                      className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                      style={{
                        borderColor: "var(--primary-muted)",
                        borderTopColor: "transparent",
                      }}
                    />
                    <p className="mt-4 text-body" style={{ color: "var(--muted)" }}>
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
      className={`rounded-xl border px-14 py-16 transition-opacity ${
        disabled ? "opacity-50" : ""
      }`}
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border)",
      }}
    >
      {/* Section title */}
      <h2
        className="text-title mb-6"
        style={{ color: "var(--foreground)" }}
      >
        Add Your Files
      </h2>

      {/* File upload zones */}
      <div className="space-y-10">
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
          className="mt-6 flex items-center gap-3 rounded border px-6 py-3"
          style={{
            backgroundColor: "var(--error-bg)",
            borderColor: "var(--error-border)",
          }}
        >
          {/* Error icon */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
            style={{ backgroundColor: "var(--error-icon-bg)" }}
          >
            <svg
              className="h-5 w-5 text-white"
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
          <p className="text-body" style={{ color: "var(--error-text)" }}>
            The Contact List and Suppression List must be different files.
          </p>
        </div>
      )}

      {/* Process button */}
      <div className="mt-10 flex justify-end">
        <button
          onClick={onProcess}
          disabled={!canProcess || disabled || !!isSameFile || isLoading}
          className="flex items-center gap-2 rounded px-3.5 py-3 text-label transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <span>Clean Your List</span>
          {/* Arrow right icon */}
          <svg
            className="h-6 w-6"
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
