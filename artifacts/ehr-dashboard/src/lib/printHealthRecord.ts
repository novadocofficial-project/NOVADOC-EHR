import type { jsPDF as JSPDF } from "jspdf";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";
import type { SoapDummyNote } from "@/data/soapDummy";
import type { SpecialtyForm, FormSection } from "@/pages/SpecialtyFormsModule";
import { ROS_SYSTEMS, BODY_SYSTEMS } from "@/pages/RosPeSection";

// ─── Public API ───────────────────────────────────────────────────────────────

export type PrintNoteKind =
  | { kind: "dummy";  note: SoapDummyNote }
  | { kind: "live";   noteState: NoteState; form?: SpecialtyForm }
  | { kind: "empty" };

export interface PrintHealthRecordParams {
  patient:   { name: string; mrn?: string };
  noteRow:   { date: string; time: string; type: string; doctor: string };
  visitType: string;
  noteKind:  PrintNoteKind;
}

export async function printHealthRecord(p: PrintHealthRecordParams): Promise<void> {
  // ── Open blank tab synchronously (must be in the user-gesture stack) ─────
  const tab = window.open("", "_blank");

  // Show a loading placeholder so the user sees the tab immediately
  if (tab) {
    tab.document.write(`<!DOCTYPE html><html><head><title>Generating PDF…</title>
<style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
font-family:-apple-system,sans-serif;color:#64748b;font-size:15px;background:#f8fafc;}
.dot{width:8px;height:8px;border-radius:50%;background:#4982CF;display:inline-block;margin:0 4px;
animation:bounce 1.2s infinite ease-in-out both;}
.dot:nth-child(2){animation-delay:.16s}.dot:nth-child(3){animation-delay:.32s}
@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}</style></head>
<body><div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
&nbsp;&nbsp;Generating PDF…</body></html>`);
    tab.document.close();
  }

  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasModule.default;

  const { patient, noteRow, visitType, noteKind } = p;

  const patientInfoHtml = buildPatientInfo(patient, noteRow, visitType);

  let vitalsHtml = "";
  let clinicalHtml = "";
  if (noteKind.kind === "dummy") {
    vitalsHtml   = buildDummyVitals(noteKind.note);
    clinicalHtml = buildDummyClinical(noteKind.note);
  } else if (noteKind.kind === "live") {
    vitalsHtml = buildLiveVitals(noteKind.noteState);
    if (noteKind.form && noteKind.noteState.specialtyFormId) {
      clinicalHtml = buildSpecialtyFormClinical(noteKind.form, noteKind.noteState);
    } else {
      clinicalHtml = buildLiveClinical(noteKind.noteState);
    }
  } else {
    clinicalHtml = `<p style="color:#94a3b8;font-size:9pt;font-style:italic;">Note content not available for this record.</p>`;
  }
  // A4 layout constants (mm)
  const A4_W = 210;
  const A4_H = 297;
  const ML = 16, MT = 22, MB = 20;
  const contentW = 178; // A4_W - ML - MR (MR = 16)

  // Container width = content width at 96 DPI: 178mm × 96 / 25.4 ≈ 673px
  // Using 674px so the number is even; html2canvas renders at scale:2 → 1348px canvas width
  const CONTAINER_PX = 674;
  const H2C_SCALE    = 2;

  // ── Inject content-only container for html2canvas (no page margins) ──────
  const container = document.createElement("div");
  container.style.cssText = `position:absolute;left:-9999px;top:0;width:${CONTAINER_PX}px;background:#fff;margin:0;padding:0;overflow:visible`;
  container.innerHTML = `<style>${PDF_CONTENT_CSS}</style><div class="pdf-content">${patientInfoHtml}${vitalsHtml}<hr class="divider"/>${clinicalHtml}</div>`;
  document.body.appendChild(container);

  try {
    const contentEl = container.querySelector(".pdf-content") as HTMLElement;

    // Render the full content to a single tall canvas
    const canvas = await html2canvas(contentEl, {
      scale:       H2C_SCALE,
      useCORS:     true,
      logging:     false,
      width:       CONTAINER_PX,
      windowWidth: CONTAINER_PX,
    });

    const canvasW = canvas.width;  // CONTAINER_PX * H2C_SCALE = 1348
    const canvasH = canvas.height; // full content height in canvas px

    // px-per-mm derived from canvas width and content width in mm
    const pxPerMm = canvasW / contentW;

    // Available content height per A4 page (header + footer reserves deducted)
    const pageContentHeightMm = A4_H - MT - MB; // 255mm
    const pageContentHeightPx = Math.round(pageContentHeightMm * pxPerMm);

    // ── Smart page boundaries — avoid slicing through protected blocks ────────
    // Only protect elements whose content would be visually damaged if split:
    //   .med-table      — table rows that should not be cut mid-row
    // Section headings (.sec) are intentionally excluded: they are short,
    // single-line, and protecting them caused a cascade of one-element pages.
    //
    // Correct condition: only move a page boundary when it falls *inside* an
    // element (elementTop < boundary < elementBottom).  The previous version
    // moved the boundary whenever the element merely *started* within the slice,
    // which caused every heading to become its own page.
    const protectedSelectors = [".med-table"];
    const contentRect = contentEl.getBoundingClientRect();
    type ProtectedZone = { top: number; bottom: number };
    const protectedZones: ProtectedZone[] = protectedSelectors
      .flatMap(sel => Array.from(container.querySelectorAll(sel)))
      .map(el => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return {
          top:    Math.round((r.top    - contentRect.top) * H2C_SCALE),
          bottom: Math.round((r.bottom - contentRect.top) * H2C_SCALE),
        };
      })
      .filter(z => z.top >= 0 && z.bottom > z.top);

    const pageStarts: number[] = [0];
    {
      let cursor = 0;
      while (cursor + pageContentHeightPx < canvasH) {
        let next = cursor + pageContentHeightPx;
        // Move boundary to before the element only when the naive cut would
        // land *inside* it (top < boundary < bottom).
        for (const z of protectedZones) {
          if (z.top < next && z.bottom > next && z.top > cursor) {
            next = z.top;
            break;
          }
        }
        pageStarts.push(next);
        cursor = next;
      }
    }
    const totalPages = pageStarts.length;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Preload logo for every page header
    const logoInfo = await loadLogoDataUrl();

    for (let pg = 0; pg < totalPages; pg++) {
      if (pg > 0) pdf.addPage();

      // Draw header and footer first (below the image layer)
      pdfAddHeader(pdf, p, A4_W, pg + 1, totalPages, logoInfo);
      pdfAddFooter(pdf, A4_W, A4_H);

      // Slice the canvas for this page
      const srcY = pageStarts[pg];
      const nextY = pg + 1 < totalPages ? pageStarts[pg + 1] : canvasH;
      const srcH  = Math.min(nextY - srcY, pageContentHeightPx);

      // Skip degenerate slices (can happen if measurements are off)
      if (srcH <= 0) continue;

      const slice = document.createElement("canvas");
      slice.width  = canvasW;
      slice.height = srcH;
      const ctx = slice.getContext("2d")!;
      ctx.drawImage(canvas, 0, srcY, canvasW, srcH, 0, 0, canvasW, srcH);

      const sliceDataUrl  = slice.toDataURL("image/jpeg", 0.92);
      const sliceHeightMm = srcH / pxPerMm;

      // Place image in the content zone (below header, above footer)
      pdf.addImage(sliceDataUrl, "JPEG", ML, MT, contentW, sliceHeightMm, undefined, "FAST");
    }

    const blobUrl = URL.createObjectURL(pdf.output("blob"));
    if (tab && !tab.closed) {
      tab.location.href = blobUrl;
    } else {
      window.open(blobUrl, "_blank");
    }
  } catch (err) {
    if (tab && !tab.closed) {
      tab.document.write(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;color:#ef4444">
        <h2>PDF generation failed</h2><p>Please try again.</p></body></html>`);
      tab.document.close();
    }
    throw err;
  } finally {
    document.body.removeChild(container);
  }
}

// ─── Logo preloader ───────────────────────────────────────────────────────────

async function loadLogoDataUrl(): Promise<{ dataUrl: string; aspect: number } | null> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload  = () => resolve();
      img.onerror = () => reject();
      img.src = "/novadoc-logo.png";
    });
    const c = document.createElement("canvas");
    c.width  = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    return { dataUrl: c.toDataURL("image/png"), aspect: img.naturalWidth / img.naturalHeight };
  } catch {
    return null;
  }
}

// ─── jsPDF per-page header ────────────────────────────────────────────────────

function pdfAddHeader(
  doc: JSPDF,
  p: PrintHealthRecordParams,
  pageW: number,
  page: number,
  total: number,
  logo: { dataUrl: string; aspect: number } | null,
): void {
  // Blue separator line
  doc.setDrawColor(73, 130, 207);
  doc.setLineWidth(0.4);
  doc.line(0, 19, pageW, 19);

  // Logo image (or text fallback if image failed to load)
  if (logo) {
    const logoH = 9;
    const logoW = logo.aspect * logoH;
    doc.addImage(logo.dataUrl, "PNG", 14, 5, logoW, logoH);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(73, 130, 207);
    doc.text("Nova", 16, 13);
    const novaW = doc.getTextWidth("Nova");
    doc.setTextColor(30, 41, 59);
    doc.text("Doc", 16 + novaW, 13);
  }

  // Right: date · MR · page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const rX = pageW - 16;
  doc.text(`${p.noteRow.date} · ${p.noteRow.time}`, rX, 8, { align: "right" });
  if (p.patient.mrn) doc.text(`MR: ${p.patient.mrn}`, rX, 12, { align: "right" });
  doc.text(`Page ${page} / ${total}`, rX, 16, { align: "right" });
}

// ─── jsPDF per-page footer ────────────────────────────────────────────────────

function pdfAddFooter(doc: JSPDF, pageW: number, pageH: number): void {
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, pageH - 18, pageW, pageH - 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text("Confidential Medical Record \u2014 For Authorised Use Only", 16, pageH - 12);
  doc.text("System-generated \u00b7 novadoc.health", pageW - 16, pageH - 12, { align: "right" });
}

// ─── PDF content CSS (no @page, no position:fixed — for html2canvas) ─────────

const PDF_CONTENT_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.pdf-content {
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  font-size: 10pt;
  color: #000;
  background: #fff;
  line-height: 1.5;
}
.pt-header { margin-bottom: 10pt; border-bottom: 1.5pt solid #000; padding-bottom: 6pt; }
.pt-name { font-size: 13pt; font-weight: 700; margin-bottom: 3pt; }
.pt-row { display: flex; font-size: 9.5pt; margin-bottom: 2pt; }
.pt-cell { flex: 1; }
.pt-label { font-weight: 700; }
.vitals-section { margin-bottom: 10pt; }
.vitals-heading { font-size: 10pt; font-weight: 700; margin-bottom: 4pt; }
.vitals-items { display: flex; flex-wrap: wrap; gap: 2pt 20pt; font-size: 9pt; }
.sec { margin-bottom: 10pt; }
.sec-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; margin-bottom: 2pt; }
.sec-body { font-size: 9.5pt; color: #000; }
.sys-heading { font-size: 9pt; font-weight: 700; text-transform: uppercase; margin: 4pt 0 1pt; }
.blist { padding-left: 14pt; margin: 0; }
.blist li { margin-bottom: 1pt; font-size: 9pt; }
.med-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 2pt; }
.med-table th { text-align: left; border: 1pt solid #000; padding: 3pt 5pt; font-weight: 700; }
.med-table td { border: 1pt solid #000; padding: 3pt 5pt; vertical-align: top; }
.voided-row td { color: #888; text-decoration: line-through; }
.divider { border: none; border-top: 1pt solid #ccc; margin: 8pt 0; }
.narrative { border: 1pt solid #ccc; padding: 5pt 8pt; font-size: 9pt; line-height: 1.5; white-space: pre-wrap; }
`;

// ─── HTML escape ──────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Shared section renderer ──────────────────────────────────────────────────

function section(title: string, bodyHtml: string): string {
  return `
  <div class="sec">
    <div class="sec-title">${esc(title)}</div>
    <div class="sec-body">${bodyHtml}</div>
  </div>`;
}

function chips(items: string[]): string {
  if (!items.length) return "";
  return `<span style="font-size:9.5pt">${items.map(s => esc(s)).join(", ")}</span>`;
}

function bulletList(items: string[]): string {
  return `<ul class="blist">${items.map(s => `<li>${esc(s)}</li>`).join("")}</ul>`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@page {
  size: A4 portrait;
  margin: 22mm 16mm 22mm 16mm;
}

body {
  font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
  font-size: 10.5pt;
  color: #1e293b;
  background: #fff;
  line-height: 1.5;
}

/* ── Fixed header (repeats on every printed page) ── */
.page-header {
  position: fixed;
  top: -20mm;
  left: -16mm;
  right: -16mm;
  height: 18mm;
  background: #fff;
  border-bottom: 2px solid #4982CF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12mm;
}
.hdr-meta {
  text-align: right;
  font-size: 7.5pt;
  color: #64748b;
  line-height: 1.6;
}
.hdr-meta strong { color: #1e293b; font-weight: 700; }

/* ── Fixed footer ── */
.page-footer {
  position: fixed;
  bottom: -20mm;
  left: -16mm;
  right: -16mm;
  height: 12mm;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12mm;
  font-size: 7pt;
  color: #94a3b8;
}

/* ── Patient header ── */
.pt-header { margin-bottom: 10pt; border-bottom: 1.5pt solid #000; padding-bottom: 6pt; }
.pt-name { font-size: 13pt; font-weight: 700; margin-bottom: 3pt; }
.pt-row { display: flex; font-size: 9.5pt; margin-bottom: 2pt; }
.pt-cell { flex: 1; }
.pt-label { font-weight: 700; }

/* ── Vitals ── */
.vitals-section { margin-bottom: 10pt; }
.vitals-heading { font-size: 10pt; font-weight: 700; margin-bottom: 4pt; }
.vitals-items { display: flex; flex-wrap: wrap; gap: 2pt 20pt; font-size: 9pt; }

/* ── Sections ── */
.sec {
  margin-bottom: 10pt;
  page-break-inside: avoid;
}
.sec-title {
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 2pt;
}
.sec-body {
  font-size: 9.5pt;
  color: #000;
}

/* ── Sub-system headings (ROS, PE) ── */
.sys-heading { font-size: 9pt; font-weight: 700; text-transform: uppercase; margin: 4pt 0 1pt; }

/* ── Bullet list ── */
.blist { padding-left: 14pt; margin: 0; }
.blist li { margin-bottom: 1pt; font-size: 9pt; }

/* ── Medication / orders table ── */
.med-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 2pt; }
.med-table th { text-align: left; border: 1pt solid #000; padding: 3pt 5pt; font-weight: 700; }
.med-table td { border: 1pt solid #000; padding: 3pt 5pt; vertical-align: top; }
.voided-row td { color: #888; text-decoration: line-through; }

/* ── Divider ── */
.divider { border: none; border-top: 1pt solid #ccc; margin: 8pt 0; }

/* ── Narrative text ── */
.narrative { border: 1pt solid #ccc; padding: 5pt 8pt; font-size: 9pt; line-height: 1.5; white-space: pre-wrap; }

/* screen only: add comfortable padding so fixed elements don't cover content */
@media screen {
  body { padding: 20mm 16mm; }
  .page-header { position: fixed; top: 0; left: 0; right: 0; height: 18mm; padding: 0 16mm; border-radius: 0; }
  .page-footer { position: fixed; bottom: 0; left: 0; right: 0; height: 12mm; padding: 0 16mm; }
}
`;

// ─── Main builder ─────────────────────────────────────────────────────────────

function buildHtml(p: PrintHealthRecordParams): string {
  const { patient, noteRow, visitType, noteKind } = p;
  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const headerHtml = `
  <div class="page-header">
    <img src="/novadoc-logo.png" alt="NovaDoc" style="height:28px;width:auto" />
    <div class="hdr-meta">
      <strong>Confidential Health Record</strong><br/>
      ${generatedAt} &nbsp;·&nbsp; MR: <strong>${esc(patient.mrn ?? "—")}</strong><br/>
      ${esc(visitType || noteRow.type)}
    </div>
  </div>`;

  const footerHtml = `
  <div class="page-footer">
    <span>Confidential Medical Record &mdash; For Authorised Use Only</span>
    <span>System-generated &nbsp;&middot;&nbsp; novadoc.health</span>
  </div>`;

  const patientInfoHtml = buildPatientInfo(patient, noteRow, visitType);

  let vitalsHtml = "";
  let clinicalHtml = "";

  if (noteKind.kind === "dummy") {
    vitalsHtml  = buildDummyVitals(noteKind.note);
    clinicalHtml = buildDummyClinical(noteKind.note);
  } else if (noteKind.kind === "live") {
    vitalsHtml   = buildLiveVitals(noteKind.noteState);
    if (noteKind.form && noteKind.noteState.specialtyFormId) {
      clinicalHtml = buildSpecialtyFormClinical(noteKind.form, noteKind.noteState);
    } else {
      clinicalHtml = buildLiveClinical(noteKind.noteState);
    }
  } else {
    clinicalHtml = `<p style="color:#94a3b8;font-size:9pt;font-style:italic;">Note content not available for this record.</p>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Health Record &mdash; ${esc(patient.name)}</title>
  <style>${CSS}</style>
</head>
<body>
  ${headerHtml}
  ${footerHtml}
  <div class="page-content">
    ${patientInfoHtml}
    ${vitalsHtml}
    <hr class="divider"/>
    ${clinicalHtml}
  </div>
</body>
</html>`;
}

// ─── Patient info ─────────────────────────────────────────────────────────────

function buildPatientInfo(
  patient: { name: string; mrn?: string },
  noteRow: { date: string; time: string; type: string; doctor: string },
  visitType: string,
): string {
  const vtParts = (visitType || "").split(" \u2014 ");
  const physician = vtParts[0].startsWith("Dr.") ? vtParts[0] : noteRow.doctor;
  const vType = vtParts[0].startsWith("Dr.") && vtParts.length > 1
    ? vtParts.slice(1).join(" \u2014 ")
    : (visitType || noteRow.type);
  const dateStr = noteRow.date + (noteRow.time ? " \u00b7 " + noteRow.time : "");
  return `
  <div class="pt-header">
    <div class="pt-name">${esc(patient.name)}</div>
    <div class="pt-row">
      <div class="pt-cell"><span class="pt-label">MR#:</span> ${esc(patient.mrn ?? "\u2014")}</div>
      <div class="pt-cell"><span class="pt-label">Date:</span> ${esc(dateStr)}</div>
    </div>
    <div class="pt-row">
      <div class="pt-cell"><span class="pt-label">Physician:</span> ${esc(physician)}</div>
      <div class="pt-cell"><span class="pt-label">Visit Type:</span> ${esc(vType)}</div>
    </div>
  </div>`;
}

// ─── Vitals — dummy ───────────────────────────────────────────────────────────

function buildDummyVitals(note: SoapDummyNote): string {
  const items: { label: string; value: string; unit: string }[] = [
    { label: "BP",     value: note.vitals.bp,     unit: "mmHg" },
    { label: "Pulse",  value: note.vitals.pulse,  unit: "bpm"  },
    { label: "Temp",   value: note.vitals.temp,   unit: "\u00b0C"   },
    { label: "SpO\u2082",  value: note.vitals.spo2,   unit: "%"    },
    { label: "Weight", value: note.vitals.weight, unit: ""     },
  ].filter(v => v.value);
  if (!items.length) return "";
  return `
  <div class="vitals-section">
    <div class="vitals-heading">Vitals</div>
    <div class="vitals-items">
      ${items.map(v => `<span>${esc(v.label)}: ${esc(v.value)}${v.unit ? " " + esc(v.unit) : ""}</span>`).join("")}
    </div>
  </div>`;
}

// ─── Vitals — live (NoteState.vitals: VitalEntry[]) ──────────────────────────

function buildLiveVitals(note: NoteState): string {
  const v = (note.vitals ?? [])[0];
  if (!v) return "";
  const bp = (v.bpSystolic && v.bpDiastolic) ? `${v.bpSystolic}/${v.bpDiastolic}` : null;
  const items: { label: string; value: string; unit: string }[] = [
    { label: "BP",    value: bp ?? "",                  unit: "mmHg" },
    { label: "Pulse", value: v.pulse   != null ? String(v.pulse)  : "", unit: "bpm" },
    { label: "SpO\u2082", value: v.spo2    != null ? String(v.spo2)   : "", unit: "%"   },
    { label: "Temp",  value: v.temp    != null ? String(v.temp)   : "", unit: "\u00b0C"  },
  ].filter(item => item.value);
  if (!items.length) return "";
  return `
  <div class="vitals-section">
    <div class="vitals-heading">Vitals</div>
    <div class="vitals-items">
      ${items.map(item => `<span>${esc(item.label)}: ${esc(item.value)}${item.unit ? " " + esc(item.unit) : ""}</span>`).join("")}
    </div>
  </div>`;
}

// ─── Clinical — dummy ─────────────────────────────────────────────────────────

function buildDummyClinical(note: SoapDummyNote): string {
  const parts: string[] = [];

  if (note.cc.length)
    parts.push(section("Chief Complaint", chips(note.cc)));

  if (note.hpi?.trim())
    parts.push(section("History of Present Illness", `<div class="narrative">${esc(note.hpi)}</div>`));

  if (note.allergies.length)
    parts.push(section("Allergies", note.allergies.map(a =>
      `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(a.name)}</strong>${a.reaction ? " \u2014 " + esc(a.reaction) : ""} (${esc(a.severity)})</div>`
    ).join("")));

  if (note.medicalHistory.length)
    parts.push(section("Medical History", bulletList(note.medicalHistory)));

  if (note.surgicalHistory.length)
    parts.push(section("Surgical History", bulletList(note.surgicalHistory)));

  if (note.familyHistory.length)
    parts.push(section("Family History", bulletList(note.familyHistory)));

  if (note.socialHistory.length)
    parts.push(section("Social History", chips(note.socialHistory)));

  if (note.ros.length)
    parts.push(section("Review of Systems", bulletList(note.ros)));

  if (note.pe.length)
    parts.push(section("Physical Examination", bulletList(note.pe)));

  if (note.pocLabs.length)
    parts.push(section("Point of Care Labs", note.pocLabs.map(l =>
      `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(l.test)}</strong>: ${esc(l.result)}${l.unit ? " " + esc(l.unit) : ""} (${esc(l.status)})</div>`
    ).join("")));

  if (note.diagnoses.length)
    parts.push(section("Assessment &amp; Diagnosis", note.diagnoses.map(d =>
      `<div style="margin-bottom:2pt;font-size:9.5pt">${esc(d.code)} \u2014 ${esc(d.name)}${d.severity ? " (" + esc(d.severity) + ")" : ""}</div>`
    ).join("")));

  const allLabs = [...(note.labOrders ?? []).flatMap(o => o.tests.map(t => t.name)), ...note.labs];
  if (allLabs.length)
    parts.push(section("Lab Orders", chips(allLabs)));

  if (note.prescriptions.length)
    parts.push(section("Prescriptions", `
      <table class="med-table">
        <thead><tr><th>Sr.</th><th>Drug</th><th>Instructions</th><th>Qty</th></tr></thead>
        <tbody>
          ${note.prescriptions.map((rx, i) => `<tr>
            <td>${i + 1}</td>
            <td style="font-weight:700">${esc(rx.drug)}</td>
            <td>${esc(rx.sig)}</td>
            <td>${esc(String(rx.qty))}</td>
          </tr>`).join("")}
        </tbody>
      </table>`));

  if (note.imaging.length)
    parts.push(section("Imaging Orders", chips(note.imaging)));

  if (note.procedureOrders.length)
    parts.push(section("Procedure Orders", bulletList(note.procedureOrders)));

  if (note.carePlan.length)
    parts.push(section("Care Plan", bulletList(note.carePlan)));

  if (note.referrals.length)
    parts.push(section("Referrals", note.referrals.map(r =>
      `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(r.specialty)}</strong> \u2014 ${esc(r.reason)}</div>`
    ).join("")));

  if (note.patientGoals.length)
    parts.push(section("Patient Goals", bulletList(note.patientGoals)));

  if (note.otherOrders.length)
    parts.push(section("Other Orders", bulletList(note.otherOrders)));

  if (note.visitDescription?.trim())
    parts.push(section("Visit Summary", `<div class="narrative">${esc(note.visitDescription)}</div>`));

  if (note.followUp)
    parts.push(section("Follow-up", `<span style="font-size:9.5pt">${esc(note.followUp)}</span>`));

  return parts.join("\n");
}

// ─── Shared order-block renderers ────────────────────────────────────────────

type LabOrderLike = {
  voided?: boolean;
  sentAt?: string;
  returnedFromLab?: boolean;
  tests: { id: string; name: string }[];
};

function buildLabOrdersTable(orders: LabOrderLike[]): string {
  const nonVoided = orders.filter(o => !o.voided);
  if (!nonVoided.length) return "";
  const rows = nonVoided.flatMap(order => {
    const sentStr = order.sentAt
      ? new Date(order.sentAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      : "—";
    const status = order.returnedFromLab ? "Results Ready" : order.sentAt ? "Sent to Lab" : "Pending";
    const statusColor = order.returnedFromLab ? "#166534" : order.sentAt ? "#b45309" : "#64748b";
    return order.tests.map(t => `<tr>
      <td style="font-weight:600">${esc(t.name)}</td>
      <td style="color:#475569">${esc(sentStr)}</td>
      <td><span style="font-size:7.5pt;font-weight:700;color:${statusColor}">${esc(status)}</span></td>
    </tr>`);
  });
  return `
  <table class="med-table">
    <thead><tr><th>Test</th><th>Sent</th><th>Status</th></tr></thead>
    <tbody>${rows.join("")}</tbody>
  </table>`;
}

type MedEntry = {
  brand: string;
  genericName?: string;
  dose?: string;
  unit?: string;
  frequency?: string;
  duration?: string;
  route?: string;
};

function buildMedsTable(meds: MedEntry[]): string {
  if (!meds.length) return "";
  return `
  <table class="med-table">
    <thead><tr><th>Sr.</th><th>Drug</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Route</th></tr></thead>
    <tbody>
      ${meds.map((m, i) => `<tr>
        <td>${i + 1}</td>
        <td style="font-weight:700">${esc(m.brand)}${m.genericName ? `<br/><span style="font-size:8pt;font-weight:400">${esc(m.genericName)}</span>` : ""}</td>
        <td>${m.dose ? esc(m.dose) + (m.unit ? " " + esc(m.unit) : "") : "\u2014"}</td>
        <td>${esc(m.frequency ?? "\u2014")}</td>
        <td>${esc(m.duration ?? "\u2014")}</td>
        <td>${esc(m.route ?? "\u2014")}</td>
      </tr>`).join("")}
    </tbody>
  </table>`;
}

// ─── Clinical — live NoteState (standard SOAP) ────────────────────────────────

function buildLiveClinical(note: NoteState): string {
  const parts: string[] = [];

  if (note.chiefComplaints.length)
    parts.push(section("Chief Complaint", chips(note.chiefComplaints)));

  const hpiText = note.hpi?.trim();
  const hpiDone = note.hpiDoneComplaints ?? [];
  if (hpiText || hpiDone.length) {
    const body = hpiText
      ? `<div class="narrative">${esc(hpiText)}</div>`
      : chips(hpiDone);
    parts.push(section("History of Present Illness", body));
  }

  if (note.allergies.length)
    parts.push(section("Allergies", note.allergies.map(a =>
      `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(a.name)}</strong>${a.reaction ? " \u2014 " + esc(a.reaction) : ""} (${esc(a.severity)})</div>`
    ).join("")));

  const hasPmh      = note.pmhActive.length > 0 || note.pmhResolved.length > 0;
  const hasSurgical = note.surgicalRows.length > 0;
  const hasFH       = note.fhRows.length > 0;
  const sh          = note.socialHistory;
  const hasSocial   = sh.tobacco.active || sh.alcohol.active || sh.vaping?.active || !!sh.activity || !!sh.sleep;

  if (hasPmh || hasSurgical || hasFH || hasSocial) {
    let body = "";
    if (hasPmh) {
      body += `<div class="sys-heading">Past Medical History</div>`;
      const pmhItems = [
        ...note.pmhActive.map(h => esc(h)),
        ...note.pmhResolved.map(h => `<span style="text-decoration:line-through">${esc(h)}</span>`),
      ];
      body += `<div style="font-size:9.5pt;margin-bottom:2pt">${pmhItems.join(", ")}</div>`;
    }
    if (hasSurgical) {
      body += `<div class="sys-heading">Surgical History</div>`;
      body += bulletList(note.surgicalRows.map(s => s.procedure + (s.date ? ` \u00b7 ${s.date}` : "")));
    }
    if (hasFH) {
      body += `<div class="sys-heading">Family History</div>`;
      body += bulletList(note.fhRows.map(f => `${f.relation}: ${f.condition}`));
    }
    if (hasSocial) {
      body += `<div class="sys-heading">Social History</div>`;
      const si: string[] = [];
      if (sh.tobacco.active) si.push("Smoking" + (sh.tobacco.intake ? ": " + esc(sh.tobacco.intake) : ""));
      if (sh.alcohol.active) si.push("Alcohol" + (sh.alcohol.units ? ": " + esc(sh.alcohol.units) : ""));
      if (sh.vaping?.active) si.push("Vaping");
      if (sh.activity)       si.push("Activity: " + esc(sh.activity));
      if (sh.sleep)          si.push("Sleep: " + esc(sh.sleep));
      body += `<div style="font-size:9.5pt">${si.join(", ")}</div>`;
    }
    parts.push(section("Medical, Surgical, Family &amp; Social History", body));
  }

  const rosEntries = ROS_SYSTEMS.filter(s => (note.ros[s.id] ?? []).length > 0);
  if (rosEntries.length) {
    const body = rosEntries.map(sys => {
      const symptoms = (note.ros[sys.id] ?? []);
      return `<div style="margin-bottom:4pt">
        <div class="sys-heading">${esc(sys.label)}</div>
        <div style="font-size:9.5pt">${symptoms.map(s => esc(s)).join(", ")}</div>
      </div>`;
    }).join("");
    parts.push(section("Review of Systems", body));
  }

  const peSysObjs = BODY_SYSTEMS.filter(s => note.peSystems.includes(s.id));
  if (peSysObjs.length) {
    const body = peSysObjs.map(sys => {
      const saved = (note.peSavedData ?? {})[sys.id];
      const findings = saved ? Object.entries(saved).filter(([, v]) => v?.trim()) : [];
      return `<div style="margin-bottom:4pt">
        <div class="sys-heading">${esc(sys.label)}</div>
        ${findings.length
          ? findings.map(([k, v]) => `<div style="font-size:9.5pt"><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join("")
          : `<span style="font-size:9pt;font-style:italic">No findings recorded</span>`}
      </div>`;
    }).join("");
    parts.push(section("Physical Examination", body));
  }

  const completedPoc = (note.pocTests ?? []).filter(t => t.status !== "pending");
  if (completedPoc.length) {
    parts.push(section("Point of Care Labs", completedPoc.map(t =>
      `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(t.name)}</strong>: ${esc(t.status.replace(/_/g, " "))}</div>`
    ).join("")));
  }

  if (note.diagnoses.length)
    parts.push(section("Assessment &amp; Diagnosis", note.diagnoses.map(d =>
      `<div style="margin-bottom:2pt;font-size:9.5pt">${d.code ? esc(d.code) + " \u2014 " : ""}${esc(d.name)}${d.isProvisional ? " (Provisional)" : ""}${d.isFinal ? " (Final)" : ""}</div>`
    ).join("")));

  if (note.visitNote?.trim())
    parts.push(section("Assessment / Plan", `<div class="narrative">${esc(note.visitNote)}</div>`));

  if (note.otherOrders?.trim())
    parts.push(section("Other Orders", `<div class="narrative">${esc(note.otherOrders)}</div>`));

  if (note.planTags?.length)
    parts.push(section("Plan Tags", chips(note.planTags)));

  // ── Orders blocks ──────────────────────────────────────────────────────────

  const labOrders = note.labOrders ?? [];
  const labTableHtml = buildLabOrdersTable(labOrders);
  if (labTableHtml) parts.push(section("Lab Orders", labTableHtml));

  const meds = note.formulary?.medicines ?? [];
  const medsTableHtml = buildMedsTable(meds);
  if (medsTableHtml) parts.push(section("Prescriptions / Medications", medsTableHtml));

  const imgOrders = note.imaging?.orders ?? [];
  if (imgOrders.length)
    parts.push(section("Imaging Orders", chips(imgOrders.map(o => `${o.modality} → ${o.bodyPart} → ${o.protocol}${o.specialInstructions ? ` (${o.specialInstructions})` : ""}`))));

  const procOrders = (note.procedureOrders as { orders?: { uid: string; name: string }[] })?.orders ?? [];
  if (procOrders.length)
    parts.push(section("Procedure Orders", bulletList(procOrders.map(o => o.name))));

  const cpTasks = (note.carePlan as { tasks?: { uid: string; title: string; assignee?: string; dueDate?: string; priority?: string }[] })?.tasks ?? [];
  if (cpTasks.length)
    parts.push(section("Care Plan", bulletList(cpTasks.map(t => t.title + (t.assignee ? ` · ${t.assignee}` : "") + (t.dueDate ? ` · ${t.dueDate}` : "")))));

  const refs = (note.referrals as { referrals?: { id: string; referralTarget?: string; speciality?: string; consultantName?: string; procedureName?: string; facilityName?: string; customTarget?: string }[] })?.referrals ?? [];
  if (refs.length) {
    parts.push(section("Referrals", refs.map(r => {
      const label = r.referralTarget === "Consultant" ? (r.speciality || r.consultantName)
                  : r.referralTarget === "Procedure"  ? r.procedureName
                  : r.referralTarget === "ER"         ? r.facilityName
                  :                                    r.customTarget;
      const extra = r.consultantName && r.referralTarget === "Consultant" ? ` \u2014 ${esc(r.consultantName)}` : "";
      return `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(label ?? "")}</strong>${extra}</div>`;
    }).join("")));
  }

  const goals = (note.patientGoals as { goals?: { uid: string; title: string; targetDate?: string }[] })?.goals ?? [];
  if (goals.length)
    parts.push(section("Patient Goals", bulletList(goals.map(g => g.title + (g.targetDate ? ` (target: ${g.targetDate})` : "")))));

  if (note.followUpDate)
    parts.push(section("Follow-up", `<span style="font-size:9.5pt">${esc(note.followUpDate)}</span>`));

  return parts.join("\n");
}

// ─── Clinical — specialty form ────────────────────────────────────────────────

function buildSpecialtyFormClinical(form: SpecialtyForm, note: NoteState): string {
  const formData = note.specialtyFormData ?? {};

  const unified = [
    ...form.sections.map(s => ({ type: "section" as const, item: s, pos: s.globalOrder ?? 0 })),
    ...(form.systemComponents ?? []).map(sc => ({ type: "sc" as const, item: sc, pos: sc.order })),
  ].sort((a, b) => a.pos - b.pos);

  // Track which system-component order blocks were already rendered inline
  const renderedOrderScs = new Set<string>();
  const parts: string[] = [];

  for (const entry of unified) {
    if (entry.type === "sc") {
      const scId = entry.item.id;
      if (["lab-orders", "formulary", "imaging", "care-plan", "referrals", "patient-goals"].includes(scId)) {
        renderedOrderScs.add(scId);
      }
      const scHtml = buildSystemComponentHtml(scId, note);
      if (scHtml) parts.push(scHtml);
    } else {
      const sHtml = buildFormSectionHtml(entry.item as FormSection, formData);
      if (sHtml) parts.push(sHtml);
    }
  }

  // ── Always append mandatory order blocks that weren't already rendered ──
  if (!renderedOrderScs.has("lab-orders")) {
    const labHtml = buildLabOrdersTable(note.labOrders);
    if (labHtml) parts.push(section("Lab Orders", labHtml));
  }
  if (!renderedOrderScs.has("formulary")) {
    const medsHtml = buildMedsTable(note.formulary?.medicines ?? []);
    if (medsHtml) parts.push(section("Prescriptions / Medications", medsHtml));
  }
  if (!renderedOrderScs.has("imaging")) {
    const imgOrders = note.imaging?.orders ?? [];
    if (imgOrders.length)
      parts.push(section("Imaging Orders", chips(imgOrders.map(o => `${o.modality} → ${o.bodyPart} → ${o.protocol}${o.specialInstructions ? ` (${o.specialInstructions})` : ""}`))));
  }
  const procOrders = (note.procedureOrders as { orders?: { uid: string; name: string }[] })?.orders ?? [];
  if (procOrders.length)
    parts.push(section("Procedure Orders", bulletList(procOrders.map(o => o.name))));

  if (!renderedOrderScs.has("care-plan")) {
    const cpTasks = (note.carePlan as { tasks?: { uid: string; title: string; assignee?: string; dueDate?: string }[] })?.tasks ?? [];
    if (cpTasks.length)
      parts.push(section("Care Plan", bulletList(cpTasks.map(t => t.title + (t.assignee ? ` · ${t.assignee}` : "") + (t.dueDate ? ` · ${t.dueDate}` : "")))));
  }
  if (!renderedOrderScs.has("referrals")) {
    const refs = (note.referrals as { referrals?: { id: string; referralTarget?: string; speciality?: string; consultantName?: string; procedureName?: string; facilityName?: string; customTarget?: string }[] })?.referrals ?? [];
    if (refs.length) {
      parts.push(section("Referrals", refs.map(r => {
        const label = r.referralTarget === "Consultant" ? (r.speciality || r.consultantName)
                    : r.referralTarget === "Procedure"  ? r.procedureName
                    : r.referralTarget === "ER"         ? r.facilityName
                    :                                    r.customTarget;
        const extra = r.consultantName && r.referralTarget === "Consultant" ? ` \u2014 ${esc(r.consultantName)}` : "";
        return `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(label ?? "")}</strong>${extra}</div>`;
      }).join("")));
    }
  }
  if (!renderedOrderScs.has("patient-goals")) {
    const goals = (note.patientGoals as { goals?: { uid: string; title: string; targetDate?: string }[] })?.goals ?? [];
    if (goals.length)
      parts.push(section("Patient Goals", bulletList(goals.map(g => g.title + (g.targetDate ? ` (target: ${g.targetDate})` : "")))));
  }

  if (note.followUpDate)
    parts.push(section("Follow-up", `<span style="font-size:9.5pt">${esc(note.followUpDate)}</span>`));

  return parts.join("\n");
}

function buildFormSectionHtml(sec: FormSection, formData: Record<string, unknown>): string {
  type VisibleField = { label: string; rendered: string };
  const visible: VisibleField[] = [];
  for (const field of sec.fields) {
    const val = formData[field.id];
    if (val == null || val === "" || (Array.isArray(val) && val.length === 0)) continue;
    let rendered = "";
    if (field.type === "textarea" || field.type === "text") {
      rendered = `<div class="narrative">${esc(String(val))}</div>`;
    } else if (field.type === "checkbox-group" || field.type === "multiselect") {
      const arr = Array.isArray(val) ? (val as unknown[]).map(String) : [String(val)];
      rendered = chips(arr);
    } else if (field.type === "radio-group" || field.type === "dropdown" || field.type === "yes-no") {
      rendered = `<span style="font-size:9.5pt">${esc(String(val))}</span>`;
    } else if (field.type === "rating") {
      const max = field.ratingMax ?? 5;
      rendered = `<span style="font-size:9.5pt">${esc(String(val))} / ${max}</span>`;
    } else {
      rendered = `<span style="font-size:9.5pt">${esc(String(val))}</span>`;
    }
    visible.push({ label: field.label, rendered });
  }
  if (!visible.length) return "";
  const showLabels = visible.length > 1;
  const fieldParts = visible.map(({ label, rendered }) => `
      <div style="margin-bottom:5pt">
        ${showLabels ? `<div style="font-size:8pt;font-weight:700;margin-bottom:2pt">${esc(label)}</div>` : ""}
        ${rendered}
      </div>`);
  return section(sec.title, fieldParts.join(""));
}

function buildSystemComponentHtml(id: string, note: NoteState): string {
  switch (id) {
    case "chief-complaint": {
      if (!note.chiefComplaints.length) return "";
      return section("Chief Complaint", chips(note.chiefComplaints));
    }
    case "hpi": {
      const hpiText = note.hpi?.trim();
      const done = note.hpiDoneComplaints ?? [];
      if (!hpiText && !done.length) return "";
      const body = hpiText ? `<div class="narrative">${esc(hpiText)}</div>` : chips(done);
      return section("History of Present Illness", body);
    }
    case "allergies": {
      if (!note.allergies.length) return "";
      return section("Allergies", note.allergies.map(a =>
        `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(a.name)}</strong>${a.reaction ? " \u2014 " + esc(a.reaction) : ""} (${esc(a.severity)})</div>`
      ).join(""));
    }
    case "medical-history": {
      const hasPmh      = note.pmhActive.length > 0 || note.pmhResolved.length > 0;
      const hasSurgical = note.surgicalRows.length > 0;
      const hasFH       = note.fhRows.length > 0;
      const sh          = note.socialHistory;
      const hasSocial   = sh.tobacco.active || sh.alcohol.active || sh.vaping?.active || !!sh.activity || !!sh.sleep;
      if (!hasPmh && !hasSurgical && !hasFH && !hasSocial) return "";
      let body = "";
      if (hasPmh) {
        body += `<div class="sys-heading">Past Medical History</div>`;
        const pmhItems = [
          ...note.pmhActive.map(h => esc(h)),
          ...note.pmhResolved.map(h => `<span style="text-decoration:line-through">${esc(h)}</span>`),
        ];
        body += `<div style="font-size:9.5pt;margin-bottom:2pt">${pmhItems.join(", ")}</div>`;
      }
      if (hasSurgical) {
        body += `<div class="sys-heading">Surgical History</div>`;
        body += bulletList(note.surgicalRows.map(s => s.procedure + (s.date ? ` \u00b7 ${s.date}` : "")));
      }
      if (hasFH) {
        body += `<div class="sys-heading">Family History</div>`;
        body += bulletList(note.fhRows.map(f => `${f.relation}: ${f.condition}`));
      }
      if (hasSocial) {
        body += `<div class="sys-heading">Social History</div>`;
        const si: string[] = [];
        if (sh.tobacco.active) si.push("Smoking" + (sh.tobacco.intake ? ": " + esc(sh.tobacco.intake) : ""));
        if (sh.alcohol.active) si.push("Alcohol" + (sh.alcohol.units ? ": " + esc(sh.alcohol.units) : ""));
        if (sh.vaping?.active) si.push("Vaping");
        if (sh.activity)       si.push("Activity: " + esc(sh.activity));
        if (sh.sleep)          si.push("Sleep: " + esc(sh.sleep));
        body += `<div style="font-size:9.5pt">${si.join(", ")}</div>`;
      }
      return section("Medical, Surgical, Family &amp; Social History", body);
    }
    case "ros": {
      const rosEntries = ROS_SYSTEMS.filter(s => (note.ros[s.id] ?? []).length > 0);
      if (!rosEntries.length) return "";
      const body = rosEntries.map(sys => {
        const symptoms = note.ros[sys.id] ?? [];
        return `<div style="margin-bottom:4pt">
          <div class="sys-heading">${esc(sys.label)}</div>
          <div style="font-size:9.5pt">${symptoms.map(s => esc(s)).join(", ")}</div>
        </div>`;
      }).join("");
      return section("Review of Systems", body);
    }
    case "physical-exam": {
      const peSysObjs = BODY_SYSTEMS.filter(s => note.peSystems.includes(s.id));
      if (!peSysObjs.length) return "";
      const body = peSysObjs.map(sys => {
        const saved = (note.peSavedData ?? {})[sys.id];
        const findings = saved ? Object.entries(saved).filter(([, v]) => v?.trim()) : [];
        return `<div style="margin-bottom:4pt">
          <div class="sys-heading">${esc(sys.label)}</div>
          ${findings.length
            ? findings.map(([k, v]) => `<div style="font-size:9.5pt"><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join("")
            : `<span style="font-size:9pt;font-style:italic">No findings recorded</span>`}
        </div>`;
      }).join("");
      return section("Physical Examination", body);
    }
    case "poc-labs": {
      const completed = (note.pocTests ?? []).filter(t => t.status !== "pending");
      if (!completed.length) return "";
      return section("Point of Care Labs", completed.map(t =>
        `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(t.name)}</strong>: ${esc(t.status.replace(/_/g, " "))}</div>`
      ).join(""));
    }
    case "diagnosis": {
      if (!note.diagnoses.length) return "";
      return section("Assessment &amp; Diagnosis", note.diagnoses.map(d =>
        `<div style="margin-bottom:2pt;font-size:9.5pt">${d.code ? esc(d.code) + " \u2014 " : ""}${esc(d.name)}${d.isProvisional ? " (Provisional)" : ""}${d.isFinal ? " (Final)" : ""}</div>`
      ).join(""));
    }
    case "lab-orders": {
      const labHtml = buildLabOrdersTable(note.labOrders);
      if (!labHtml) return "";
      return section("Lab Orders", labHtml);
    }
    case "formulary": {
      const medsHtml = buildMedsTable(note.formulary?.medicines ?? []);
      if (!medsHtml) return "";
      return section("Prescriptions / Medications", medsHtml);
    }
    case "imaging": {
      const orders = note.imaging?.orders ?? [];
      if (!orders.length) return "";
      return section("Imaging Orders", chips(orders.map(o => `${o.modality} → ${o.bodyPart} → ${o.protocol}${o.specialInstructions ? ` (${o.specialInstructions})` : ""}`)));
    }
    case "care-plan": {
      const tasks = (note.carePlan as { tasks?: { uid: string; title: string; assignee?: string; dueDate?: string }[] })?.tasks ?? [];
      if (!tasks.length) return "";
      return section("Care Plan", bulletList(tasks.map(t => t.title + (t.assignee ? ` · ${t.assignee}` : "") + (t.dueDate ? ` · ${t.dueDate}` : ""))));
    }
    case "referrals": {
      const refs = (note.referrals as { referrals?: { id: string; referralTarget?: string; speciality?: string; consultantName?: string; procedureName?: string; facilityName?: string; customTarget?: string }[] })?.referrals ?? [];
      if (!refs.length) return "";
      return section("Referrals", refs.map(r => {
        const label = r.referralTarget === "Consultant" ? (r.speciality || r.consultantName)
                    : r.referralTarget === "Procedure"  ? r.procedureName
                    : r.referralTarget === "ER"         ? r.facilityName
                    :                                    r.customTarget;
        const extra = r.consultantName && r.referralTarget === "Consultant" ? ` \u2014 ${esc(r.consultantName)}` : "";
        return `<div style="margin-bottom:2pt;font-size:9.5pt"><strong>${esc(label ?? "")}</strong>${extra}</div>`;
      }).join(""));
    }
    case "patient-goals": {
      const goals = (note.patientGoals as { goals?: { uid: string; title: string; targetDate?: string }[] })?.goals ?? [];
      if (!goals.length) return "";
      return section("Patient Goals", bulletList(goals.map(g => g.title + (g.targetDate ? ` (target: ${g.targetDate})` : ""))));
    }
    default:
      return "";
  }
}

