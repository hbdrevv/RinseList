"use client";

import { useEffect } from "react";

interface ResetModalProps {
  onDownload: () => void;
  onContinueWithoutSaving: () => void;
  onClose: () => void;
}

export function ResetModal({
  onDownload,
  onContinueWithoutSaving,
  onClose,
}: ResetModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 shadow-xl"
        style={{ backgroundColor: "var(--surface-elevated)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="mb-2 text-xl font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Grab your files before you go!
        </h2>

        <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
          Your cleaned list and report will be permanently removed if you
          haven&apos;t downloaded them yet. Files are processed locally and never
          stored.
        </p>

        <div className="space-y-3">
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
            onClick={onContinueWithoutSaving}
            className="w-full rounded-lg py-3 font-medium transition-colors"
            style={{
              backgroundColor: "transparent",
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            Continue Without Saving
          </button>
        </div>
      </div>
    </div>
  );
}
