import { useState, useRef, useCallback, useEffect } from "react";
import {
  Folder, FolderOpen, FileText, Image as ImageIcon, Upload, Camera,
  Plus, Search, LayoutGrid, List, MoreVertical, X, ChevronRight, ChevronLeft,
  Trash2, Edit2, ArrowRight, UserCircle, Download, ChevronDown,
  FolderPlus, Move, Eye, ZoomIn, ZoomOut, ExternalLink, Check,
} from "lucide-react";
import { INITIAL_DOCTORS, type Doctor } from "@/pages/DoctorsModule";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface PatientFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  folderId: string | null;
  uploadedAt: string;
  uploadedBy: string;
  assignedDoctorId: string | null;
  assignedDoctorName: string | null;
}

interface FilesState {
  folders: PatientFolder[];
  files: PatientFile[];
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageKey(patientId: string) {
  return `ehr-patient-files-${patientId}`;
}

function loadFilesState(patientId: string): FilesState {
  try {
    const raw = localStorage.getItem(storageKey(patientId));
    if (raw) return JSON.parse(raw) as FilesState;
  } catch { /**/ }
  return { folders: [], files: [] };
}

function saveFilesState(patientId: string, state: FilesState): void {
  try { localStorage.setItem(storageKey(patientId), JSON.stringify(state)); } catch { /**/ }
}

export function loadPatientFilesLatest(patientId: string, limit = 3): PatientFile[] {
  const s = loadFilesState(patientId);
  return [...s.files].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, limit);
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function fileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "JPEG";
  if (mimeType.includes("png")) return "PNG";
  return "File";
}

function loadDoctors(): Doctor[] {
  try {
    const raw = localStorage.getItem("ehr-doctors-v1");
    if (raw) {
      const parsed = JSON.parse(raw) as Doctor[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /**/ }
  return INITIAL_DOCTORS;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function usePatientFiles(patientId: string) {
  const [state, setState] = useState<FilesState>(() => loadFilesState(patientId));

  // Reload when navigating between different patient profiles (SPA param change)
  useEffect(() => {
    setState(loadFilesState(patientId));
  }, [patientId]);

  function persist(updater: (prev: FilesState) => FilesState) {
    setState(prev => {
      const next = updater(prev);
      saveFilesState(patientId, next);
      return next;
    });
  }

  function addFiles(items: Array<{ name: string; mimeType: string; size: number; dataUrl: string }>, folderId: string | null) {
    const now = new Date().toISOString();
    persist(prev => ({
      ...prev,
      files: [
        ...prev.files,
        ...items.map(item => ({
          id: genId(),
          name: item.name,
          mimeType: item.mimeType,
          size: item.size,
          dataUrl: item.dataUrl,
          folderId,
          uploadedAt: now,
          uploadedBy: "Staff",
          assignedDoctorId: null,
          assignedDoctorName: null,
        })),
      ],
    }));
  }

  function addFolder(name: string, parentId: string | null) {
    persist(prev => ({
      ...prev,
      folders: [...prev.folders, { id: genId(), name, parentId, createdAt: new Date().toISOString() }],
    }));
  }

  function moveFile(fileId: string, targetFolderId: string | null) {
    persist(prev => ({
      ...prev,
      files: prev.files.map(f => f.id === fileId ? { ...f, folderId: targetFolderId } : f),
    }));
  }

  function renameFile(fileId: string, newName: string) {
    persist(prev => ({
      ...prev,
      files: prev.files.map(f => f.id === fileId ? { ...f, name: newName } : f),
    }));
  }

  function renameFolder(folderId: string, newName: string) {
    persist(prev => ({
      ...prev,
      folders: prev.folders.map(f => f.id === folderId ? { ...f, name: newName } : f),
    }));
  }

  function deleteFile(fileId: string) {
    persist(prev => ({ ...prev, files: prev.files.filter(f => f.id !== fileId) }));
  }

  function deleteFolder(folderId: string) {
    persist(prev => {
      const collect = (id: string): string[] => {
        const children = prev.folders.filter(f => f.parentId === id).map(f => f.id);
        return [id, ...children.flatMap(collect)];
      };
      const allIds = new Set(collect(folderId));
      return {
        folders: prev.folders.filter(f => !allIds.has(f.id)),
        files:   prev.files.filter(f => f.folderId === null || !allIds.has(f.folderId)),
      };
    });
  }

  function assignDoctor(fileId: string, doctorId: string | null, doctorName: string | null) {
    persist(prev => ({
      ...prev,
      files: prev.files.map(f => f.id === fileId ? { ...f, assignedDoctorId: doctorId, assignedDoctorName: doctorName } : f),
    }));
  }

  function bulkAssignDoctor(ids: string[], doctorId: string | null, doctorName: string | null) {
    const idSet = new Set(ids);
    persist(prev => ({
      ...prev,
      files: prev.files.map(f => idSet.has(f.id) ? { ...f, assignedDoctorId: doctorId, assignedDoctorName: doctorName } : f),
    }));
  }

  return { ...state, addFiles, addFolder, moveFile, renameFile, renameFolder, deleteFile, deleteFolder, assignDoctor, bulkAssignDoctor };
}

// ─── File icon ────────────────────────────────────────────────────────────────

function FileIcon({ mimeType, size = 24 }: { mimeType: string; size?: number }) {
  if (mimeType === "application/pdf") {
    return (
      <div className="flex items-center justify-center rounded-lg bg-red-50 text-red-500" style={{ width: size, height: size }}>
        <FileText style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
    );
  }
  if (mimeType.startsWith("image/")) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-teal-50 text-teal-500" style={{ width: size, height: size }}>
        <ImageIcon style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded-lg bg-slate-100 text-slate-400" style={{ width: size, height: size }}>
      <FileText style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
}

// ─── Folder tree node ─────────────────────────────────────────────────────────

function FolderTreeNode({
  folder, allFolders, depth, currentFolderId, onNavigate,
}: {
  folder: PatientFolder;
  allFolders: PatientFolder[];
  depth: number;
  currentFolderId: string | null;
  onNavigate: (id: string | null) => void;
}) {
  const children = allFolders.filter(f => f.parentId === folder.id);
  const [open, setOpen] = useState(false);
  const isActive = currentFolderId === folder.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer select-none group transition-colors ${isActive ? "bg-[#4982CF]/10 text-[#4982CF]" : "hover:bg-slate-100 text-slate-600"}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => { onNavigate(folder.id); if (children.length > 0) setOpen(o => !o); }}
      >
        {children.length > 0 ? (
          <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} className="flex-shrink-0">
            <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        {isActive
          ? <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-[#4982CF]" />
          : <Folder className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
        }
        <span className="text-xs font-medium truncate ml-1">{folder.name}</span>
      </div>
      {open && children.map(c => (
        <FolderTreeNode key={c.id} folder={c} allFolders={allFolders} depth={depth + 1} currentFolderId={currentFolderId} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// ─── File preview lightbox ────────────────────────────────────────────────────

function FilePreviewModal({
  file, allFiles, onClose, onNavigate, onOpenAssign,
}: {
  file: PatientFile;
  allFiles: PatientFile[];
  onClose: () => void;
  onNavigate: (id: string) => void;
  onOpenAssign: (id: string) => void;
}) {
  const isImage = file.mimeType.startsWith("image/");
  const isPdf   = file.mimeType === "application/pdf";
  const idx     = allFiles.findIndex(f => f.id === file.id);
  const hasPrev = idx > 0;
  const hasNext = idx < allFiles.length - 1;
  const [zoom,  setZoom]  = useState(1);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  // Reset zoom/pan when file changes
  useEffect(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, [file.id]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft"  && hasPrev) onNavigate(allFiles[idx - 1].id);
      if (e.key === "ArrowRight" && hasNext) onNavigate(allFiles[idx + 1].id);
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.25, 4));
      if (e.key === "-") setZoom(z => Math.max(z - 0.25, 0.25));
      if (e.key === "0") { setZoom(1); setOffset({ x: 0, y: 0 }); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [hasPrev, hasNext, idx, allFiles]);

  function onMouseDown(e: React.MouseEvent) {
    if (!isImage || zoom <= 1) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    setOffset({ x: dragStart.current.ox + e.clientX - dragStart.current.mx, y: dragStart.current.oy + e.clientY - dragStart.current.my });
  }
  function onMouseUp() { setDragging(false); dragStart.current = null; }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/92"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <FileIcon mimeType={file.mimeType} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{file.name}</p>
          <p className="text-[10px] text-slate-400">{fileTypeLabel(file.mimeType)} · {formatFileSize(file.size)} · {formatDateTime(file.uploadedAt)} · {file.uploadedBy}</p>
        </div>
        {/* Navigation counter */}
        {allFiles.length > 1 && (
          <span className="text-xs text-slate-400 flex-shrink-0">{idx + 1} / {allFiles.length}</span>
        )}
        {/* Zoom controls (images only) */}
        {isImage && (
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 flex-shrink-0">
            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} disabled={zoom <= 0.25} className="p-1 rounded hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="px-2 py-0.5 text-[10px] font-bold text-white hover:bg-white/10 rounded transition-colors min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} disabled={zoom >= 4} className="p-1 rounded hover:bg-white/10 text-white disabled:opacity-30 transition-colors">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {/* Actions */}
        <button
          onClick={() => { onOpenAssign(file.id); onClose(); }}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
        >
          <UserCircle className="h-3.5 w-3.5" /> Assign Doctor
        </button>
        <button
          onClick={() => window.open(file.dataUrl, "_blank")}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ cursor: isImage && zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Prev arrow */}
        {hasPrev && (
          <button
            onClick={e => { e.stopPropagation(); onNavigate(allFiles[idx - 1].id); }}
            className="absolute left-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {/* Next arrow */}
        {hasNext && (
          <button
            onClick={e => { e.stopPropagation(); onNavigate(allFiles[idx + 1].id); }}
            className="absolute right-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Image */}
        {isImage && (
          <img
            src={file.dataUrl}
            alt={file.name}
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "center",
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              transition: dragging ? "none" : "transform 0.15s ease",
              userSelect: "none",
            }}
          />
        )}

        {/* PDF iframe */}
        {isPdf && (
          <iframe
            src={file.dataUrl}
            title={file.name}
            className="w-full h-full border-none"
            style={{ background: "#fff" }}
          />
        )}
      </div>

      {/* Bottom metadata bar */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2.5 bg-black/60 border-t border-white/10">
        {file.assignedDoctorName && (
          <span className="text-xs text-[#4982CF] font-semibold flex items-center gap-1.5">
            <UserCircle className="h-3.5 w-3.5" /> {file.assignedDoctorName}
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {isImage && zoom !== 1 && "Drag to pan · "}Press Esc to close{allFiles.length > 1 && " · ← → to navigate"}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PatientFilesExplorer({ patientId }: { patientId: string }) {
  const {
    folders, files, addFiles, addFolder,
    moveFile, renameFile, renameFolder,
    deleteFile, deleteFolder, assignDoctor, bulkAssignDoctor,
  } = usePatientFiles(patientId);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode,        setViewMode]         = useState<"grid" | "list">("grid");
  const [searchQuery,     setSearchQuery]       = useState("");
  const [activeMenu,      setActiveMenu]        = useState<string | null>(null);
  const [isDragOver,      setIsDragOver]        = useState(false);

  // modals
  const [showCameraMsg,   setShowCameraMsg]   = useState(false);
  const [newFolderName,   setNewFolderName]   = useState<string | null>(null);
  const [renameTarget,    setRenameTarget]    = useState<{ id: string; type: "file" | "folder"; name: string } | null>(null);
  const [moveTarget,      setMoveTarget]      = useState<string | null>(null);      // file id
  const [assignTarget,    setAssignTarget]    = useState<string | null>(null);      // file id
  const [deleteTarget,    setDeleteTarget]    = useState<{ id: string; type: "file" | "folder"; name: string } | null>(null);
  const [previewFileId,   setPreviewFileId]   = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(() => new Set());
  const [bulkAssignOpen,  setBulkAssignOpen]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const doctors = loadDoctors().filter(d => d.status === "active");

  // close menu on outside click
  useEffect(() => {
    const handler = () => setActiveMenu(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // clear selection when navigating folders or changing search
  useEffect(() => { setSelectedFileIds(new Set()); }, [currentFolderId, searchQuery]);

  // ── Breadcrumb ───────────────────────────────────────────────────────────────

  function getBreadcrumb(): Array<{ id: string | null; name: string }> {
    const crumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: "Files" }];
    let fid = currentFolderId;
    const path: PatientFolder[] = [];
    while (fid) {
      const f = folders.find(x => x.id === fid);
      if (!f) break;
      path.unshift(f);
      fid = f.parentId;
    }
    path.forEach(f => crumbs.push({ id: f.id, name: f.name }));
    return crumbs;
  }

  // ── File reading ─────────────────────────────────────────────────────────────

  async function readFileAsDataUrl(file: File): Promise<{ name: string; mimeType: string; size: number; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: reader.result as string,
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileInput(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const allowed = Array.from(fileList).filter(f =>
      f.type === "application/pdf" ||
      f.type === "image/jpeg" ||
      f.type === "image/jpg" ||
      f.type === "image/png"
    );
    if (allowed.length === 0) return;
    const items = await Promise.all(allowed.map(readFileAsDataUrl));
    addFiles(items, currentFolderId);
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    await handleFileInput(e.dataTransfer.files);
  }, [currentFolderId, addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  // ── Filtered content ─────────────────────────────────────────────────────────

  const q = searchQuery.trim().toLowerCase();
  const visibleFolders = folders
    .filter(f => f.parentId === currentFolderId)
    .filter(f => !q || f.name.toLowerCase().includes(q));
  const visibleFiles = files
    .filter(f => f.folderId === currentFolderId)
    .filter(f => !q || f.name.toLowerCase().includes(q));

  const isEmpty = visibleFolders.length === 0 && visibleFiles.length === 0;
  const crumbs = getBreadcrumb();

  // ── Actions ──────────────────────────────────────────────────────────────────

  function handleDownload(file: PatientFile) {
    window.open(file.dataUrl, "_blank");
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "file") deleteFile(deleteTarget.id);
    else {
      if (currentFolderId === deleteTarget.id) setCurrentFolderId(null);
      deleteFolder(deleteTarget.id);
    }
    setDeleteTarget(null);
  }

  function handleRenameSubmit(value: string) {
    if (!renameTarget || !value.trim()) return;
    if (renameTarget.type === "file") renameFile(renameTarget.id, value.trim());
    else renameFolder(renameTarget.id, value.trim());
    setRenameTarget(null);
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedFileIds(new Set(visibleFiles.map(f => f.id)));
  }

  function clearSelection() {
    setSelectedFileIds(new Set());
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────────

  function ActionMenu({ id, type, file }: { id: string; type: "file" | "folder"; file?: PatientFile }) {
    const open = activeMenu === id;
    return (
      <div className="relative" onMouseDown={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); setActiveMenu(open ? null : id); }}
          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px]">
            {type === "file" && (
              <MenuItem icon={Eye} label="Preview" onClick={() => { setPreviewFileId(id); setActiveMenu(null); }} />
            )}
            <MenuItem icon={Edit2} label="Rename" onClick={() => { setRenameTarget({ id, type, name: file?.name ?? folders.find(f=>f.id===id)?.name ?? "" }); setActiveMenu(null); }} />
            {type === "file" && (
              <>
                <MenuItem icon={Move} label="Move to…" onClick={() => { setMoveTarget(id); setActiveMenu(null); }} />
                <MenuItem icon={UserCircle} label="Assign Doctor" onClick={() => { setAssignTarget(id); setActiveMenu(null); }} />
                <MenuItem icon={Download} label="Open" onClick={() => { if (file) handleDownload(file); setActiveMenu(null); }} />
              </>
            )}
            <div className="my-1 border-t border-slate-100" />
            <MenuItem icon={Trash2} label="Delete" danger onClick={() => { setDeleteTarget({ id, type, name: file?.name ?? folders.find(f=>f.id===id)?.name ?? "" }); setActiveMenu(null); }} />
          </div>
        )}
      </div>
    );
  }

  function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium transition-colors ${danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"}`}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        {label}
      </button>
    );
  }

  function FolderCard({ folder }: { folder: PatientFolder }) {
    const childCount = folders.filter(f => f.parentId === folder.id).length + files.filter(f => f.folderId === folder.id).length;
    if (viewMode === "list") {
      return (
        <div
          onDoubleClick={() => { setCurrentFolderId(folder.id); setSearchQuery(""); }}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-lg group cursor-default border-b border-slate-100 last:border-0"
        >
          <Folder className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-700 flex-1 truncate">{folder.name}</span>
          <span className="text-xs text-slate-400 w-32 flex-shrink-0">{childCount} item{childCount !== 1 ? "s" : ""}</span>
          <span className="text-xs text-slate-400 w-36 flex-shrink-0">{formatDateTime(folder.createdAt)}</span>
          <div className="opacity-0 group-hover:opacity-100">
            <ActionMenu id={folder.id} type="folder" />
          </div>
        </div>
      );
    }
    return (
      <div
        onDoubleClick={() => { setCurrentFolderId(folder.id); setSearchQuery(""); }}
        className="relative flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 bg-white cursor-default group transition-colors"
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
          <ActionMenu id={folder.id} type="folder" />
        </div>
        <Folder className="h-10 w-10 text-amber-400" />
        <span className="text-xs font-semibold text-slate-700 text-center line-clamp-2 leading-tight">{folder.name}</span>
        {childCount > 0 && <span className="text-[10px] text-slate-400">{childCount} item{childCount !== 1 ? "s" : ""}</span>}
      </div>
    );
  }

  function FileCard({ file }: { file: PatientFile }) {
    const isImage = file.mimeType.startsWith("image/");
    if (viewMode === "list") {
      const isSelected = selectedFileIds.has(file.id);
      return (
        <div
          onClick={() => setPreviewFileId(file.id)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg group cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${isSelected ? "bg-[#4982CF]/6" : "hover:bg-blue-50/40"}`}
        >
          {/* Checkbox */}
          <div
            className={`flex-shrink-0 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            onClick={e => toggleSelect(file.id, e)}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? "bg-[#4982CF] border-[#4982CF]" : "bg-white border-slate-300 hover:border-[#4982CF]"}`}>
              {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </div>
          </div>
          <FileIcon mimeType={file.mimeType} size={28} />
          <span className="text-sm text-slate-700 font-medium flex-1 truncate">{file.name}</span>
          <span className="text-xs text-slate-400 w-16 flex-shrink-0">{fileTypeLabel(file.mimeType)}</span>
          <span className="text-xs text-slate-400 w-20 flex-shrink-0">{formatFileSize(file.size)}</span>
          <span className="text-xs text-slate-400 w-40 flex-shrink-0">{formatDateTime(file.uploadedAt)}</span>
          <span className="text-xs text-slate-400 w-24 flex-shrink-0">{file.uploadedBy}</span>
          <span className="text-xs text-[#4982CF] w-28 flex-shrink-0 truncate">{file.assignedDoctorName ?? "—"}</span>
          <div className="opacity-0 group-hover:opacity-100">
            <ActionMenu id={file.id} type="file" file={file} />
          </div>
        </div>
      );
    }
    const isSelected = selectedFileIds.has(file.id);
    return (
      <div
        onClick={() => setPreviewFileId(file.id)}
        className={`relative flex flex-col rounded-xl border bg-white cursor-pointer group transition-all overflow-hidden ${isSelected ? "border-[#4982CF]/60 shadow-md ring-1 ring-[#4982CF]/20" : "border-slate-200 hover:border-[#4982CF]/40 hover:shadow-md"}`}
      >
        {/* Checkbox top-left */}
        <div
          className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          onClick={e => toggleSelect(file.id, e)}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer shadow-sm transition-colors ${isSelected ? "bg-[#4982CF] border-[#4982CF]" : "bg-white/90 border-slate-300 hover:border-[#4982CF]"}`}>
            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </div>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-10" onClick={e => e.stopPropagation()}>
          <ActionMenu id={file.id} type="file" file={file} />
        </div>
        {/* Thumbnail or icon */}
        <div className="h-24 flex items-center justify-center bg-slate-50 border-b border-slate-100 overflow-hidden relative">
          {isImage ? (
            <img src={file.dataUrl} alt={file.name} className="h-full w-full object-cover" />
          ) : (
            <FileIcon mimeType={file.mimeType} size={44} />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
            <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
          </div>
        </div>
        <div className="p-3 flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2">{file.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white ${file.mimeType === "application/pdf" ? "bg-red-400" : "bg-teal-400"}`}>
              {fileTypeLabel(file.mimeType)}
            </span>
            <span className="text-[10px] text-slate-400">{formatFileSize(file.size)}</span>
          </div>
          {file.assignedDoctorName && (
            <p className="text-[10px] text-[#4982CF] font-medium truncate">{file.assignedDoctorName}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(file.uploadedAt)}</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* ── Left panel: folder tree ─────────────────────────────────────────── */}
      <div className="w-52 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/60 overflow-hidden">
        <div className="px-3 py-3 border-b border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Navigator</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Root */}
          <button
            onClick={() => { setCurrentFolderId(null); setSearchQuery(""); }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${currentFolderId === null ? "bg-[#4982CF]/10 text-[#4982CF]" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {currentFolderId === null
              ? <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" />
              : <Folder className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            }
            <span className="text-xs font-semibold">All Files</span>
          </button>
          {/* Folder tree */}
          {folders.filter(f => f.parentId === null).map(f => (
            <FolderTreeNode key={f.id} folder={f} allFolders={folders} depth={0} currentFolderId={currentFolderId} onNavigate={id => { setCurrentFolderId(id); setSearchQuery(""); }} />
          ))}
        </div>
        {/* New folder shortcut */}
        <div className="p-2 border-t border-slate-200">
          <button
            onClick={() => setNewFolderName("")}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-[#4982CF] hover:bg-[#4982CF]/5 transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Folder
          </button>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-white">
          {/* Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            className="hidden"
            onChange={e => handleFileInput(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg bg-[#4982CF] hover:bg-[#3a6fb8] text-white transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
          {/* Take photo */}
          <button
            onClick={() => setShowCameraMsg(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" /> Take Photo
          </button>
          {/* New folder */}
          <button
            onClick={() => setNewFolderName("")}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New Folder
          </button>
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files & folders…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#4982CF] transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#4982CF] text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#4982CF] text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Camera message banner */}
        {showCameraMsg && (
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
            <Camera className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium flex-1">Camera will be enabled for taking photos in a future update.</p>
            <button onClick={() => setShowCameraMsg(false)} className="text-amber-400 hover:text-amber-600"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
              <button
                onClick={() => { setCurrentFolderId(crumb.id); setSearchQuery(""); }}
                className={`font-medium hover:text-[#4982CF] transition-colors ${i === crumbs.length - 1 ? "text-slate-700" : "text-slate-400"}`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
          <span className="ml-1 text-slate-300">— {visibleFolders.length + visibleFiles.length} item{visibleFolders.length + visibleFiles.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Selection toolbar — slides in when ≥1 file selected */}
        {selectedFileIds.size > 0 && (
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-[#4982CF]/8 border-b border-[#4982CF]/20 animate-in slide-in-from-top-1 duration-150">
            <span className="text-xs font-bold text-[#4982CF]">
              {selectedFileIds.size} file{selectedFileIds.size !== 1 ? "s" : ""} selected
            </span>
            {visibleFiles.length > selectedFileIds.size && (
              <button
                onClick={selectAllVisible}
                className="text-xs text-slate-500 hover:text-[#4982CF] underline underline-offset-2 transition-colors"
              >
                Select all {visibleFiles.length}
              </button>
            )}
            <button
              onClick={clearSelection}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Deselect all
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setBulkAssignOpen(true)}
              className="flex items-center gap-1.5 h-7 px-3 text-xs font-bold rounded-lg bg-[#4982CF] hover:bg-[#3a6fb8] text-white transition-colors shadow-sm"
            >
              <UserCircle className="h-3.5 w-3.5" /> Assign Doctor
            </button>
            <button
              onClick={clearSelection}
              className="p-1 rounded-lg hover:bg-[#4982CF]/10 text-slate-400 hover:text-[#4982CF] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Content area */}
        <div
          className={`flex-1 overflow-y-auto p-4 transition-colors ${isDragOver ? "bg-[#4982CF]/5 ring-2 ring-[#4982CF]/30 ring-inset" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Folder className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                {searchQuery ? "No results found" : "This folder is empty"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Drop files here or click <strong>Upload</strong> to add documents, images, or PDFs.
                </p>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {visibleFolders.map(f => <FolderCard key={f.id} folder={f} />)}
              {visibleFiles.map(f => <FileCard key={f.id} file={f} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <span className="w-4 flex-shrink-0" />
                <span className="w-7 flex-shrink-0" />
                <span className="flex-1">Name</span>
                <span className="w-16 flex-shrink-0">Type</span>
                <span className="w-20 flex-shrink-0">Size</span>
                <span className="w-40 flex-shrink-0">Date</span>
                <span className="w-24 flex-shrink-0">Uploaded By</span>
                <span className="w-28 flex-shrink-0">Doctor</span>
                <span className="w-6 flex-shrink-0" />
              </div>
              {visibleFolders.map(f => <FolderCard key={f.id} folder={f} />)}
              {visibleFiles.map(f => <FileCard key={f.id} file={f} />)}
            </div>
          )}

          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-[#4982CF] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl">
                Drop to upload
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* File preview lightbox */}
      {previewFileId && (() => {
        const previewFile = files.find(f => f.id === previewFileId);
        if (!previewFile) return null;
        return (
          <FilePreviewModal
            file={previewFile}
            allFiles={visibleFiles}
            onClose={() => setPreviewFileId(null)}
            onNavigate={id => setPreviewFileId(id)}
            onOpenAssign={id => { setAssignTarget(id); setPreviewFileId(null); }}
          />
        );
      })()}

      {/* New Folder */}
      {newFolderName !== null && (
        <ModalOverlay onClose={() => setNewFolderName(null)}>
          <ModalBox title="New Folder" onClose={() => setNewFolderName(null)}>
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newFolderName.trim()) { addFolder(newFolderName.trim(), currentFolderId); setNewFolderName(null); }
                if (e.key === "Escape") setNewFolderName(null);
              }}
              placeholder="Folder name"
              className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#4982CF]"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setNewFolderName(null)} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                disabled={!newFolderName.trim()}
                onClick={() => { addFolder(newFolderName.trim(), currentFolderId); setNewFolderName(null); }}
                className="flex-1 h-9 rounded-lg bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold disabled:opacity-40"
              >Create</button>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* Rename */}
      {renameTarget && (
        <RenameModal
          initialName={renameTarget.name}
          onConfirm={v => handleRenameSubmit(v)}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {/* Move */}
      {moveTarget && (
        <MoveModal
          fileId={moveTarget}
          folders={folders}
          currentFolderId={files.find(f => f.id === moveTarget)?.folderId ?? null}
          onMove={(fid) => { moveFile(moveTarget, fid); setMoveTarget(null); }}
          onClose={() => setMoveTarget(null)}
        />
      )}

      {/* Assign Doctor (single) */}
      {assignTarget && (
        <AssignDoctorModal
          doctors={doctors}
          currentDoctorId={files.find(f => f.id === assignTarget)?.assignedDoctorId ?? null}
          onAssign={(id, name) => { assignDoctor(assignTarget, id, name); setAssignTarget(null); }}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {/* Bulk Assign Doctor */}
      {bulkAssignOpen && (
        <AssignDoctorModal
          doctors={doctors}
          currentDoctorId={null}
          onAssign={(id, name) => {
            bulkAssignDoctor([...selectedFileIds], id, name);
            clearSelection();
            setBulkAssignOpen(false);
          }}
          onClose={() => setBulkAssignOpen(false)}
          title={`Assign ${selectedFileIds.size} file${selectedFileIds.size !== 1 ? "s" : ""} to Doctor`}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ModalOverlay onClose={() => setDeleteTarget(null)}>
          <ModalBox title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
            <p className="text-sm text-slate-600">
              Delete <strong>"{deleteTarget.name}"</strong>?
              {deleteTarget.type === "folder" && " All files inside will also be deleted."}
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold">Delete</button>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─── Shared modal primitives ──────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onMouseDown={onClose}>
      <div onMouseDown={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalBox({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-5 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
      </div>
      {children}
    </div>
  );
}

function RenameModal({ initialName, onConfirm, onClose }: { initialName: string; onConfirm: (v: string) => void; onClose: () => void }) {
  const [value, setValue] = useState(initialName);
  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Rename" onClose={onClose}>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && value.trim()) onConfirm(value); if (e.key === "Escape") onClose(); }}
          className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#4982CF]"
        />
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            disabled={!value.trim()}
            onClick={() => onConfirm(value)}
            className="flex-1 h-9 rounded-lg bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold disabled:opacity-40"
          >Save</button>
        </div>
      </ModalBox>
    </ModalOverlay>
  );
}

function MoveModal({ fileId, folders, currentFolderId, onMove, onClose }: {
  fileId: string;
  folders: PatientFolder[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(currentFolderId);

  function FolderOption({ folder, depth }: { folder: PatientFolder; depth: number }) {
    const children = folders.filter(f => f.parentId === folder.id);
    return (
      <>
        <button
          onClick={() => setSelected(folder.id)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${selected === folder.id ? "bg-[#4982CF]/10 text-[#4982CF]" : "hover:bg-slate-50 text-slate-700"}`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
          <span className="truncate">{folder.name}</span>
        </button>
        {children.map(c => <FolderOption key={c.id} folder={c} depth={depth + 1} />)}
      </>
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Move to Folder" onClose={onClose}>
        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
          <button
            onClick={() => setSelected(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${selected === null ? "bg-[#4982CF]/10 text-[#4982CF]" : "hover:bg-slate-50 text-slate-700"}`}
          >
            <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">All Files (root)</span>
          </button>
          {folders.filter(f => f.parentId === null).map(f => <FolderOption key={f.id} folder={f} depth={0} />)}
          {folders.length === 0 && <p className="text-xs text-slate-400 px-3 py-4 text-center">No folders yet</p>}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onMove(selected)}
            className="flex-1 h-9 rounded-lg bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold"
          >Move Here</button>
        </div>
      </ModalBox>
    </ModalOverlay>
  );
}

function AssignDoctorModal({ doctors, currentDoctorId, onAssign, onClose, title = "Assign to Doctor" }: {
  doctors: Doctor[];
  currentDoctorId: string | null;
  onAssign: (id: string | null, name: string | null) => void;
  onClose: () => void;
  title?: string;
}) {
  const [selected, setSelected] = useState<string | null>(currentDoctorId);
  const selDoc = doctors.find(d => d.id === selected);

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title={title} onClose={onClose}>
        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
          <button
            onClick={() => setSelected(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${selected === null ? "bg-[#4982CF]/10 text-[#4982CF]" : "hover:bg-slate-50 text-slate-500"}`}
          >
            <UserCircle className="h-4 w-4 flex-shrink-0" />
            <span>Unassigned</span>
          </button>
          {doctors.map(d => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${selected === d.id ? "bg-[#4982CF]/10 text-[#4982CF]" : "hover:bg-slate-50 text-slate-700"}`}
            >
              <div className="h-6 w-6 rounded-full bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-black text-[#4982CF]">{d.name.split(" ").filter(Boolean).slice(1, 3).map(w => w[0]).join("")}</span>
              </div>
              <div className="text-left">
                <p className="font-medium leading-tight">{d.name}</p>
                {d.specialties?.[0] && <p className="text-[10px] text-slate-400">{d.specialties[0]}</p>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onAssign(selected, selDoc?.name ?? null)}
            className="flex-1 h-9 rounded-lg bg-[#4982CF] hover:bg-[#3a6fb8] text-white text-sm font-bold"
          >Assign</button>
        </div>
      </ModalBox>
    </ModalOverlay>
  );
}
