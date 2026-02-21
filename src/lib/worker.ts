/**
 * =============================================================================
 * WEB WORKER - FILE PROCESSING
 * =============================================================================
 *
 * Runs file processing off the main thread to keep UI responsive.
 * Handles CSV/XLSX parsing, email matching, and output generation.
 *
 * PROCESS FLOW:
 * 1. Validate files are different
 * 2. Parse contact list and suppression list
 * 3. Match emails and identify removals
 * 4. Generate cleaned list CSV
 * 5. Generate audit report CSV (if enabled)
 * 6. Package outputs as ZIP and individual blobs
 *
 * =============================================================================
 */

import { parseFile, rowsToCSV } from "./parser";
import { matchAndClean } from "./matcher";
import { generateAuditReport } from "./audit";
import { createZip } from "./zip";

/* -----------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * -------------------------------------------------------------------------- */

/**
 * Input data passed to the worker
 */
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

/**
 * Successful processing result
 * Includes both ZIP bundle and individual file blobs for separate downloads
 */
export interface WorkerOutput {
  success: true;
  /** Combined ZIP file with all outputs */
  zipBlob: Blob;
  /** Individual blob for cleaned email list (for separate download) */
  cleanedListBlob: Blob;
  /** Individual blob for audit report - removed emails (for separate download) */
  auditReportBlob: Blob | null;
  /** Processing statistics */
  stats: {
    totalRows: number;
    cleanedCount: number;
    suppressedCount: number;
    invalidCount: number;
  };
  /** Flags for multiple sheet warnings */
  contactListHasMultipleSheets: boolean;
  suppressionListHasMultipleSheets: boolean;
}

/**
 * Processing error result
 */
export interface WorkerError {
  success: false;
  error: string;
}

/**
 * Union type for all possible worker results
 */
export type WorkerResult = WorkerOutput | WorkerError;

/* -----------------------------------------------------------------------------
 * HELPER FUNCTIONS
 * -------------------------------------------------------------------------- */

/**
 * Detect if two buffers contain identical data
 * Used to prevent uploading the same file as both contact and suppression list
 */
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

/**
 * Convert CSV string to Blob for download
 */
function csvToBlob(csv: string): Blob {
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

/* -----------------------------------------------------------------------------
 * MAIN PROCESSING FUNCTION
 * -------------------------------------------------------------------------- */

/**
 * Main worker processing function
 * Performs all file processing and returns results
 */
async function processInWorker(input: WorkerInput): Promise<WorkerResult> {
  const {
    contactBuffer,
    contactFileName,
    suppressionBuffer,
    suppressionFileName,
    options,
  } = input;

  // -------------------------------------------------------------------------
  // VALIDATION: Check for same file upload
  // -------------------------------------------------------------------------
  if (detectSameFile(contactBuffer, suppressionBuffer)) {
    return {
      success: false,
      error:
        "The Contact List and Suppression List appear to be the same file. Please upload your Klaviyo suppression list as the Suppression List.",
    };
  }

  // -------------------------------------------------------------------------
  // PARSING: Parse contact list
  // -------------------------------------------------------------------------
  const contactResult = parseFile(contactBuffer, contactFileName);
  if (!contactResult.success) {
    return {
      success: false,
      error: `Contact List: ${contactResult.error.message}`,
    };
  }

  // -------------------------------------------------------------------------
  // PARSING: Parse suppression list
  // -------------------------------------------------------------------------
  const suppressionResult = parseFile(suppressionBuffer, suppressionFileName);
  if (!suppressionResult.success) {
    return {
      success: false,
      error: `Suppression List: ${suppressionResult.error.message}`,
    };
  }

  // -------------------------------------------------------------------------
  // MATCHING: Perform email matching and cleaning
  // -------------------------------------------------------------------------
  const matchResult = matchAndClean(
    contactResult.data,
    suppressionResult.data,
    { removeInvalidEmails: options.removeInvalidEmails }
  );

  // -------------------------------------------------------------------------
  // OUTPUT: Generate cleaned list CSV
  // -------------------------------------------------------------------------
  const cleanedCSV = rowsToCSV(
    contactResult.data.headers,
    matchResult.cleanedRows
  );
  const cleanedListBlob = csvToBlob(cleanedCSV);

  // -------------------------------------------------------------------------
  // OUTPUT: Generate audit report CSV (if enabled and there are removals)
  // -------------------------------------------------------------------------
  let auditCSV: string | undefined;
  let auditReportBlob: Blob | null = null;

  if (options.generateAuditReport && matchResult.removedRows.length > 0) {
    auditCSV = generateAuditReport(matchResult.removedRows);
    auditReportBlob = csvToBlob(auditCSV);
  }

  // -------------------------------------------------------------------------
  // OUTPUT: Create ZIP bundle with all files
  // -------------------------------------------------------------------------
  const zipBlob = await createZip({
    cleanedListCSV: cleanedCSV,
    auditReportCSV: auditCSV,
  });

  // -------------------------------------------------------------------------
  // RETURN: Success result with all outputs
  // -------------------------------------------------------------------------
  return {
    success: true,
    zipBlob,
    cleanedListBlob,
    auditReportBlob,
    stats: matchResult.stats,
    contactListHasMultipleSheets: contactResult.data.hasMultipleSheets,
    suppressionListHasMultipleSheets: suppressionResult.data.hasMultipleSheets,
  };
}

/* -----------------------------------------------------------------------------
 * WORKER MESSAGE HANDLER
 * -------------------------------------------------------------------------- */

/**
 * Handle incoming messages from main thread
 * Processes the input and posts result back
 */
self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const result = await processInWorker(event.data);
  self.postMessage(result);
};
