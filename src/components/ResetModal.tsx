"use client";

/**
 * =============================================================================
 * RESET MODAL COMPONENT
 * =============================================================================
 *
 * Confirmation dialog shown when user tries to reset with undownloaded results.
 * Gives user option to download before resetting or continue without saving.
 *
 * DESIGN (based on Figma v1 flow):
 * - Blue-themed modal (not gray)
 * - Headline: "Grab your files before you go!"
 * - Description explaining data loss warning
 * - Two action buttons: "Download Results" and "Continue With Reset"
 *
 * INTERACTIONS:
 * - Click outside to close
 * - Escape key to close
 * - Backdrop blur effect
 *
 * =============================================================================
 */

import { useEffect, useCallback } from "react";

/* -----------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * -------------------------------------------------------------------------- */

interface ResetModalProps {
  /** Handler for download button click */
  onDownload: () => void;
  /** Handler for continue with reset button click */
  onContinueWithReset: () => void;
  /** Handler for closing modal without action */
  onClose: () => void;
}

/* -----------------------------------------------------------------------------
 * ICON COMPONENTS
 * -------------------------------------------------------------------------- */

/**
 * Download icon for "Download Results" button
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
 * Arrow right icon for "Continue With Reset" button
 */
function ArrowRightIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/* -----------------------------------------------------------------------------
 * MAIN COMPONENT
 * -------------------------------------------------------------------------- */

export function ResetModal({
  onDownload,
  onContinueWithReset,
  onClose,
}: ResetModalProps) {
  /* ---------------------------------------------------------------------------
   * KEYBOARD HANDLING
   * Close modal on Escape key press
   * ------------------------------------------------------------------------- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ---------------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------------- */
  return (
    <>
      {/* -----------------------------------------------------------------------
       * BACKDROP OVERLAY
       * Semi-transparent with blur effect, clicking closes modal
       * ----------------------------------------------------------------------- */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* -----------------------------------------------------------------------
       * MODAL CONTENT
       * Centered card with blue theme
       * ----------------------------------------------------------------------- */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-[564px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-14 py-16 shadow-lg"
        style={{
          backgroundColor: "var(--modal-bg)",
          borderColor: "var(--modal-border)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* -----------------------------------------------------------------------
         * HEADER CONTENT
         * Title and description
         * ----------------------------------------------------------------------- */}
        <div className="mb-10">
          {/* Modal title */}
          <h2
            id="reset-modal-title"
            className="text-headline mb-6"
            style={{ color: "var(--modal-text)" }}
          >
            Grab your files before you go!
          </h2>

          {/* Warning description */}
          <p
            className="text-[18px] leading-relaxed"
            style={{ color: "var(--modal-text)", letterSpacing: "-0.72px" }}
          >
            Any undownloaded files will be lost when you reset RinseList. Just
            checking in to make sure you have everything you need!
          </p>
        </div>

        {/* -----------------------------------------------------------------------
         * ACTION BUTTONS
         * Two buttons: Download (secondary) and Continue With Reset (primary)
         * ----------------------------------------------------------------------- */}
        <div className="flex items-center justify-between">
          {/* Download Results button (secondary/lighter) */}
          <button
            onClick={onDownload}
            className="flex items-center gap-2 rounded px-3.5 py-3 text-label transition-colors hover:opacity-90"
            style={{
              backgroundColor: "var(--primary-muted)",
              color: "var(--modal-text)",
            }}
          >
            <span>Download Results</span>
            <DownloadIcon className="h-6 w-6" />
          </button>

          {/* Continue With Reset button (primary/darker) */}
          <button
            onClick={onContinueWithReset}
            className="flex items-center gap-2 rounded px-3.5 py-3 text-label transition-colors hover:opacity-90"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <span>Continue With Reset</span>
            <ArrowRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </>
  );
}
