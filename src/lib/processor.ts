import type { WorkerInput, WorkerResult } from "./worker";

export interface ProcessingOptions {
  generateAuditReport: boolean;
  removeInvalidEmails: boolean;
}

export interface ProcessingResult {
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

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export async function processFiles(
  contactListFile: File,
  suppressionListFile: File,
  options: ProcessingOptions
): Promise<ProcessingResult> {
  // Read both files
  const [contactBuffer, suppressionBuffer] = await Promise.all([
    readFileAsArrayBuffer(contactListFile),
    readFileAsArrayBuffer(suppressionListFile),
  ]);

  // Use Web Worker if available to keep UI responsive
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

  // Fallback: import and run directly (for environments without Worker support)
  const { parseFile, rowsToCSV } = await import("./parser");
  const { matchAndClean } = await import("./matcher");
  const { generateAuditReport } = await import("./audit");
  const { createZip } = await import("./zip");

  // Same file detection
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

  const contactResult = parseFile(contactBuffer, contactListFile.name);
  if (!contactResult.success) {
    throw new Error(`Contact List: ${contactResult.error.message}`);
  }

  const suppressionResult = parseFile(suppressionBuffer, suppressionListFile.name);
  if (!suppressionResult.success) {
    throw new Error(`Suppression List: ${suppressionResult.error.message}`);
  }

  const matchResult = matchAndClean(
    contactResult.data,
    suppressionResult.data,
    { removeInvalidEmails: options.removeInvalidEmails }
  );

  const cleanedCSV = rowsToCSV(
    contactResult.data.headers,
    matchResult.cleanedRows
  );

  let auditCSV: string | undefined;
  if (options.generateAuditReport && matchResult.removedRows.length > 0) {
    auditCSV = generateAuditReport(matchResult.removedRows);
  }

  const zipBlob = await createZip({
    cleanedListCSV: cleanedCSV,
    auditReportCSV: auditCSV,
  });

  return {
    zipBlob,
    stats: matchResult.stats,
    contactListHasMultipleSheets: contactResult.data.hasMultipleSheets,
    suppressionListHasMultipleSheets: suppressionResult.data.hasMultipleSheets,
  };
}
