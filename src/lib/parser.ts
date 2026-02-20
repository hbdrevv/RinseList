import * as XLSX from "xlsx";

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  emailColumnIndex: number;
  emailColumnName: string;
  hasMultipleSheets: boolean;
}

export interface ParseError {
  type: "no_email_column" | "empty_file" | "parse_error";
  message: string;
}

export type ParseResult =
  | { success: true; data: ParsedFile }
  | { success: false; error: ParseError };

// Common email column names to look for
const EMAIL_COLUMN_PATTERNS = [
  /^email$/i,
  /^e-?mail$/i,
  /^email.?address$/i,
  /^e-?mail.?address$/i,
  /^subscriber.?email$/i,
  /^contact.?email$/i,
];

function detectEmailColumn(headers: string[]): number {
  // First pass: exact matches on common patterns
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].trim();
    for (const pattern of EMAIL_COLUMN_PATTERNS) {
      if (pattern.test(header)) {
        return i;
      }
    }
  }

  // Second pass: any column containing "email"
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase().includes("email")) {
      return i;
    }
  }

  return -1;
}

export function parseFile(buffer: ArrayBuffer, fileName: string): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const hasMultipleSheets = workbook.SheetNames.length > 1;

    // Use first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return {
        success: false,
        error: {
          type: "empty_file",
          message: "The file appears to be empty or could not be read.",
        },
      };
    }

    // Convert to JSON with header option
    const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    if (jsonData.length === 0) {
      return {
        success: false,
        error: {
          type: "empty_file",
          message: "The file appears to be empty.",
        },
      };
    }

    // First row is headers
    const headers = (jsonData[0] || []).map((h) => String(h || "").trim());

    if (headers.length === 0 || headers.every((h) => !h)) {
      return {
        success: false,
        error: {
          type: "empty_file",
          message: "The file does not contain any column headers.",
        },
      };
    }

    // Rest are data rows
    const dataRows = jsonData.slice(1);

    if (dataRows.length === 0) {
      return {
        success: false,
        error: {
          type: "empty_file",
          message:
            "The file contains headers but no data rows. Please verify the file has data.",
        },
      };
    }

    // Detect email column
    const emailColumnIndex = detectEmailColumn(headers);

    if (emailColumnIndex === -1) {
      return {
        success: false,
        error: {
          type: "no_email_column",
          message:
            "Could not find an email column in this file. Please ensure your file has a column with email addresses (commonly named 'Email', 'E-mail', or 'Email Address').",
        },
      };
    }

    // Convert rows to objects
    const rows: Record<string, string>[] = dataRows
      .filter((row) => row && row.length > 0 && row.some((cell) => cell))
      .map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          obj[header] = String(row[i] ?? "");
        });
        return obj;
      });

    return {
      success: true,
      data: {
        headers,
        rows,
        emailColumnIndex,
        emailColumnName: headers[emailColumnIndex],
        hasMultipleSheets,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        type: "parse_error",
        message: `Failed to parse the file. Please ensure it's a valid CSV or XLSX file. ${
          err instanceof Error ? err.message : ""
        }`,
      },
    };
  }
}

export function rowsToCSV(headers: string[], rows: Record<string, string>[]): string {
  const escapeCSV = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCSV(row[h] || "")).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}
