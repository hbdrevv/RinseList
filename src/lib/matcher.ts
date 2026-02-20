import { ParsedFile } from "./parser";
import { isValidEmail, normalizeEmail } from "./email";

export type RemovalReason = "suppressed" | "invalid";

export interface RemovedRow {
  originalRowNumber: number;
  email: string;
  reason: RemovalReason;
  rowData: Record<string, string>;
}

export interface MatchResult {
  cleanedRows: Record<string, string>[];
  removedRows: RemovedRow[];
  stats: {
    totalRows: number;
    cleanedCount: number;
    suppressedCount: number;
    invalidCount: number;
  };
}

export function matchAndClean(
  contactList: ParsedFile,
  suppressionList: ParsedFile,
  options: { removeInvalidEmails: boolean }
): MatchResult {
  // Build suppression set (normalized emails for case-insensitive matching)
  const suppressionSet = new Set<string>();
  for (const row of suppressionList.rows) {
    const email = row[suppressionList.emailColumnName];
    if (email) {
      suppressionSet.add(normalizeEmail(email));
    }
  }

  const cleanedRows: Record<string, string>[] = [];
  const removedRows: RemovedRow[] = [];
  let suppressedCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < contactList.rows.length; i++) {
    const row = contactList.rows[i];
    const email = row[contactList.emailColumnName];
    const normalizedEmail = normalizeEmail(email);
    const originalRowNumber = i + 2; // +2 for 1-based indexing and header row

    // Check if email is in suppression list
    if (suppressionSet.has(normalizedEmail)) {
      removedRows.push({
        originalRowNumber,
        email,
        reason: "suppressed",
        rowData: row,
      });
      suppressedCount++;
      continue;
    }

    // Check if email is invalid (if option enabled)
    if (options.removeInvalidEmails && !isValidEmail(email)) {
      removedRows.push({
        originalRowNumber,
        email,
        reason: "invalid",
        rowData: row,
      });
      invalidCount++;
      continue;
    }

    // Email passes all checks - keep it
    cleanedRows.push(row);
  }

  return {
    cleanedRows,
    removedRows,
    stats: {
      totalRows: contactList.rows.length,
      cleanedCount: cleanedRows.length,
      suppressedCount,
      invalidCount,
    },
  };
}
