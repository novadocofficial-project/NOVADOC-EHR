---
name: PDF print CSS architecture
description: Two CSS constants in printHealthRecord.ts must stay in sync — one for html2canvas PDF rendering, one for the HTML tab view.
---

There are two separate CSS constants in `artifacts/ehr-dashboard/src/lib/printHealthRecord.ts`:

- `PDF_CONTENT_CSS` — injected into the html2canvas render target (no @page, no position:fixed). Used for PDF output.
- `CSS` — injected into the full HTML document for the browser tab view. Contains @page, body, .page-header/.hdr-logo/.hdr-meta, .page-footer (with position:fixed for screen), and @media screen. Content styles are shared.

**Why:** html2canvas cannot handle position:fixed or @page rules, so PDF rendering uses a stripped-down CSS constant. Both must define the same content classes or the two views look different.

**How to apply:** When adding new CSS classes for PDF content (sections, tables, labels), add them to BOTH constants. Keep @page/@media screen only in `CSS`.
