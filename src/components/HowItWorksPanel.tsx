"use client";

/**
 * =============================================================================
 * HOW IT WORKS PANEL
 * =============================================================================
 *
 * Slide-out drawer that explains how RinseList works.
 * Slides in from the right side of the screen with a backdrop blur overlay.
 *
 * CONTENT STRUCTURE (based on Figma v1 flow):
 * - Close button (top right)
 * - Title: "How It Works"
 * - Description text
 * - Step carousel (3 steps with visual cards)
 * - File Support section
 * - FAQs section
 *
 * MVP NOTES:
 * - Carousel steps 2-3 are placeholders (content to be added in Figma)
 * - File Support and FAQs sections have placeholder content
 *
 * =============================================================================
 */

import { useEffect, useCallback } from "react";

/* -----------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * -------------------------------------------------------------------------- */

interface HowItWorksPanelProps {
  /** Handler called when panel should close */
  onClose: () => void;
}

/* -----------------------------------------------------------------------------
 * CONSTANTS
 * -------------------------------------------------------------------------- */

/**
 * Carousel steps configuration
 * MVP: Step 1 has real content, steps 2-3 are placeholders
 * TODO: Update steps 2-3 content from Figma when available
 */
const CAROUSEL_STEPS = [
  {
    number: 1,
    description: "Add your new contact list and your suppression list.",
    isActive: true,
  },
  {
    number: 2,
    description: "RinseList compares and removes matching emails.",
    isActive: false,
  },
  {
    number: 3,
    description: "Download your cleaned list ready for import.",
    isActive: false,
  },
];

/**
 * File Support section content
 * TODO: Update with actual content from Figma when available
 */
const FILE_SUPPORT_CONTENT =
  "RinseList accepts CSV and XLSX file formats. For Excel files, the first sheet in the document will be used for processing.";

/**
 * FAQs section content
 * TODO: Update with actual content from Figma when available
 */
const FAQS_CONTENT =
  "RinseList removes suppressed and invalid emails before you upload them to your ESP. All processing happens locally in your browser.";

/* -----------------------------------------------------------------------------
 * MAIN COMPONENT
 * -------------------------------------------------------------------------- */

export function HowItWorksPanel({ onClose }: HowItWorksPanelProps) {
  /* ---------------------------------------------------------------------------
   * KEYBOARD HANDLING
   * Close panel on Escape key press
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
       * Semi-transparent with blur effect, clicking closes panel
       * ----------------------------------------------------------------------- */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.12)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* -----------------------------------------------------------------------
       * SLIDE-OUT PANEL
       * Fixed to right side, full height
       * ----------------------------------------------------------------------- */}
      <aside
        className="fixed bottom-0 right-0 top-0 z-50 w-[569px] overflow-y-auto bg-white px-16 pb-16 pt-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
      >
        {/* Close button - top right */}
        <div className="mb-10 flex justify-end">
          <button
            onClick={onClose}
            className="rounded px-3 py-2 text-label transition-colors hover:opacity-90"
            style={{
              backgroundColor: "var(--zinc-600)",
              color: "white",
            }}
          >
            Close
          </button>
        </div>

        {/* -----------------------------------------------------------------------
         * HEADER SECTION
         * Title and description
         * ----------------------------------------------------------------------- */}
        <div className="mb-10">
          <h2
            id="how-it-works-title"
            className="text-headline mb-4"
            style={{ color: "var(--foreground)" }}
          >
            How It Works
          </h2>
          <p
            className="text-body"
            style={{ color: "var(--muted)" }}
          >
            RinseList removes suppressed and invalid emails before you upload
            them to your ESP.
          </p>
        </div>

        {/* -----------------------------------------------------------------------
         * CAROUSEL SECTION
         * Visual step-by-step guide with numbered indicators
         * ----------------------------------------------------------------------- */}
        <div className="mb-10">
          {/* Carousel card - placeholder for visual content */}
          <div
            className="mb-4 flex h-[400px] flex-col items-start justify-end rounded-2xl p-4"
            style={{ backgroundColor: "var(--surface)" }}
          >
            {/* Step indicators */}
            <div className="flex items-center gap-1 rounded-full shadow-sm">
              {CAROUSEL_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-label"
                  style={{
                    backgroundColor: step.isActive
                      ? "var(--blue-200)"
                      : "var(--zinc-50)",
                    color: "var(--foreground)",
                  }}
                >
                  {step.number}
                </div>
              ))}
            </div>
          </div>

          {/* Current step description */}
          <p
            className="text-[18px] font-semibold leading-snug"
            style={{ color: "var(--muted)", letterSpacing: "-0.72px" }}
          >
            {CAROUSEL_STEPS.find((s) => s.isActive)?.description}
          </p>
        </div>

        {/* -----------------------------------------------------------------------
         * FILE SUPPORT SECTION
         * Information about supported file types
         * TODO: Update content from Figma when available
         * ----------------------------------------------------------------------- */}
        <div className="mb-10">
          <h3
            className="text-title mb-4"
            style={{ color: "var(--foreground)" }}
          >
            File Support
          </h3>
          <p
            className="text-body"
            style={{ color: "var(--muted)" }}
          >
            {FILE_SUPPORT_CONTENT}
          </p>
        </div>

        {/* -----------------------------------------------------------------------
         * FAQS SECTION
         * Frequently asked questions
         * TODO: Update content from Figma when available
         * ----------------------------------------------------------------------- */}
        <div>
          <h3
            className="text-title mb-4"
            style={{ color: "var(--foreground)" }}
          >
            FAQs
          </h3>
          <p
            className="text-body"
            style={{ color: "var(--muted)" }}
          >
            {FAQS_CONTENT}
          </p>
        </div>
      </aside>
    </>
  );
}
