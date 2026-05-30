import { useState, useMemo } from "react";
import {
  BookOpen, Plus, Search, Pencil, Trash2, X, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HEALTH_ED_DOCS, type HealthEdDoc, type HealthEdCategory } from "@/pages/HealthEdSection";

// ─── Storage ──────────────────────────────────────────────────────────────────

const LIBRARY_KEY = "ehr-health-ed-library-v1";

function loadLibrary(): HealthEdDoc[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) return JSON.parse(raw) as HealthEdDoc[];
  } catch { /**/ }
  return HEALTH_ED_DOCS.map(d => ({ ...d }));
}

function saveLibrary(docs: HealthEdDoc[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(docs));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: HealthEdCategory[] = ["Handout", "Patient Education", "Non-Pharma Guidance"];

const CAT_BADGE: Record<HealthEdCategory, string> = {
  "Handout":             "bg-blue-100 text-blue-700",
  "Patient Education":   "bg-violet-100 text-violet-700",
  "Non-Pharma Guidance": "bg-teal-100 text-teal-700",
};

const EMPTY_FORM = {
  title: "",
  brief: "",
  category: "Handout" as HealthEdCategory,
  content: "",
};

type FormState = typeof EMPTY_FORM;

// ─── Component ────────────────────────────────────────────────────────────────

export function HealthEdLibraryModule() {
  const [docs, setDocs] = useState<HealthEdDoc[]>(loadLibrary);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<HealthEdCategory | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  function persist(updated: HealthEdDoc[]) {
    setDocs(updated);
    saveLibrary(updated);
  }

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(doc: HealthEdDoc) {
    setEditId(doc.id);
    setForm({ title: doc.title, brief: doc.brief, category: doc.category, content: doc.content });
    setFormError("");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.brief.trim()) { setFormError("Brief description is required."); return; }
    if (!form.content.trim()) { setFormError("Content is required."); return; }

    if (editId) {
      persist(docs.map(d => d.id === editId ? { ...d, ...form } : d));
    } else {
      const newDoc: HealthEdDoc = {
        id: `hed-${Date.now()}`,
        ...form,
      };
      persist([...docs, newDoc]);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    persist(docs.filter(d => d.id !== id));
    setDeleteConfirm(null);
    if (previewId === id) setPreviewId(null);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return docs.filter(d => {
      const matchCat = catFilter === "all" || d.category === catFilter;
      const matchQ = !q || d.title.toLowerCase().includes(q) || d.brief.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [docs, query, catFilter]);

  const previewDoc = previewId ? docs.find(d => d.id === previewId) ?? null : null;

  const counts: Record<HealthEdCategory | "all", number> = {
    all: docs.length,
    Handout: docs.filter(d => d.category === "Handout").length,
    "Patient Education": docs.filter(d => d.category === "Patient Education").length,
    "Non-Pharma Guidance": docs.filter(d => d.category === "Non-Pharma Guidance").length,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Education Library</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage handouts, patient education documents, and non-pharma guidance available in the SOAP drawer.
          </p>
        </div>
        <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...CATEGORIES] as const).map(cat => {
          const active = catFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? "bg-[#4982CF] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "all" ? "All" : cat}
              <span className={`ml-1.5 ${active ? "text-white/80" : "text-slate-400"}`}>
                {counts[cat]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by title or description…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 border-slate-200"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-400">
        {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        {query ? ` matching "${query}"` : ""}
        {catFilter !== "all" ? ` in ${catFilter}` : ""}
      </p>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No documents found</p>
            <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filter</p>
          </div>
        )}

        {filtered.map(doc => {
          const isPreviewing = previewId === doc.id;
          return (
            <div key={doc.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-start gap-4 p-4">
                {/* Icon */}
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#4982CF]/10">
                  <BookOpen className="h-4.5 w-4.5 text-[#4982CF]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800 truncate">{doc.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_BADGE[doc.category]}`}>
                      {doc.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{doc.brief}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    title={isPreviewing ? "Hide preview" : "Preview content"}
                    onClick={() => setPreviewId(isPreviewing ? null : doc.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    {isPreviewing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(doc)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4982CF] transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => setDeleteConfirm(doc.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Inline preview */}
              {isPreviewing && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <pre className="whitespace-pre-wrap text-xs text-slate-600 font-mono leading-relaxed max-h-64 overflow-y-auto">
                    {doc.content}
                  </pre>
                </div>
              )}

              {/* Delete confirmation inline */}
              {deleteConfirm === doc.id && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-700 font-medium">Delete "{doc.title}"? This cannot be undone.</p>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" className="border-slate-200 h-7" onClick={() => setDeleteConfirm(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-red-600 text-white hover:bg-red-700 h-7" onClick={() => handleDelete(doc.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Document" : "Add Health Education Document"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Category</label>
              <Select
                value={form.category}
                onValueChange={v => setForm(f => ({ ...f, category: v as HealthEdCategory }))}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Title</label>
              <Input
                placeholder="e.g. Understanding Your Blood Pressure"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="border-slate-200"
              />
            </div>

            {/* Brief */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Brief Description</label>
              <Input
                placeholder="One-sentence summary shown to doctors in the picker"
                value={form.brief}
                onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                className="border-slate-200"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Document Content</label>
              <textarea
                rows={12}
                placeholder="Full document text, instructions, or guidance…"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/40 resize-y"
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="border-slate-200" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-[#4982CF] text-white hover:bg-[#3D73BC]" onClick={handleSave}>
                {editId ? "Save Changes" : "Add Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
