"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Options } from "@/components/Options";
import { Results } from "@/components/Results";
import { ResetModal } from "@/components/ResetModal";
import { processFiles, ProcessingResult } from "@/lib/processor";

type AppState = "upload" | "loading" | "results";

interface UploadedFile {
  file: File;
  name: string;
}

export default function Home() {
  const [state, setState] = useState<AppState>("upload");
  const [contactList, setContactList] = useState<UploadedFile | null>(null);
  const [suppressionList, setSuppressionList] = useState<UploadedFile | null>(
    null
  );
  const [generateAuditReport, setGenerateAuditReport] = useState(true);
  const [removeInvalidEmails, setRemoveInvalidEmails] = useState(true);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // beforeunload warning when in results state with undownloaded results
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === "results" && !hasDownloaded && result) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state, hasDownloaded, result]);

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

  const handleReset = useCallback(() => {
    setShowResetModal(false);
    setState("upload");
    setContactList(null);
    setSuppressionList(null);
    setResult(null);
    setError(null);
    setHasDownloaded(false);
  }, []);

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

  const canProcess = contactList && suppressionList;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            RinseList
          </h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            Clean your email list before it hits Klaviyo. All processing happens
            in your browser.
          </p>
        </header>

        <div className="flex gap-8">
          {/* Left panel - Instructions (always visible) */}
          <aside className="w-72 shrink-0">
            <div
              className="rounded-lg p-6"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <h2
                className="mb-4 text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                How to use
              </h2>
              <ol
                className="list-decimal space-y-3 pl-4 text-sm"
                style={{ color: "var(--muted)" }}
              >
                <li>Upload your Contact List (the list you want to clean)</li>
                <li>Upload your Suppression List (from Klaviyo)</li>
                <li>Configure options if needed</li>
                <li>Download your cleaned list and audit report</li>
              </ol>
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex flex-1 gap-6">
            {/* Upload/Input panel */}
            <div
              className={`flex-1 rounded-lg p-6 shadow-sm ${
                state !== "upload" ? "opacity-60" : ""
              }`}
              style={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <h2
                className="mb-6 text-xl font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Upload Files
              </h2>

              <div className="space-y-6">
                <FileUpload
                  label="Contact List"
                  description="The list you want to clean"
                  file={contactList}
                  onFileSelect={setContactList}
                  disabled={state !== "upload"}
                  otherFile={suppressionList}
                />

                <FileUpload
                  label="Suppression List"
                  description="Export from Klaviyo"
                  file={suppressionList}
                  onFileSelect={setSuppressionList}
                  disabled={state !== "upload"}
                  otherFile={contactList}
                />

                <Options
                  generateAuditReport={generateAuditReport}
                  onGenerateAuditReportChange={setGenerateAuditReport}
                  removeInvalidEmails={removeInvalidEmails}
                  onRemoveInvalidEmailsChange={setRemoveInvalidEmails}
                  disabled={state !== "upload"}
                />

                {state === "upload" && (
                  <button
                    onClick={handleProcess}
                    disabled={!canProcess}
                    className="w-full rounded-lg py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: canProcess
                        ? "var(--primary)"
                        : "var(--border)",
                      color: canProcess
                        ? "var(--primary-foreground)"
                        : "var(--muted)",
                    }}
                  >
                    Process Files
                  </button>
                )}
              </div>
            </div>

            {/* Results panel (visible in loading and results states) */}
            {(state === "loading" || state === "results") && (
              <div
                className="flex-1 rounded-lg p-6 shadow-sm"
                style={{
                  backgroundColor: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                {state === "loading" && (
                  <div className="flex h-full flex-col items-center justify-center">
                    <div
                      className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                      style={{ borderColor: "var(--border)", borderTopColor: "transparent" }}
                    />
                    <p className="mt-4" style={{ color: "var(--muted)" }}>
                      Processing your files...
                    </p>
                  </div>
                )}

                {state === "results" && (
                  <Results
                    result={result}
                    error={error}
                    onDownload={handleDownload}
                    onReset={() => setShowResetModal(true)}
                    onTryAgain={handleReset}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showResetModal && (
        <ResetModal
          onDownload={() => {
            handleDownload();
            setShowResetModal(false);
          }}
          onContinueWithoutSaving={handleReset}
          onClose={() => setShowResetModal(false)}
        />
      )}
    </main>
  );
}
