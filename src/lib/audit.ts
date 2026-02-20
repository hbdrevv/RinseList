import { RemovedRow } from "./matcher";
import { rowsToCSV } from "./parser";

export function generateAuditReport(removedRows: RemovedRow[]): string {
  const headers = ["Original Row", "Email", "Removal Reason"];

  const rows = removedRows.map((row) => ({
    "Original Row": String(row.originalRowNumber),
    Email: row.email,
    "Removal Reason": row.reason === "suppressed" ? "Suppressed" : "Invalid Format",
  }));

  return rowsToCSV(headers, rows);
}
