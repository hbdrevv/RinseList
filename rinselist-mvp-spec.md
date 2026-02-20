# RinseList — MVP Product Spec
*Version 1.1 | February 2026*

---

## Product Overview

**RinseList** is a client-side email list cleaning utility that removes suppressed and invalid email addresses from a contact list before upload to an email marketing platform (primarily Klaviyo). All processing happens in the browser — no data is transmitted to a server, no files are stored, no backend required.

**URL:** rinselist.com  
**Stack:** Next.js (App Router), deployed on Vercel  
**Monetization:** Donation-based (MVP)  
**Future:** Whitelabel/agency tier via subdomain routing and admin theming layer

---

## Problem Statement

Email marketers using Klaviyo regularly need to upload contact lists from external sources. Before uploading, they must manually remove suppressed contacts and invalid email addresses to avoid deliverability issues, compliance violations, and wasted sends. This process is tedious, error-prone, and typically requires either technical help or cobbled-together spreadsheet formulas.

**Target user:** Non-technical email marketers and account managers at agencies or brands using Klaviyo.

---

## Core User Flow

Three distinct states, progressing horizontally:

### State 1 — Default (Upload)
- Left panel: "How to use" instructional content, persistent
- Right panel (elevated surface): Upload inputs + options
- User uploads both files and configures options before processing

### State 2 — Loading
- Input panel shifts left, remains visible but inactive
- Results panel introduced on the right
- Processing summary animates in (rows read, processing status)
- Inputs visible for reference but not editable

### State 3 — Results (Positive)
- Inputs displayed in disabled/locked state (confirms what was processed)
- Results panel shows full processing summary with counts
- Download button delivers ZIP file
- Reset button at page level triggers confirmation modal before clearing state

### State 3 — Results (Fail)
- Inputs displayed in disabled/locked state
- Error state surfaced in results panel with clear messaging
- "Try Again" action returns user to State 1 with inputs cleared
- Error messaging should be plain-language and non-technical — the user is not a developer

---

## File Handling

### Supported Formats
- CSV
- XLSX (first sheet used by default — see XLSX Handling below)

### Contact List (the list to be cleaned)
- Auto-detect which column contains email addresses
- If email column cannot be detected, surface an inline error on the upload field with a prompt to verify the file contains an email column — do not proceed to processing
- Preserve all other columns intact — segmentation data must not be lost
- Rows are removed, never columns
- Output: cleaned version of the original file with same column structure

### Suppression List (the reference list)
- Only the email column is used for matching logic
- All other columns ignored
- No output generated from this file

### XLSX Handling
- Default to first sheet silently
- If multiple sheets are detected, display a passive informational note in the upload field ready state: "First sheet will be used. Multiple sheets detected."
- If sheet is empty or contains only a header row with no data, surface an inline error prompting the user to verify the file contents
- Sheet selector is a V2 feature — passive note is the MVP resolution
- Output is always CSV regardless of input format

### Matching Logic
- Case-insensitive email matching
- Exact match only (MVP) — no fuzzy matching
- Remove any row from Contact List where email exists in Suppression List
- Remove any row where email address fails basic validation (configurable — see Options)

---

## Edge Cases

### Identical File Upload
If the same file is uploaded to both the Contact List and Suppression List inputs, the result would be a completely empty output with no obvious explanation — this reads as a bug to the user. Detect this condition before processing and surface an inline warning on the Suppression List field: "This looks like the same file as your Contact List. Please upload your Klaviyo suppression list here."

### Large Files / UI Blocking
Client-side processing of large files (50k+ rows) will block the main thread if handled synchronously, causing the UI to appear frozen even if the loading animation is present. Use Web Workers to handle file processing off the main thread, keeping the loading state UI responsive throughout. This is V1 scope given the target user is uploading real marketing lists of unpredictable size.

### Undetectable Email Column
If the email column cannot be auto-detected in the Contact List, surface an inline error at the upload field level rather than proceeding to a failed processing state. Prompt the user to verify their file contains an email column. Do not silently fail or produce an empty output.

### Empty or Header-Only Sheets
If an uploaded file (CSV or XLSX) contains no data rows — only a header row or is completely empty — surface an inline error at the upload field level before processing begins.

---

## Options (Upload State)

### Generate Audit Report *(default: ON)*
Produces a separate CSV included in the ZIP download documenting every removed row and the reason for removal (suppressed or invalid). Enables future auditability and client reporting.

*Rationale: Default on because non-technical users benefit from the audit trail without knowing to ask for it. Users who don't need it know enough to turn it off.*

### Remove Invalid Emails *(default: ON)*
Validates email format and removes malformed addresses from the Contact List.

*Rationale: Klaviyo will catch these anyway — removing them upstream is cleaner. Edge case: user may want Klaviyo to handle validation. Option to disable accommodates this without making it the default.*

---

## Output

Single ZIP file download containing:

1. **cleaned-list.csv** — Contact List with suppressed and invalid emails removed, all original columns preserved
2. **rinse-report.csv** *(if audit report enabled)* — Log of every removed row including: original email, removal reason (suppressed / invalid format), row number from source file

*ZIP approach keeps the download atomic — user gets everything in one action.*

---

## Upload Interaction

Both upload fields (Contact List and Suppression List) support:
- **Drag and drop** onto the drop zone
- **Click to browse** via a button centered within the drop zone
- Visual feedback on hover/drag (border highlight, label change)
- File name confirmation displayed after successful upload
- Ability to replace an uploaded file before processing begins
- Inline error state on the upload field for validation failures — surfaces at the field level, not at processing time

---

## How It Works Experience

Triggered by "How It Works" link/button in the default state. Opens as a slide-over panel that overlays the tool with a blurred background, keeping the user anchored in context rather than navigating away.

### Structure
- **Carousel (top):** 1-2-3 stepped walkthrough with a brief description and illustrative image per step. Steps map to the three core UI states so the user understands what they're about to experience. Friendly, non-technical copy — assumes no prior knowledge.
- **File Support (below carousel):** Documents supported file formats and any relevant notes (e.g., XLSX first-sheet behavior)
- **FAQs (below file support):** Addresses common points of confusion. At minimum: how to download a suppression list from Klaviyo (with a link to Klaviyo documentation), what happens to uploaded files, and what the audit report contains.

### Behavior
- Close via X button or click-outside-to-dismiss
- Blurred background reinforces the overlay pattern established by the reset modal
- No navigation away from the tool — slide-over is a layer, not a page

---

## Reset Behavior

Reset button lives at page level, visible in State 3 only.

On click: modal confirmation dialog (not browser native `confirm()`).

**Headline:** "Grab your files before you go!"

**Body:** Your cleaned list and report will be permanently removed if you haven't downloaded them yet. Files are processed locally and never stored.

**Actions:**
- **Download Results** — triggers ZIP download, dismisses modal, remains in State 3
- **Continue Without Saving** — clears all state, returns to State 1

*Rationale: The "Download Results" action in the modal reduces accidental data loss by offering the download as the primary escape hatch. The copy does double duty — protects against accidental loss AND communicates the privacy-first architecture without a dedicated feature announcement. "Grab your files before you go" framing is friendly and non-alarming while still creating appropriate urgency.*

---

## Browser Safety Net

`beforeunload` event warning if user attempts to navigate away or close tab while in State 3 with undownloaded results.

*Consistent with reset confirmation logic. Reinforces client-side privacy story.*

---

## Design Direction

- Utility-focused, neutral aesthetic
- Theming via CSS custom properties from day one — no hardcoded color values
- Restrained enough to serve as a whitelabel starting point
- Design craft owned entirely by Drew VanderVeen — AI-assisted development, not AI-generated design
- Tailwind theme config synced with design token decisions
- Component states fully designed: default, ready, error, disabled, loading, results-positive, results-fail, reset modal, how it works slide-over

---

## Architecture Notes

- **Client-side only (V1)** — all file processing in the browser via JavaScript
- Web Workers used for file processing to keep the main thread and UI responsive during heavy operations
- No backend, no database, no file storage
- No customer data ever leaves the client
- Next.js App Router for future scalability (admin layer, subdomain routing, agency tier)
- Deployed on Vercel

### V2 Server Architecture Path
V2 may introduce a serverless function to handle processing of larger files where client-side performance is insufficient. Any server implementation must adhere to the following constraints to preserve the product's privacy guarantee:

- Files processed in memory only — no writes to disk or database
- No logging of file contents
- Execution context is stateless and destroyed after response is returned
- The user-facing privacy statement shifts from "never leaves your browser" to "never stored" — copy and trust communication must be updated accordingly when this change is made

*The privacy guarantee is architectural, not incidental. Any V2 implementation must treat these constraints as non-negotiable design requirements, not implementation details.*

---

## Out of Scope for MVP

- XLSX sheet selector (defaults to first sheet in MVP)
- Agency admin / whitelabel theming UI
- Subdomain routing for whitelabel instances
- Authentication / accounts
- Payment / subscription infrastructure
- Klaviyo API integration (direct upload)
- Fuzzy email matching
- Multiple suppression list uploads
- Processing progress percentage (loading state animation is sufficient for MVP)

---

## Future Considerations (V2+)

- **Serverless processing:** Ephemeral server function for large file handling — see V2 Server Architecture Path above for required constraints
- **Agency tier:** Simple admin allowing logo, brand colors, subdomain pointing. Enables `clean.agencyname.com` as a client-facing branded tool
- **Whitelabel config layer:** Per-instance theming without code changes
- **XLSX sheet selector:** Surface sheet picker when multiple sheets detected rather than defaulting to first
- **Klaviyo API integration:** Direct upload to Klaviyo after cleaning, eliminating the manual download/upload step
- **Fuzzy email matching:** Catch near-duplicate addresses not caught by exact matching
- **Donation / monetization:** Buy Me a Coffee or similar for public instance; potential paid agency tier

---

## Success Criteria for MVP

- Accepts CSV and XLSX upload for both Contact List and Suppression List
- Correctly removes suppressed rows without removing columns or corrupting data
- Correctly identifies and removes (or flags) invalid email formats
- Handles edge cases gracefully with inline errors at the field level — no silent failures
- Generates accurate audit report documenting removals
- Delivers clean ZIP download
- UI remains responsive during processing (Web Workers)
- Works entirely client-side with no data transmission
- Deployed publicly at rinselist.com
- Case study documented for portfolio

---

*This spec is intentionally scoped to ship. Complexity lives in V2.*