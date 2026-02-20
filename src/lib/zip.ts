import JSZip from "jszip";

export interface ZipContents {
  cleanedListCSV: string;
  auditReportCSV?: string;
}

export async function createZip(contents: ZipContents): Promise<Blob> {
  const zip = new JSZip();

  zip.file("cleaned-list.csv", contents.cleanedListCSV);

  if (contents.auditReportCSV) {
    zip.file("rinse-report.csv", contents.auditReportCSV);
  }

  return zip.generateAsync({ type: "blob" });
}
