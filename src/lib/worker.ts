// Web Worker for file processing
// This runs processing off the main thread to keep UI responsive

import { parseFile, rowsToCSV } from "./parser";
import { matchAndClean } from "./matcher";
import { generateAuditReport } from "./audit";
import { createZip } from "./zip";

export interface WorkerInput {
  contactBuffer: ArrayBuffer;
  contactFileName: string;
  suppressionBuffer: ArrayBuffer;
  suppressionFileName: string;
  options: {
    generateAuditReport: boolean;
    removeInvalidEmails: boolean;
  };
}

export interface WorkerOutput {
  success: true;
  zipBlob: Blob;
  stats: {
    totalRows: number;
    cleanedCount: number;
    suppressedCount: number;
    invalidCount: number;
  };
  contactListHasMultipleSheets: boolean;
  suppressionListHasMultipleSheets: boolean;
}

export interface WorkerError {
  success: false;
  error: string;
}

export type WorkerResult = WorkerOutput | WorkerError;

function detectSameFile(
  contactBuffer: ArrayBuffer,
  suppressionBuffer: ArrayBuffer
): boolean {
  if (contactBuffer.byteLength !== suppressionBuffer.byteLength) {
    return false;
  }

  const contactView = new Uint8Array(contactBuffer);
  const suppressionView = new Uint8Array(suppressionBuffer);

  for (let i = 0; i < contactView.length; i++) {
    if (contactView[i] !== suppressionView[i]) {
      return false;
    }
  }

  return true;
}

async function processInWorker(input: WorkerInput): Promise<WorkerResult> {
  const {
    contactBuffer,
    contactFileName,
    suppressionBuffer,
    suppressionFileName,
    options,
  } = input;

  // Check for same file upload
  if (detectSameFile(contactBuffer, suppressionBuffer)) {
    return {
      success: false,
      error:
        "The Contact List and Suppression List appear to be the same file. Please upload your Klaviyo suppression list as the Suppression List.",
    };
  }

  // Parse contact list
  const contactResult = parseFile(contactBuffer, contactFileName);
  if (!contactResult.success) {
    return {
      success: false,
      error: `Contact List: ${contactResult.error.message}`,
    };
  }

  // Parse suppression list
  const suppressionResult = parseFile(suppressionBuffer, suppressionFileName);
  if (!suppressionResult.success) {
    return {
      success: false,
      error: `Suppression List: ${suppressionResult.error.message}`,
    };
  }

  // Perform matching
  const matchResult = matchAndClean(
    contactResult.data,
    suppressionResult.data,
    { removeInvalidEmails: options.removeInvalidEmails }
  );

  // Generate output CSV
  const cleanedCSV = rowsToCSV(
    contactResult.data.headers,
    matchResult.cleanedRows
  );

  // Generate audit report if requested
  let auditCSV: string | undefined;
  if (options.generateAuditReport && matchResult.removedRows.length > 0) {
    auditCSV = generateAuditReport(matchResult.removedRows);
  }

  // Create ZIP
  const zipBlob = await createZip({
    cleanedListCSV: cleanedCSV,
    auditReportCSV: auditCSV,
  });

  return {
    success: true,
    zipBlob,
    stats: matchResult.stats,
    contactListHasMultipleSheets: contactResult.data.hasMultipleSheets,
    suppressionListHasMultipleSheets: suppressionResult.data.hasMultipleSheets,
  };
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const result = await processInWorker(event.data);
  self.postMessage(result);
};
