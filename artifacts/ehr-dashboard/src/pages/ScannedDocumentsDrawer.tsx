import { useState, useEffect } from "react";
import {
  ScanLine, X, Maximize2, Minimize2, Eye, Download,
} from "lucide-react";
import {
  PatientFile, loadFilesState, FileIcon, formatFileSize,
  fileTypeLabel, FilePreviewModal,
} from "@/pages/PatientFilesExplorer";

const ACCENT = "#4982CF";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function groupByDate(files: PatientFile[]): { dateKey: string; label: string; files: PatientFile[] }[] {
  const groups: Record<string, PatientFile[]> = {};
  for (const f of files) {
    const key = f.uploadedAt.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, fs]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      files: [...fs].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    }));
}

// ─── File row ─────────────────────────────────────────────────────────────────

function FileRow({
  file, onPreview, onDownload,
}: {
  file: PatientFile;
  onPreview: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-[#4982CF]/30 hover:bg-slate-50/60 group transition-all">
      <FileIcon mimeType={file.mimeType} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {fileTypeLabel(file.mimeType)} · {formatFileSize(file.size)} · {formatTime(file.uploadedAt)}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold rounded-lg transition-colors"
          style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

interface ScannedDocumentsDrawerProps {
  patientId: string;
  doctorId?: string;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export function ScannedDocumentsDrawer({
  patientId, doctorId, fullscreen, onToggleFullscreen, onClose,
}: ScannedDocumentsDrawerProps) {
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    const state = loadFilesState(patientId);
    const filtered = doctorId
      ? state.files.filter(f => f.assignedDoctorId === doctorId)
      : [];
    setFiles(filtered.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)));
  }, [patientId, doctorId]);

  const groups = groupByDate(files);
  const previewFile = previewId ? (files.find(f => f.id === previewId) ?? null) : null;

  return (
    <>
      {/* Backdrop */}
      {!fullscreen && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-30" />
      )}

      {/* Drawer panel */}
      <div className={[
        "absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-40 transition-all duration-300",
        fullscreen ? "inset-0 w-full" : "w-1/2 border-l border-slate-200",
      ].join(" ")}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}15` }}
          >
            <ScanLine className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Record</p>
            <p className="text-sm font-black text-slate-800">Scanned Documents</p>
          </div>
          {files.length > 0 && (
            <span className="text-xs text-slate-400 flex-shrink-0">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          )}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${ACCENT}10` }}
              >
                <ScanLine className="h-7 w-7" style={{ color: ACCENT, opacity: 0.5 }} />
              </div>
              <p className="text-sm font-semibold text-slate-500">No scanned documents assigned to you for this patient</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Files assigned to you from the Patient Profile will appear here.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {groups.map(group => (
                <div key={group.dateKey}>
                  {/* Date heading */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-shrink-0">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {group.files.length} {group.files.length === 1 ? "file" : "files"}
                    </span>
                  </div>
                  {/* File rows */}
                  <div className="space-y-2">
                    {group.files.map(file => (
                      <FileRow
                        key={file.id}
                        file={file}
                        onPreview={() => setPreviewId(file.id)}
                        onDownload={() => window.open(file.dataUrl, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Preview lightbox ── */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          allFiles={files}
          onClose={() => setPreviewId(null)}
          onNavigate={id => setPreviewId(id)}
        />
      )}
    </>
  );
}
