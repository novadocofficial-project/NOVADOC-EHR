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
  const { jsPDF } = await import("jspdf");
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
  const providerHtml = buildProviderBlock(noteRow, visitType);

  // ── Inject flat (no position:fixed) container for html2canvas ───────────
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:0;width:760px;background:#fff;margin:0;padding:0;overflow:visible";
  container.innerHTML = `<style>${PDF_CONTENT_CSS}</style><div class="pdf-content">${patientInfoHtml}${vitalsHtml}<hr class="divider"/>${clinicalHtml}${providerHtml}</div>`;
  document.body.appendChild(container);

  const A4_W = 210;
  const A4_H = 297;
  const ML = 16, MR = 16, MT = 22, MB = 20;
  const contentW = A4_W - ML - MR; // 178 mm

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const contentEl = container.querySelector(".pdf-content") as HTMLElement;

  await new Promise<void>(resolve => {
    pdf.html(contentEl, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (doc: any) => {
        const total = (doc as JSPDF).getNumberOfPages();
        for (let pg = 1; pg <= total; pg++) {
          (doc as JSPDF).setPage(pg);
          pdfAddHeader(doc as JSPDF, p, A4_W, pg, total);
          pdfAddFooter(doc as JSPDF, A4_W, A4_H);
        }
        resolve();
      },
      x: ML,
      y: MT,
      width: contentW,
      windowWidth: 760,
      margin: [MT, MR, MB, ML],
      autoPaging: "text",
      html2canvas: { scale: 2, useCORS: true, logging: false },
    });
  });

  document.body.removeChild(container);
  const blob = pdf.output("blob");
  window.open(URL.createObjectURL(blob), "_blank");
}

// ─── jsPDF per-page header ────────────────────────────────────────────────────

function pdfAddHeader(doc: JSPDF, p: PrintHealthRecordParams, pageW: number, page: number, total: number): void {
  // Blue separator line
  doc.setDrawColor(73, 130, 207);
  doc.setLineWidth(0.4);
  doc.line(0, 19, pageW, 19);

  // Logo: "Nova" (blue) + "Doc" (dark)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(73, 130, 207);
  doc.text("Nova", 16, 13);
  const novaW = doc.getTextWidth("Nova");
  doc.setTextColor(30, 41, 59);
  doc.text("Doc", 16 + novaW, 13);

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
  font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
  font-size: 10.5pt;
  color: #1e293b;
  background: #fff;
  line-height: 1.5;
}
.patient-table { width:100%; border-collapse:collapse; margin-bottom:10pt; border:1px solid #e2e8f0; overflow:hidden; }
.patient-table td { padding:5pt 8pt; font-size:9pt; border:1px solid #e2e8f0; vertical-align:top; }
.patient-table .cell-label { font-weight:700; color:#64748b; font-size:7.5pt; text-transform:uppercase; letter-spacing:0.04em; background:#f8fafc; width:90pt; }
.patient-table .cell-value { color:#1e293b; font-weight:600; }
.patient-name-row td { font-size:11pt; font-weight:900; color:#1e293b; background:#f0f6ff; border-bottom:2px solid #4982CF; }
.vitals-grid { display:flex; flex-wrap:wrap; gap:6pt; margin-bottom:10pt; }
.vital-chip { display:flex; align-items:baseline; gap:4pt; padding:4pt 8pt; border:1px solid #e2e8f0; border-radius:6pt; background:#fff; font-size:9pt; }
.vital-label { font-size:7pt; font-weight:900; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; }
.vital-value { font-weight:800; color:#1e293b; }
.vital-unit { font-size:7pt; color:#94a3b8; }
.sec { margin-bottom:8pt; }
.sec-title { font-size:7.5pt; font-weight:900; text-transform:uppercase; letter-spacing:0.07em; color:#4982CF; border-bottom:1px solid #e2e8f0; padding-bottom:2pt; margin-bottom:5pt; }
.sec-body { font-size:9.5pt; color:#334155; }
.chips { display:flex; flex-wrap:wrap; gap:4pt; }
.chip { display:inline-block; padding:2pt 7pt; border-radius:100pt; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; font-size:8.5pt; font-weight:600; }
.chip-warn { background:#fff7ed; border-color:#fed7aa; color:#c2410c; }
.chip-muted { background:#f1f5f9; border-color:#cbd5e1; color:#475569; }
.chip-red { background:#fef2f2; border-color:#fecaca; color:#b91c1c; }
.allergy-row { display:flex; align-items:center; gap:8pt; border:1px solid; border-radius:5pt; padding:4pt 8pt; margin-bottom:3pt; font-size:8.5pt; }
.alg-name { font-weight:800; flex-shrink:0; }
.alg-sep { width:1px; align-self:stretch; background:currentColor; opacity:0.2; flex-shrink:0; }
.alg-react { flex:1; }
.alg-sev { font-size:7.5pt; font-weight:900; background:rgba(255,255,255,0.5); padding:1pt 4pt; border-radius:100pt; }
.blist { padding-left:14pt; }
.blist li { margin-bottom:2pt; font-size:9pt; }
.dx-row { display:flex; align-items:center; gap:8pt; border:1px solid #e2e8f0; border-radius:5pt; padding:4pt 8pt; margin-bottom:3pt; background:#f8fafc; font-size:9pt; }
.dx-code { font-weight:900; font-family:monospace; color:#475569; flex-shrink:0; }
.dx-sep { width:1px; align-self:stretch; background:#e2e8f0; flex-shrink:0; }
.dx-name { flex:1; font-weight:600; }
.dx-badge { font-size:7pt; font-weight:900; padding:1pt 5pt; border-radius:100pt; background:#fefce8; border:1px solid #fde68a; color:#92400e; }
.dx-badge-final { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }
.orders-table { width:100%; border-collapse:collapse; font-size:8.5pt; margin-bottom:4pt; }
.orders-table th { text-align:left; font-size:7.5pt; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:2px solid #e2e8f0; padding:3pt 6pt; }
.orders-table td { padding:4pt 6pt; border-bottom:1px solid #f1f5f9; vertical-align:top; }
.orders-table tr:last-child td { border-bottom:none; }
.voided-row td { color:#94a3b8; text-decoration:line-through; }
.voided-badge { display:inline-block; font-size:6.5pt; font-weight:900; padding:1pt 4pt; border-radius:100pt; background:#fef2f2; border:1px solid #fecaca; color:#991b1b; text-decoration:none !important; }
.provider-block { margin-top:14pt; border-top:1px dashed #e2e8f0; padding-top:8pt; display:flex; justify-content:space-between; align-items:flex-start; font-size:8.5pt; }
.provider-label { font-weight:900; color:#1e293b; }
.provider-sub { color:#64748b; margin-top:1pt; }
.poc-row { display:flex; align-items:center; gap:8pt; border:1px solid; border-radius:5pt; padding:4pt 8pt; margin-bottom:3pt; font-size:8.5pt; }
.divider { border:none; border-top:1px solid #e2e8f0; margin:10pt 0; }
.sub-label { font-size:7pt; font-weight:900; text-transform:uppercase; letter-spacing:0.07em; color:#94a3b8; margin:4pt 0 3pt; }
.narrative { border:1px solid #e2e8f0; border-radius:5pt; padding:6pt 9pt; background:#f8fafc; font-size:9pt; line-height:1.6; white-space:pre-wrap; }
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
  return `<div class="chips">${items.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>`;
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
.hdr-logo {
  font-size: 16pt;
  font-weight: 900;
  color: #4982CF;
  letter-spacing: -0.5px;
}
.hdr-logo span { color: #1e293b; }
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

/* ── Patient info table ── */
.patient-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10pt;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.patient-table td {
  padding: 5pt 8pt;
  font-size: 9pt;
  border: 1px solid #e2e8f0;
  vertical-align: top;
}
.patient-table .cell-label {
  font-weight: 700;
  color: #64748b;
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f8fafc;
  width: 90pt;
}
.patient-table .cell-value {
  color: #1e293b;
  font-weight: 600;
}
.patient-name-row td {
  font-size: 11pt;
  font-weight: 900;
  color: #1e293b;
  background: #f0f6ff;
  border-bottom: 2px solid #4982CF;
}

/* ── Vitals grid ── */
.vitals-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6pt;
  margin-bottom: 10pt;
}
.vital-chip {
  display: flex;
  align-items: baseline;
  gap: 4pt;
  padding: 4pt 8pt;
  border: 1px solid #e2e8f0;
  border-radius: 6pt;
  background: #fff;
  font-size: 9pt;
}
.vital-label {
  font-size: 7pt;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.vital-value {
  font-weight: 800;
  color: #1e293b;
}
.vital-unit {
  font-size: 7pt;
  color: #94a3b8;
}

/* ── Sections ── */
.sec {
  margin-bottom: 8pt;
  page-break-inside: avoid;
}
.sec-title {
  font-size: 7.5pt;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #4982CF;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 2pt;
  margin-bottom: 5pt;
}
.sec-body {
  font-size: 9.5pt;
  color: #334155;
}

/* chips */
.chips { display: flex; flex-wrap: wrap; gap: 4pt; }
.chip {
  display: inline-block;
  padding: 2pt 7pt;
  border-radius: 100pt;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 8.5pt;
  font-weight: 600;
}
.chip-warn  { background:#fff7ed; border-color:#fed7aa; color:#c2410c; }
.chip-muted { background:#f1f5f9; border-color:#cbd5e1; color:#475569; }
.chip-red   { background:#fef2f2; border-color:#fecaca; color:#b91c1c; }

/* allergy rows */
.allergy-row {
  display: flex;
  align-items: center;
  gap: 8pt;
  border: 1px solid;
  border-radius: 5pt;
  padding: 4pt 8pt;
  margin-bottom: 3pt;
  font-size: 8.5pt;
}
.alg-name  { font-weight: 800; flex-shrink: 0; }
.alg-sep   { width: 1px; align-self: stretch; background: currentColor; opacity: 0.2; flex-shrink: 0; }
.alg-react { flex: 1; }
.alg-sev   { font-size: 7.5pt; font-weight: 900; background: rgba(255,255,255,0.5); padding: 1pt 4pt; border-radius: 100pt; }

/* bullet list */
.blist { padding-left: 14pt; }
.blist li { margin-bottom: 2pt; font-size: 9pt; }

/* diagnoses */
.dx-row {
  display: flex;
  align-items: center;
  gap: 8pt;
  border: 1px solid #e2e8f0;
  border-radius: 5pt;
  padding: 4pt 8pt;
  margin-bottom: 3pt;
  background: #f8fafc;
  font-size: 9pt;
}
.dx-code { font-weight: 900; font-family: monospace; color: #475569; flex-shrink: 0; }
.dx-sep  { width: 1px; align-self: stretch; background: #e2e8f0; flex-shrink: 0; }
.dx-name { flex: 1; font-weight: 600; }
.dx-badge {
  font-size: 7pt; font-weight: 900; padding: 1pt 5pt; border-radius: 100pt;
  background: #fefce8; border: 1px solid #fde68a; color: #92400e;
}
.dx-badge-final { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }

/* orders table */
.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin-bottom: 4pt;
}
.orders-table th {
  text-align: left;
  font-size: 7.5pt;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
  padding: 3pt 6pt;
}
.orders-table td {
  padding: 4pt 6pt;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}
.orders-table tr:last-child td { border-bottom: none; }
.voided-row td { color: #94a3b8; text-decoration: line-through; }
.voided-badge {
  display: inline-block;
  font-size: 6.5pt;
  font-weight: 900;
  padding: 1pt 4pt;
  border-radius: 100pt;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  text-decoration: none !important;
}

/* provider block */
.provider-block {
  margin-top: 14pt;
  border-top: 1px dashed #e2e8f0;
  padding-top: 8pt;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 8.5pt;
}
.provider-label { font-weight: 900; color: #1e293b; }
.provider-sub   { color: #64748b; margin-top: 1pt; }

/* poc labs */
.poc-row {
  display: flex;
  align-items: center;
  gap: 8pt;
  border: 1px solid;
  border-radius: 5pt;
  padding: 4pt 8pt;
  margin-bottom: 3pt;
  font-size: 8.5pt;
}

/* divider */
.divider { border: none; border-top: 1px solid #e2e8f0; margin: 10pt 0; }

/* subsection label */
.sub-label {
  font-size: 7pt;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94a3b8;
  margin: 4pt 0 3pt;
}

/* narrative text */
.narrative {
  border: 1px solid #e2e8f0;
  border-radius: 5pt;
  padding: 6pt 9pt;
  background: #f8fafc;
  font-size: 9pt;
  line-height: 1.6;
  white-space: pre-wrap;
}

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
    <div class="hdr-logo">Nova<span>Doc</span></div>
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

  const providerHtml = buildProviderBlock(noteRow, visitType);

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
    ${providerHtml}
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
  return `
  <table class="patient-table">
    <tr class="patient-name-row">
      <td colspan="4">${esc(patient.name)}</td>
    </tr>
    <tr>
      <td class="cell-label">MR Number</td>
      <td class="cell-value">${esc(patient.mrn ?? "—")}</td>
      <td class="cell-label">Visit Date</td>
      <td class="cell-value">${esc(noteRow.date)}${noteRow.time ? " &nbsp;·&nbsp; " + esc(noteRow.time) : ""}</td>
    </tr>
    <tr>
      <td class="cell-label">Physician</td>
      <td class="cell-value">${esc(noteRow.doctor)}</td>
      <td class="cell-label">Visit Type</td>
      <td class="cell-value">${esc(visitType || noteRow.type)}</td>
    </tr>
  </table>`;
}

// ─── Vitals — dummy ───────────────────────────────────────────────────────────

function buildDummyVitals(note: SoapDummyNote): string {
  const items: { label: string; value: string; unit: string }[] = [
    { label: "BP",     value: note.vitals.bp,     unit: "mmHg" },
    { label: "Pulse",  value: note.vitals.pulse,  unit: "bpm"  },
    { label: "Temp",   value: note.vitals.temp,   unit: "°C"   },
    { label: "SpO₂",  value: note.vitals.spo2,   unit: "%"    },
    { label: "Weight", value: note.vitals.weight, unit: ""     },
  ].filter(v => v.value);
  if (!items.length) return "";
  return `
  <div class="vitals-grid">
    ${items.map(v => `
    <div class="vital-chip">
      <span class="vital-label">${v.label}</span>
      <span class="vital-value">${esc(v.value)}</span>
      ${v.unit ? `<span class="vital-unit">${esc(v.unit)}</span>` : ""}
    </div>`).join("")}
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
    { label: "SpO₂", value: v.spo2    != null ? String(v.spo2)   : "", unit: "%"   },
    { label: "Temp",  value: v.temp    != null ? String(v.temp)   : "", unit: "°C"  },
  ].filter(item => item.value);
  if (!items.length) return "";
  return `
  <div class="vitals-grid">
    ${items.map(item => `
    <div class="vital-chip">
      <span class="vital-label">${item.label}</span>
      <span class="vital-value">${esc(item.value)}</span>
      ${item.unit ? `<span class="vital-unit">${esc(item.unit)}</span>` : ""}
    </div>`).join("")}
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
    parts.push(section("Allergies", note.allergies.map(a => {
      const cls = a.severity === "Severe" ? "alg-row" : "";
      const bg  = a.severity === "Severe"   ? "background:#fef2f2;border-color:#fca5a5;color:#991b1b"
                : a.severity === "Moderate" ? "background:#fff7ed;border-color:#fed7aa;color:#c2410c"
                :                            "background:#f0f9ff;border-color:#bae6fd;color:#0369a1";
      return `<div class="allergy-row ${cls}" style="${bg}">
        <span class="alg-name">${esc(a.name)}</span>
        <div class="alg-sep"></div>
        <span class="alg-react">${esc(a.reaction)}</span>
        <span class="alg-sev">${esc(a.severity)}</span>
      </div>`;
    }).join("")));

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
    parts.push(section("Point of Care Labs", note.pocLabs.map(l => {
      const bg = l.status === "Abnormal"
        ? "background:#fef2f2;border-color:#fca5a5;color:#991b1b"
        : "background:#f0fdf4;border-color:#bbf7d0;color:#166534";
      return `<div class="poc-row" style="${bg}">
        <span style="font-weight:700;flex:1">${esc(l.test)}</span>
        <span style="font-weight:800">${esc(l.result)}${l.unit ? " " + esc(l.unit) : ""}</span>
        <span style="font-size:7.5pt;font-weight:900;background:rgba(255,255,255,0.5);padding:1pt 4pt;border-radius:100pt">${esc(l.status)}</span>
      </div>`;
    }).join("")));

  if (note.diagnoses.length)
    parts.push(section("Assessment &amp; Diagnosis", note.diagnoses.map(d => `
      <div class="dx-row">
        <span class="dx-code">${esc(d.code)}</span>
        <div class="dx-sep"></div>
        <span class="dx-name">${esc(d.name)}</span>
        <span class="chip chip-muted" style="font-size:7.5pt">${esc(d.severity)}</span>
      </div>`).join("")));

  const allLabs = [...(note.labOrders ?? []).flatMap(o => o.tests.map(t => t.name)), ...note.labs];
  if (allLabs.length)
    parts.push(section("Lab Orders", chips(allLabs)));

  if (note.prescriptions.length)
    parts.push(section("Prescriptions", `
      <table class="orders-table">
        <thead><tr><th>Drug</th><th>Instructions</th><th>Qty</th></tr></thead>
        <tbody>
          ${note.prescriptions.map(rx => `<tr>
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
    parts.push(section("Referrals", note.referrals.map(r => `
      <div class="dx-row">
        <span style="font-weight:700;color:#4982CF">${esc(r.specialty)}</span>
        <div class="dx-sep"></div>
        <span>${esc(r.reason)}</span>
      </div>`).join("")));

  if (note.patientGoals.length)
    parts.push(section("Patient Goals", bulletList(note.patientGoals)));

  if (note.otherOrders.length)
    parts.push(section("Other Orders", bulletList(note.otherOrders)));

  if (note.visitDescription?.trim())
    parts.push(section("Visit Summary", `<div class="narrative">${esc(note.visitDescription)}</div>`));

  if (note.followUp)
    parts.push(section("Follow-up", `<span class="chip">${esc(note.followUp)}</span>`));

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
  <table class="orders-table">
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
  <table class="orders-table">
    <thead><tr><th>Drug</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
    <tbody>
      ${meds.map(m => `<tr>
        <td style="font-weight:700">${esc(m.brand)}${m.genericName ? `<br/><span style="font-size:7.5pt;font-weight:400;color:#64748b">${esc(m.genericName)}</span>` : ""}</td>
        <td>${m.dose ? esc(m.dose) + (m.unit ? " " + esc(m.unit) : "") : "—"}</td>
        <td>${esc(m.frequency ?? "—")}</td>
        <td>${esc(m.duration ?? "—")}</td>
        <td>${esc(m.route ?? "—")}</td>
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
    parts.push(section("Allergies", note.allergies.map(a => {
      const bg = a.severity === "severe"   ? "background:#fef2f2;border-color:#fca5a5;color:#991b1b"
               : a.severity === "moderate" ? "background:#fff7ed;border-color:#fed7aa;color:#c2410c"
               :                            "background:#f0f9ff;border-color:#bae6fd;color:#0369a1";
      return `<div class="allergy-row" style="${bg}">
        <span class="alg-name">${esc(a.name)}</span>
        ${a.reaction ? `<div class="alg-sep"></div><span class="alg-react">${esc(a.reaction)}</span>` : ""}
        <span class="alg-sev">${esc(a.severity)}</span>
      </div>`;
    }).join("")));

  const hasPmh      = note.pmhActive.length > 0 || note.pmhResolved.length > 0;
  const hasSurgical = note.surgicalRows.length > 0;
  const hasFH       = note.fhRows.length > 0;
  const sh          = note.socialHistory;
  const hasSocial   = sh.tobacco.active || sh.alcohol.active || sh.vaping?.active || !!sh.activity || !!sh.sleep;

  if (hasPmh || hasSurgical || hasFH || hasSocial) {
    let body = "";
    if (hasPmh) {
      body += `<div class="sub-label">Past Medical History</div><div class="chips">`;
      body += note.pmhActive.map(h => `<span class="chip">${esc(h)}</span>`).join("");
      body += note.pmhResolved.map(h => `<span class="chip chip-muted" style="text-decoration:line-through">${esc(h)}</span>`).join("");
      body += `</div>`;
    }
    if (hasSurgical) {
      body += `<div class="sub-label" style="margin-top:5pt">Surgical History</div>`;
      body += bulletList(note.surgicalRows.map(s => s.procedure + (s.date ? ` · ${s.date}` : "")));
    }
    if (hasFH) {
      body += `<div class="sub-label" style="margin-top:5pt">Family History</div>`;
      body += bulletList(note.fhRows.map(f => `${f.relation}: ${f.condition}`));
    }
    if (hasSocial) {
      body += `<div class="sub-label" style="margin-top:5pt">Social History</div><div class="chips">`;
      if (sh.tobacco.active) body += `<span class="chip chip-muted">Smoking${sh.tobacco.intake ? ": " + esc(sh.tobacco.intake) : ""}</span>`;
      if (sh.alcohol.active) body += `<span class="chip chip-muted">Alcohol${sh.alcohol.units ? ": " + esc(sh.alcohol.units) : ""}</span>`;
      if (sh.vaping?.active) body += `<span class="chip chip-muted">Vaping</span>`;
      if (sh.activity)       body += `<span class="chip chip-muted">Activity: ${esc(sh.activity)}</span>`;
      if (sh.sleep)          body += `<span class="chip chip-muted">Sleep: ${esc(sh.sleep)}</span>`;
      body += `</div>`;
    }
    parts.push(section("Medical, Surgical, Family &amp; Social History", body));
  }

  const rosEntries = ROS_SYSTEMS.filter(s => (note.ros[s.id] ?? []).length > 0);
  if (rosEntries.length) {
    const body = rosEntries.map(sys => {
      const symptoms = (note.ros[sys.id] ?? []);
      return `<div style="margin-bottom:4pt">
        <div style="font-size:7pt;font-weight:900;text-transform:uppercase;letter-spacing:0.07em;color:#0369a1;margin-bottom:2pt">${esc(sys.label)}</div>
        <div class="chips">${symptoms.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>
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
        <div style="font-size:7pt;font-weight:900;text-transform:uppercase;letter-spacing:0.07em;color:#7c3aed;margin-bottom:2pt">${esc(sys.label)}</div>
        ${findings.length
          ? findings.map(([k, v]) => `<div style="font-size:8.5pt"><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join("")
          : `<span style="font-size:8pt;color:#94a3b8;font-style:italic">No findings recorded</span>`}
      </div>`;
    }).join("");
    parts.push(section("Physical Examination", body));
  }

  const completedPoc = (note.pocTests ?? []).filter(t => t.status !== "pending");
  if (completedPoc.length) {
    parts.push(section("Point of Care Labs", completedPoc.map(t => {
      const isPos = t.status === "positive";
      const bg = isPos
        ? "background:#fef2f2;border-color:#fca5a5;color:#991b1b"
        : "background:#f0fdf4;border-color:#bbf7d0;color:#166534";
      return `<div class="poc-row" style="${bg}">
        <span style="font-weight:700;flex:1">${esc(t.name)}</span>
        <span style="font-size:7.5pt;font-weight:900;background:rgba(255,255,255,0.5);padding:1pt 4pt;border-radius:100pt">${esc(t.status.replace(/_/g, " "))}</span>
      </div>`;
    }).join("")));
  }

  if (note.diagnoses.length)
    parts.push(section("Assessment &amp; Diagnosis", note.diagnoses.map(d => `
      <div class="dx-row">
        <span class="dx-code">${esc(d.code)}</span>
        <div class="dx-sep"></div>
        <span class="dx-name">${esc(d.name)}</span>
        ${d.isProvisional ? `<span class="dx-badge">Provisional</span>` : ""}
        ${d.isFinal       ? `<span class="dx-badge dx-badge-final">Final</span>` : ""}
      </div>`).join("")));

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
    parts.push(section("Imaging Orders", chips(imgOrders.map(o => o.testName + (o.category ? ` (${o.category})` : "")))));

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
      return `<div class="dx-row">
        <span style="font-weight:700;color:#4982CF">${esc(label ?? "")}</span>
        ${r.consultantName && r.referralTarget === "Consultant" ? `<div class="dx-sep"></div><span>${esc(r.consultantName)}</span>` : ""}
      </div>`;
    }).join("")));
  }

  const goals = (note.patientGoals as { goals?: { uid: string; title: string; targetDate?: string }[] })?.goals ?? [];
  if (goals.length)
    parts.push(section("Patient Goals", bulletList(goals.map(g => g.title + (g.targetDate ? ` (target: ${g.targetDate})` : "")))));

  if (note.followUpDate)
    parts.push(section("Follow-up", `<span class="chip">${esc(note.followUpDate)}</span>`));

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
      parts.push(section("Imaging Orders", chips(imgOrders.map(o => o.testName + (o.category ? ` (${o.category})` : "")))));
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
        return `<div class="dx-row">
          <span style="font-weight:700;color:#4982CF">${esc(label ?? "")}</span>
          ${r.consultantName && r.referralTarget === "Consultant" ? `<div class="dx-sep"></div><span>${esc(r.consultantName)}</span>` : ""}
        </div>`;
      }).join("")));
    }
  }
  if (!renderedOrderScs.has("patient-goals")) {
    const goals = (note.patientGoals as { goals?: { uid: string; title: string; targetDate?: string }[] })?.goals ?? [];
    if (goals.length)
      parts.push(section("Patient Goals", bulletList(goals.map(g => g.title + (g.targetDate ? ` (target: ${g.targetDate})` : "")))));
  }

  if (note.followUpDate)
    parts.push(section("Follow-up", `<span class="chip">${esc(note.followUpDate)}</span>`));

  return parts.join("\n");
}

function buildFormSectionHtml(sec: FormSection, formData: Record<string, unknown>): string {
  const fieldParts: string[] = [];
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
      rendered = `<span class="chip">${esc(String(val))}</span>`;
    } else if (field.type === "rating") {
      const max = field.ratingMax ?? 5;
      rendered = `<span class="chip">${esc(String(val))} / ${max}</span>`;
    } else {
      rendered = `<span style="font-size:9pt">${esc(String(val))}</span>`;
    }
    fieldParts.push(`
      <div style="margin-bottom:5pt">
        <div style="font-size:7.5pt;font-weight:700;color:#64748b;margin-bottom:2pt">${esc(field.label)}</div>
        ${rendered}
      </div>`);
  }
  if (!fieldParts.length) return "";
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
      return section("Allergies", note.allergies.map(a => {
        const bg = a.severity === "severe"   ? "background:#fef2f2;border-color:#fca5a5;color:#991b1b"
                 : a.severity === "moderate" ? "background:#fff7ed;border-color:#fed7aa;color:#c2410c"
                 :                            "background:#f0f9ff;border-color:#bae6fd;color:#0369a1";
        return `<div class="allergy-row" style="${bg}">
          <span class="alg-name">${esc(a.name)}</span>
          ${a.reaction ? `<div class="alg-sep"></div><span class="alg-react">${esc(a.reaction)}</span>` : ""}
          <span class="alg-sev">${esc(a.severity)}</span>
        </div>`;
      }).join(""));
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
        body += `<div class="sub-label">Past Medical History</div><div class="chips">`;
        body += note.pmhActive.map(h => `<span class="chip">${esc(h)}</span>`).join("");
        body += note.pmhResolved.map(h => `<span class="chip chip-muted" style="text-decoration:line-through">${esc(h)}</span>`).join("");
        body += `</div>`;
      }
      if (hasSurgical) {
        body += `<div class="sub-label" style="margin-top:5pt">Surgical History</div>`;
        body += bulletList(note.surgicalRows.map(s => s.procedure + (s.date ? ` · ${s.date}` : "")));
      }
      if (hasFH) {
        body += `<div class="sub-label" style="margin-top:5pt">Family History</div>`;
        body += bulletList(note.fhRows.map(f => `${f.relation}: ${f.condition}`));
      }
      if (hasSocial) {
        body += `<div class="sub-label" style="margin-top:5pt">Social History</div><div class="chips">`;
        if (sh.tobacco.active) body += `<span class="chip chip-muted">Smoking${sh.tobacco.intake ? ": " + esc(sh.tobacco.intake) : ""}</span>`;
        if (sh.alcohol.active) body += `<span class="chip chip-muted">Alcohol${sh.alcohol.units ? ": " + esc(sh.alcohol.units) : ""}</span>`;
        if (sh.vaping?.active) body += `<span class="chip chip-muted">Vaping</span>`;
        if (sh.activity)       body += `<span class="chip chip-muted">Activity: ${esc(sh.activity)}</span>`;
        if (sh.sleep)          body += `<span class="chip chip-muted">Sleep: ${esc(sh.sleep)}</span>`;
        body += `</div>`;
      }
      return section("Medical, Surgical, Family &amp; Social History", body);
    }
    case "ros": {
      const rosEntries = ROS_SYSTEMS.filter(s => (note.ros[s.id] ?? []).length > 0);
      if (!rosEntries.length) return "";
      const body = rosEntries.map(sys => {
        const symptoms = note.ros[sys.id] ?? [];
        return `<div style="margin-bottom:4pt">
          <div style="font-size:7pt;font-weight:900;text-transform:uppercase;letter-spacing:0.07em;color:#0369a1;margin-bottom:2pt">${esc(sys.label)}</div>
          <div class="chips">${symptoms.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>
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
          <div style="font-size:7pt;font-weight:900;text-transform:uppercase;letter-spacing:0.07em;color:#7c3aed;margin-bottom:2pt">${esc(sys.label)}</div>
          ${findings.length
            ? findings.map(([k, v]) => `<div style="font-size:8.5pt"><strong>${esc(k)}:</strong> ${esc(v)}</div>`).join("")
            : `<span style="font-size:8pt;color:#94a3b8;font-style:italic">No findings recorded</span>`}
        </div>`;
      }).join("");
      return section("Physical Examination", body);
    }
    case "poc-labs": {
      const completed = (note.pocTests ?? []).filter(t => t.status !== "pending");
      if (!completed.length) return "";
      return section("Point of Care Labs", completed.map(t => {
        const isPos = t.status === "positive";
        const bg = isPos
          ? "background:#fef2f2;border-color:#fca5a5;color:#991b1b"
          : "background:#f0fdf4;border-color:#bbf7d0;color:#166534";
        return `<div class="poc-row" style="${bg}">
          <span style="font-weight:700;flex:1">${esc(t.name)}</span>
          <span style="font-size:7.5pt;font-weight:900;background:rgba(255,255,255,0.5);padding:1pt 4pt;border-radius:100pt">${esc(t.status.replace(/_/g, " "))}</span>
        </div>`;
      }).join(""));
    }
    case "diagnosis": {
      if (!note.diagnoses.length) return "";
      return section("Assessment &amp; Diagnosis", note.diagnoses.map(d => `
        <div class="dx-row">
          <span class="dx-code">${esc(d.code)}</span>
          <div class="dx-sep"></div>
          <span class="dx-name">${esc(d.name)}</span>
          ${d.isProvisional ? `<span class="dx-badge">Provisional</span>` : ""}
          ${d.isFinal       ? `<span class="dx-badge dx-badge-final">Final</span>` : ""}
        </div>`).join(""));
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
      return section("Imaging Orders", chips(orders.map(o => o.testName + (o.category ? ` (${o.category})` : ""))));
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
        return `<div class="dx-row">
          <span style="font-weight:700;color:#4982CF">${esc(label ?? "")}</span>
          ${r.consultantName && r.referralTarget === "Consultant" ? `<div class="dx-sep"></div><span>${esc(r.consultantName)}</span>` : ""}
        </div>`;
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

// ─── Provider block ───────────────────────────────────────────────────────────

function buildProviderBlock(
  noteRow: { doctor: string; type: string },
  visitType: string,
): string {
  return `
  <div class="provider-block">
    <div>
      <div class="provider-label">Attending Physician</div>
      <div class="provider-sub">${esc(noteRow.doctor)}</div>
    </div>
    <div style="text-align:center">
      <div class="provider-label">Visit Type</div>
      <div class="provider-sub">${esc(visitType || noteRow.type)}</div>
    </div>
    <div style="text-align:right">
      <div class="provider-label">Facility</div>
      <div class="provider-sub">NovaDoc Health</div>
    </div>
  </div>`;
}
