/**
 * =============================================================================
 * FILE PROCESSOR
 * =============================================================================
 *
 * Main orchestrator for file processing. Coordinates the Web Worker
 * for off-thread processing and provides fallback for environments
 * without Worker support.
 *
 * USAGE:
 * const result = await processFiles(contactFile, suppressionFile, options);
 * // result contains: zipBlob, cleanedListBlob, auditReportBlob, stats
 *
 * =============================================================================
 */

import type { WorkerInput, WorkerResult } from "./worker";

/* -----------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * -------------------------------------------------------------------------- */

/**
 * Processing options
 */
export interface ProcessingOptions {
  /** Whether to generate an audit report of removed emails */
  generateAuditReport: boolean;
  /** Whether to remove invalid email formats */
  removeInvalidEmails: boolean;
}

/**
 * Processing result with all output files
 */
export interface ProcessingResult {
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
  /** Flag indicating contact list had multiple sheets */
  contactListHasMultipleSheets: boolean;
  /** Flag indicating suppression list had multiple sheets */
  suppressionListHasMultipleSheets: boolean;
}

/* -----------------------------------------------------------------------------
 * HELPER FUNCTIONS
 * -------------------------------------------------------------------------- */

/**
 * Read a File as ArrayBuffer
 */
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
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
 * Process contact and suppression list files
 *
 * Uses Web Worker when available for off-thread processing.
 * Falls back to main thread processing in environments without Worker support.
 *
 * @param contactListFile - The contact list file to clean
 * @param suppressionListFile - The suppression list file with emails to remove
 * @param options - Processing options
 * @returns Processing result with all output files
 */
export async function processFiles(
  contactListFile: File,
  suppressionListFile: File,
  options: ProcessingOptions
): Promise<ProcessingResult> {
  // -------------------------------------------------------------------------
  // READ FILES: Read both files as ArrayBuffers
  // -------------------------------------------------------------------------
  const [contactBuffer, suppressionBuffer] = await Promise.all([
    readFileAsArrayBuffer(contactListFile),
    readFileAsArrayBuffer(suppressionListFile),
  ]);

  // -------------------------------------------------------------------------
  // WEB WORKER PATH: Use Worker if available (preferred)
  // -------------------------------------------------------------------------
  if (typeof Worker !== "undefined") {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("./worker.ts", import.meta.url),
        { type: "module" }
      );

      const input: WorkerInput = {
        contactBuffer,
        contactFileName: contactListFile.name,
        suppressionBuffer,
        suppressionFileName: suppressionListFile.name,
        options: {
          generateAuditReport: options.generateAuditReport,
          removeInvalidEmails: options.removeInvalidEmails,
        },
      };

      worker.onmessage = (event: MessageEvent<WorkerResult>) => {
        worker.terminate();
        const result = event.data;

        if (result.success) {
          resolve({
            zipBlob: result.zipBlob,
            cleanedListBlob: result.cleanedListBlob,
            auditReportBlob: result.auditReportBlob,
            stats: result.stats,
            contactListHasMultipleSheets: result.contactListHasMultipleSheets,
            suppressionListHasMultipleSheets: result.suppressionListHasMultipleSheets,
          });
        } else {
          reject(new Error(result.error));
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        reject(new Error(`Processing failed: ${error.message}`));
      };

      // Transfer buffers to worker for better performance
      worker.postMessage(input, [contactBuffer, suppressionBuffer]);
    });
  }

  // -------------------------------------------------------------------------
  // FALLBACK PATH: Direct processing (for environments without Worker)
  // -------------------------------------------------------------------------
  const { parseFile, rowsToCSV } = await import("./parser");
  const { matchAndClean } = await import("./matcher");
  const { generateAuditReport } = await import("./audit");
  const { createZip } = await import("./zip");

  // Validate: Same file detection
  if (contactBuffer.byteLength === suppressionBuffer.byteLength) {
    const contactView = new Uint8Array(contactBuffer);
    const suppressionView = new Uint8Array(suppressionBuffer);
    let same = true;
    for (let i = 0; i < contactView.length; i++) {
      if (contactView[i] !== suppressionView[i]) {
        same = false;
        break;
      }
    }
    if (same) {
      throw new Error(
        "The Contact List and Suppression List appear to be the same file. Please upload your Klaviyo suppression list as the Suppression List."
      );
    }
  }

  // Parse contact list
  const contactResult = parseFile(contactBuffer, contactListFile.name);
  if (!contactResult.success) {
    throw new Error(`Contact List: ${contactResult.error.message}`);
  }

  // Parse suppression list
  const suppressionResult = parseFile(suppressionBuffer, suppressionListFile.name);
  if (!suppressionResult.success) {
    throw new Error(`Suppression List: ${suppressionResult.error.message}`);
  }

  // Perform matching
  const matchResult = matchAndClean(
    contactResult.data,
    suppressionResult.data,
    { removeInvalidEmails: options.removeInvalidEmails }
  );

  // Generate cleaned list CSV
  const cleanedCSV = rowsToCSV(
    contactResult.data.headers,
    matchResult.cleanedRows
  );
  const cleanedListBlob = csvToBlob(cleanedCSV);

  // Generate audit report if requested
  let auditCSV: string | undefined;
  let auditReportBlob: Blob | null = null;

  if (options.generateAuditReport && matchResult.removedRows.length > 0) {
    auditCSV = generateAuditReport(matchResult.removedRows);
    auditReportBlob = csvToBlob(auditCSV);
  }

  // Create ZIP bundle
  const zipBlob = await createZip({
    cleanedListCSV: cleanedCSV,
    auditReportCSV: auditCSV,
  });

  return {
    zipBlob,
    cleanedListBlob,
    auditReportBlob,
    stats: matchResult.stats,
    contactListHasMultipleSheets: contactResult.data.hasMultipleSheets,
    suppressionListHasMultipleSheets: suppressionResult.data.hasMultipleSheets,
  };
}
