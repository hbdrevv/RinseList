"use client";

/**
 * =============================================================================
 * FILE UPLOAD COMPONENT
 * =============================================================================
 *
 * Drag-and-drop file upload zone for CSV/XLSX files.
 *
 * STATES (based on Figma v1 flow):
 * - Empty: Blue dashed border, blue background, upload prompt
 * - Success: Green solid border, green background, filename display
 * - Disabled: Reduced opacity, no interactions
 *
 * USAGE:
 * <FileUpload
 *   type="contact" | "suppression"
 *   file={uploadedFile}
 *   onFileSelect={(file) => setFile(file)}
 *   disabled={false}
 * />
 *
 * =============================================================================
 */

import { useCallback, useRef, useState } from "react";

/* -----------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * -------------------------------------------------------------------------- */

/**
 * Uploaded file with metadata
 */
interface UploadedFile {
  file: File;
  name: string;
}

/**
 * Upload type determines the prompt copy
 * - contact: "Drag your new contact list here..."
 * - suppression: "Drag your suppression list here..."
 */
type UploadType = "contact" | "suppression";

interface FileUploadProps {
  /** Type of file being uploaded - affects prompt copy */
  type: UploadType;
  /** Currently uploaded file (null if empty) */
  file: UploadedFile | null;
  /** Callback when file is selected or cleared */
  onFileSelect: (file: UploadedFile | null) => void;
  /** Whether the upload zone is disabled */
  disabled?: boolean;
}

/* -----------------------------------------------------------------------------
 * CONSTANTS
 * -------------------------------------------------------------------------- */

/** Accepted MIME types for file input */
const ACCEPTED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

/** Accepted file extensions */
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

/** Helper text shown below upload zone */
const HELPER_TEXT =
  "Accepts CSV or XSLX files. Excel docs default to the first sheet in the document.";

/** Prompt copy based on upload type */
const PROMPTS: Record<UploadType, { prefix: string; emphasis: string }> = {
  contact: {
    prefix: "Drag your new ",
    emphasis: "contact list",
  },
  suppression: {
    prefix: "Drag your ",
    emphasis: "suppression list",
  },
};

/* -----------------------------------------------------------------------------
 * HELPER FUNCTIONS
 * -------------------------------------------------------------------------- */

/**
 * Validates file type by MIME type or extension
 */
function isValidFile(file: File): boolean {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return (
    ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension)
  );
}

/* -----------------------------------------------------------------------------
 * ICON COMPONENTS
 * -------------------------------------------------------------------------- */

/**
 * File upload icon (shown in empty state)
 * Matches Figma: file-upload icon
 */
function FileUploadIcon({ className }: { className?: string }) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="12" y2="12" />
      <line x1="15" y1="15" x2="12" y2="12" />
    </svg>
  );
}

/**
 * Check circle icon (shown in success state)
 * Matches Figma: check-circle icon
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

/* -----------------------------------------------------------------------------
 * MAIN COMPONENT
 * -------------------------------------------------------------------------- */

export function FileUpload({
  type,
  file,
  onFileSelect,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------------
   * EVENT HANDLERS
   * ------------------------------------------------------------------------- */

  /**
   * Process a selected file
   * Validates file type and updates state
   */
  const handleFile = useCallback(
    (selectedFile: File) => {
      if (!isValidFile(selectedFile)) {
        setError("Please upload a CSV or XLSX file.");
        return;
      }

      setError(null);
      onFileSelect({
        file: selectedFile,
        name: selectedFile.name,
      });
    },
    [onFileSelect]
  );

  /**
   * Handle file drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [disabled, handleFile]
  );

  /**
   * Handle drag over (enables drop)
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Handle click to open file picker
   */
  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  /**
   * Handle "Replace File" click
   * Opens file picker to select new file
   */
  const handleReplace = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        // Reset input to allow selecting same file again
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  /* ---------------------------------------------------------------------------
   * COMPUTED VALUES
   * ------------------------------------------------------------------------- */

  const hasFile = !!file;
  const prompt = PROMPTS[type];

  /* ---------------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------------- */

  return (
    <div>
      {/* Upload zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex h-[60px] cursor-pointer items-center
          border px-3 transition-all sm:h-[75px] sm:px-4 md:h-[89px] md:px-6
          ${disabled ? "cursor-not-allowed" : ""}
          ${hasFile ? "border-solid" : "border-dashed"}
        `}
        style={{
          // Background color based on state
          backgroundColor: hasFile
            ? "var(--upload-success-bg)"
            : isDragging
              ? "var(--blue-100)"
              : "var(--upload-bg)",
          // Border color based on state
          borderColor: hasFile
            ? "var(--upload-success-border)"
            : "var(--upload-border)",
          borderRadius: "var(--radius-sm)",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {hasFile ? (
          /* -----------------------------------------------------------------
           * SUCCESS STATE
           * Shows filename with check icon and "Replace File" action
           * ----------------------------------------------------------------- */
          <div className="flex w-full items-center gap-2 md:gap-3">
            {/* Success icon box */}
            <div
              className="flex h-[28px] shrink-0 items-center p-[6px] sm:h-[34px] sm:p-[8px] md:h-[40px] md:p-[10px]"
              style={{
                backgroundColor: "var(--upload-success-icon-bg)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <CheckCircleIcon className="h-4 w-4 text-white sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>

            {/* Filename */}
            <p
              className="flex-1 truncate text-[12px] sm:text-[14px] md:text-[18px]"
              style={{
                color: "var(--upload-success-text)",
                letterSpacing: "-0.36px",
              }}
            >
              {file.name}
            </p>

            {/* Replace File action */}
            {!disabled && (
              <button
                onClick={handleReplace}
                className="shrink-0 text-[10px] underline transition-opacity hover:opacity-80 md:text-[12px]"
                style={{
                  color: "var(--upload-success-text)",
                  letterSpacing: "-0.24px",
                }}
              >
                Replace
              </button>
            )}
          </div>
        ) : (
          /* -----------------------------------------------------------------
           * EMPTY STATE
           * Shows upload prompt with icon
           * ----------------------------------------------------------------- */
          <div className="flex w-full items-center gap-2 md:gap-3">
            {/* Upload icon box */}
            <div
              className="flex h-[28px] shrink-0 items-center p-[6px] sm:h-[34px] sm:p-[8px] md:h-[40px] md:p-[10px]"
              style={{
                backgroundColor: "var(--upload-icon-bg)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <FileUploadIcon className="h-4 w-4 text-white sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>

            {/* Upload prompt */}
            <p
              className="text-[11px] leading-tight sm:text-[14px] md:text-[18px]"
              style={{
                color: "var(--upload-text)",
                letterSpacing: "-0.36px",
              }}
            >
              <span className="hidden sm:inline">{prompt.prefix}{prompt.emphasis} here or </span>
              <span className="sm:hidden">Drop {prompt.emphasis} or </span>
              <span
                className="font-semibold underline"
                style={{ color: "var(--accent-magenta)" }}
              >
                <span className="hidden sm:inline">click to upload your file</span>
                <span className="sm:hidden">tap to upload</span>
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p
        className="mt-[8px] text-[10px] sm:text-[12px] md:mt-[11px] md:text-[16px]"
        style={{
          color: "var(--muted-light)",
          letterSpacing: "-0.64px",
        }}
      >
        {HELPER_TEXT}
      </p>

      {/* Error message (validation error) */}
      {error && (
        <p
          className="mt-2 text-xs md:text-body"
          style={{ color: "var(--destructive)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
