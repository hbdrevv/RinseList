# RinseList — MVP Product Spec
*Version 1.0 | February 2026*

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

### State 3 — Results
- Inputs displayed in disabled/locked state (confirms what was processed)
- Results panel shows full processing summary
- Download button delivers ZIP file
- Reset button at page level triggers confirmation warning before clearing state

---

## File Handling

### Supported Formats
- CSV
- XLSX (first sheet used by default — see XLSX Handling below)

### Contact List (the list to be cleaned)
- Auto-detect which column contains email addresses
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
- Sheet selector is a V2 feature — passive note is the MVP resolution
- Output is always CSV regardless of input format

### Matching Logic
- Case-insensitive email matching
- Exact match only (MVP) — no fuzzy matching
- Remove any row from Contact List where email exists in Suppression List
- Remove any row where email address fails basic validation (configurable — see Options)

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

---

## Reset Behavior

Reset button lives at page level, visible in State 3 only.

On click: modal confirmation dialog (not browser native `confirm()`) with message:

> "Your cleaned list and report will be permanently removed if you haven't downloaded them yet. Files are processed locally and never stored. Ready to start over?"

**Confirm:** Clears all state, returns to State 1  
**Cancel:** Dismisses modal, returns to State 3

*Rationale: The confirmation copy does double duty — protects against accidental data loss AND communicates the privacy-first architecture without a dedicated feature announcement.*

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

---

## Architecture Notes

- **Client-side only** — all CSV processing in the browser via JavaScript
- No backend, no database, no file storage
- No customer data ever leaves the client
- Next.js App Router for future scalability (admin layer, subdomain routing, agency tier)
- Deployed on Vercel

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

---

## Future Considerations (V2+)

- **Agency tier:** Simple admin allowing logo, brand colors, subdomain pointing. Enables `clean.agencyname.com` as a client-facing branded tool.
- **Whitelabel config layer:** Per-instance theming without code changes
- **XLSX sheet selector:** Surface sheet picker when multiple sheets detected rather than defaulting to first
- **Donation / monetization:** Buy Me a Coffee or similar for public instance; potential paid agency tier

---

## Success Criteria for MVP

- Accepts CSV upload for both Contact List and Suppression List
- Correctly removes suppressed rows without removing columns or corrupting data
- Correctly identifies and removes (or flags) invalid email formats
- Generates accurate audit report documenting removals
- Delivers clean ZIP download
- Works entirely client-side with no data transmission
- Deployed publicly at rinselist.com
- Case study documented for portfolio

---

*This spec is intentionally scoped to ship. Complexity lives in V2.*
