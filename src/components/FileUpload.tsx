"use client";

import { useCallback, useRef, useState } from "react";

interface UploadedFile {
  file: File;
  name: string;
}

interface FileUploadProps {
  label: string;
  description: string;
  file: UploadedFile | null;
  onFileSelect: (file: UploadedFile | null) => void;
  disabled?: boolean;
  otherFile?: UploadedFile | null;
}

const ACCEPTED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

function isValidFile(file: File): boolean {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
}

export function FileUpload({
  label,
  description,
  file,
  onFileSelect,
  disabled = false,
  otherFile,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSameFile =
    file && otherFile && file.name === otherFile.name && file.file.size === otherFile.file.size;

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

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onFileSelect(null);
      setError(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [onFileSelect]
  );

  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium"
        style={{ color: "var(--foreground)" }}
      >
        {label}
      </label>
      <p className="mb-2 text-sm" style={{ color: "var(--muted)" }}>
        {description}
      </p>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        style={{
          borderColor: isDragging
            ? "var(--primary)"
            : error
              ? "var(--destructive)"
              : "var(--border)",
          backgroundColor: isDragging ? "var(--surface)" : "transparent",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              style={{ color: "var(--success)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                {file.name}
              </p>
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="text-sm underline"
                  style={{ color: "var(--muted)" }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <svg
              className="mb-2 h-8 w-8"
              style={{ color: "var(--muted)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {isDragging ? "Drop file here" : "Drag & drop or click to browse"}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              CSV or XLSX
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}

      {isSameFile && label === "Suppression List" && (
        <p className="mt-2 text-sm" style={{ color: "var(--warning)" }}>
          The Contact List and Suppression List must be different files.
        </p>
      )}
    </div>
  );
}
