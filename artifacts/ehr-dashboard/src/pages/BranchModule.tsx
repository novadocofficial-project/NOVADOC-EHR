import { useState } from "react";
import {
  Plus, Edit2, Trash2, GitBranch, Clock, Globe, Search, AlertCircle, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Branch = {
  id: string;
  name: string;
  code: string;
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  tokenResetTime: string;
  status: "active" | "inactive";
  createdAt: string;
};

const TIMEZONES = [
  "Asia/Karachi", "Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka",
  "Asia/Riyadh", "Europe/London", "America/New_York", "America/Chicago",
];

const BLANK: Omit<Branch, "id" | "createdAt"> = {
  name: "", code: "", timezone: "Asia/Karachi",
  workingHoursStart: "08:00", workingHoursEnd: "22:00",
  tokenResetTime: "00:00", status: "active",
};

const SEED: Branch[] = [
  {
    id: "br-1", name: "Main Branch — Lahore", code: "LHR-MAIN",
    timezone: "Asia/Karachi", workingHoursStart: "08:00", workingHoursEnd: "22:00",
    tokenResetTime: "00:00", status: "active", createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "br-2", name: "North Branch — Islamabad", code: "ISB-NORTH",
    timezone: "Asia/Karachi", workingHoursStart: "09:00", workingHoursEnd: "20:00",
    tokenResetTime: "00:00", status: "active", createdAt: "2024-06-15T00:00:00.000Z",
  },
  {
    id: "br-3", name: "East Branch — Karachi", code: "KHI-EAST",
    timezone: "Asia/Karachi", workingHoursStart: "07:30", workingHoursEnd: "21:00",
    tokenResetTime: "00:00", status: "inactive", createdAt: "2024-09-01T00:00:00.000Z",
  },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function BranchModule() {
  const [branches, setBranches] = useState<Branch[]>(SEED);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Branch, "id" | "createdAt">>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = branches.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setForm(BLANK); setErrors({}); setEditingId(null); setShowForm(true);
  }
  function openEdit(b: Branch) {
    setForm({ name: b.name, code: b.code, timezone: b.timezone,
      workingHoursStart: b.workingHoursStart, workingHoursEnd: b.workingHoursEnd,
      tokenResetTime: b.tokenResetTime, status: b.status });
    setErrors({}); setEditingId(b.id); setShowForm(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Branch name is required.";
    if (!form.code.trim()) errs.code = "Branch code is required.";
    else {
      const dup = branches.find(b => b.code === form.code.trim().toUpperCase() && b.id !== editingId);
      if (dup) errs.code = "Code must be unique.";
    }
    if (!form.workingHoursStart || !form.workingHoursEnd) errs.hours = "Working hours are required.";
    return errs;
  }

  function save() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload = { ...form, code: form.code.trim().toUpperCase() };
    if (editingId) {
      setBranches(p => p.map(b => b.id === editingId ? { ...b, ...payload } : b));
    } else {
      setBranches(p => [...p, { ...payload, id: `br-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
  }

  const field = (key: string) => ({
    value: (form as Record<string, string>)[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Branch Management</h1>
          <p className="mt-1 text-sm text-slate-500">Configure clinic branches, working hours, and token reset schedules.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2">
          <Plus className="h-4 w-4" />Add Branch
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search branches…" className="pl-9" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="grid border-b border-slate-100 bg-slate-50/80 px-5 py-3"
          style={{ gridTemplateColumns: "1fr 110px 160px 120px 120px 90px 110px" }}>
          {["Branch Name", "Code", "Timezone", "Working Hours", "Token Reset", "Status", "Created"].map(h => (
            <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <GitBranch className="h-8 w-8 opacity-20 mb-2" />
            <p className="text-sm text-slate-500 font-medium">No branches found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(b => (
              <div key={b.id} className="grid items-center px-5 py-4 hover:bg-slate-50 group transition-colors"
                style={{ gridTemplateColumns: "1fr 110px 160px 120px 120px 90px 110px" }}>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                </div>
                <span className="font-mono text-xs font-bold text-[#4982CF] bg-[#4982CF]/8 px-2 py-0.5 rounded w-fit">{b.code}</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe className="h-3 w-3" />{b.timezone}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Clock className="h-3 w-3 text-slate-400" />{fmt12(b.workingHoursStart)} – {fmt12(b.workingHoursEnd)}
                </div>
                <span className="text-xs text-slate-600 font-mono">{fmt12(b.tokenResetTime)}</span>
                <div className="flex items-center gap-1.5">
                  <Switch checked={b.status === "active"}
                    onCheckedChange={v => setBranches(p => p.map(br => br.id === b.id ? { ...br, status: v ? "active" : "inactive" } : br))}
                    className="data-[state=checked]:bg-emerald-500 scale-75" />
                  <span className={`text-xs font-medium ${b.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                    {b.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{fmtDate(b.createdAt)}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(b)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(b.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={showForm} onOpenChange={v => !v && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Branch Name <span className="text-rose-500">*</span></Label>
                <Input {...field("name")} placeholder="e.g. Main Branch — Lahore" className="h-9 text-sm" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Branch Code <span className="text-rose-500">*</span></Label>
                <Input {...field("code")} placeholder="e.g. LHR-MAIN" className="h-9 text-sm font-mono" />
                {errors.code && <p className="text-xs text-rose-500">{errors.code}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Timezone</Label>
                <Select value={form.timezone} onValueChange={v => setForm(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Working Hours — Start <span className="text-rose-500">*</span></Label>
                <Input type="time" {...field("workingHoursStart")} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Working Hours — End <span className="text-rose-500">*</span></Label>
                <Input type="time" {...field("workingHoursEnd")} className="h-9 text-sm" />
                {errors.hours && <p className="text-xs text-rose-500 col-span-2">{errors.hours}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Token Reset Time</Label>
                <Input type="time" {...field("tokenResetTime")} className="h-9 text-sm" />
                <p className="text-[10px] text-slate-400">Tokens reset daily at this time.</p>
              </div>
              <div className="space-y-1.5 flex flex-col justify-center">
                <Label className="text-xs font-semibold text-slate-600">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={form.status === "active"} onCheckedChange={v => setForm(p => ({ ...p, status: v ? "active" : "inactive" }))} className="data-[state=checked]:bg-emerald-500" />
                  <span className="text-sm text-slate-600">{form.status === "active" ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 text-sm">Cancel</Button>
              <Button onClick={save} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm gap-2">
                <Check className="h-4 w-4" />{editingId ? "Save Changes" : "Add Branch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Delete Branch</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 mt-1">Are you sure you want to delete <strong>{branches.find(b => b.id === deleteId)?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setBranches(p => p.filter(b => b.id !== deleteId)); setDeleteId(null); }} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
