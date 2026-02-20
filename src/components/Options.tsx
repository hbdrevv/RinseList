"use client";

interface OptionsProps {
  generateAuditReport: boolean;
  onGenerateAuditReportChange: (value: boolean) => void;
  removeInvalidEmails: boolean;
  onRemoveInvalidEmailsChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Options({
  generateAuditReport,
  onGenerateAuditReportChange,
  removeInvalidEmails,
  onRemoveInvalidEmailsChange,
  disabled = false,
}: OptionsProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <h3
        className="mb-3 text-sm font-medium"
        style={{ color: "var(--foreground)" }}
      >
        Options
      </h3>

      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <input
            type="checkbox"
            checked={generateAuditReport}
            onChange={(e) => onGenerateAuditReportChange(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded"
            style={{ accentColor: "var(--primary)" }}
          />
          <div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Generate Audit Report
            </span>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Creates a CSV documenting every removed row and the reason
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <input
            type="checkbox"
            checked={removeInvalidEmails}
            onChange={(e) => onRemoveInvalidEmailsChange(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 h-4 w-4 rounded"
            style={{ accentColor: "var(--primary)" }}
          />
          <div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Remove Invalid Emails
            </span>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Removes malformed email addresses from the Contact List
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
