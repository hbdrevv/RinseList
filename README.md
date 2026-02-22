# RinseList

Clean your email list before it hits Klaviyo or another ESP.

RinseList removes suppressed contacts and invalid email addresses from a contact list — entirely in the browser. No data is sent to a server. No files are stored. Upload, rinse, download.

**[rinselist.com](https://rinselist.com)** — free to use.

---

## What it does

Upload a Contact List and a Suppression List. RinseList cross-references them, removes any suppressed or invalid addresses from the Contact List, and packages the cleaned file alongside an audit report into a single ZIP download.

All processing happens client-side. Your data never leaves your browser.

---

## Who it's for

Non-technical email marketers and agency account managers who regularly need to clean lists before uploading to Klaviyo or similar platforms — without spreadsheet formulas or technical help.

---

## How it works

1. Upload your **Contact List** (CSV or XLSX) — all columns are preserved, only rows are removed
2. Upload your **Suppression List** (CSV or XLSX) — only the email column is used for matching
3. Configure options (audit report and invalid email removal are on by default)
4. Download a ZIP containing your cleaned list and an audit report

---

## Key decisions

**Client-side only.** Every file is processed in the browser using JavaScript. No backend, no database, no file storage. Customer data never leaves the client. This is a hard architectural constraint, not a current limitation.

**Rows only, never columns.** The Contact List column structure is always preserved. Segmentation data stays intact.

**CSV output regardless of input format.** XLSX files are read and processed, but output is always CSV — the format Klaviyo and most email platforms expect for upload.

**XLSX multi-sheet handling.** When an XLSX file with multiple sheets is uploaded, the first sheet is used by default. A note is displayed in the upload field confirming this.

**Theming via CSS custom properties.** No hardcoded color values anywhere in the codebase. Designed to be rethemeable from day one.

---

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [SheetJS](https://sheetjs.com) — CSV and XLSX parsing
- [JSZip](https://stuk.github.io/jszip/) — ZIP file generation
- Deployed on [Vercel](https://vercel.com)

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
/app          Next.js App Router pages and layout
/components   UI components
/lib          Core processing logic (parsing, matching, validation, zip)
/docs         Product spec and decision notes
```

---

## Contributing

This is an open utility. If you find a bug or have a suggestion, open an issue. PRs welcome for bug fixes — please open an issue before building new features.

---

## Roadmap

- [ ] XLSX sheet selector when multiple sheets are detected
- [ ] Batch file handling with server function to handle volume
- [ ] Agency whitelabel tier (custom subdomain, logo, brand colors)
- [ ] Direct Klaviyo API upload 
- [ ] Integration with project management tools to create a data-intake pipeline for agencies 

---

*Built by [Drew VanderVeen](https://drewvanderveen.com)*
