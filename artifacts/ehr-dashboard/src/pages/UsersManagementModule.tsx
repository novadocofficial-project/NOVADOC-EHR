import { useState } from "react";
import { Plus, Edit2, Trash2, Check, AlertCircle, Eye, EyeOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserRole = "admin" | "front-desk" | "doctor";

type SystemUser = {
  id: string;
  name: string;
  loginId: string;
  password: string;
  role: UserRole;
  assignedCounterId: string;
  status: "active" | "inactive";
  createdAt: string;
};

const COUNTERS = [
  { id: "ctr-1", name: "Registration Desk 1" },
  { id: "ctr-2", name: "Registration Desk 2" },
  { id: "ctr-3", name: "Dr. Room A" },
  { id: "ctr-4", name: "Dr. Room B" },
  { id: "ctr-5", name: "Lab Desk 1" },
  { id: "ctr-6", name: "Pharmacy Desk" },
];

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  admin:      { label: "Admin",      color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  "front-desk": { label: "Front Desk", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  doctor:     { label: "Doctor",     color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const BLANK: Omit<SystemUser, "id" | "createdAt"> = {
  name: "", loginId: "", password: "", role: "front-desk",
  assignedCounterId: "", status: "active",
};

const SEED_USERS: SystemUser[] = [
  { id: "u-1", name: "System Admin", loginId: "admin", password: "Admin@123", role: "admin", assignedCounterId: "", status: "active", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "u-2", name: "Ayesha Khan", loginId: "ayesha.k", password: "Pass@1234", role: "front-desk", assignedCounterId: "ctr-1", status: "active", createdAt: "2024-03-10T00:00:00.000Z" },
  { id: "u-3", name: "Bilal Chaudhry", loginId: "bilal.c", password: "Pass@1234", role: "front-desk", assignedCounterId: "ctr-2", status: "active", createdAt: "2024-03-15T00:00:00.000Z" },
  { id: "u-4", name: "Dr. Emily Wong", loginId: "dr.emily", password: "Doc@5678", role: "doctor", assignedCounterId: "ctr-3", status: "active", createdAt: "2024-04-01T00:00:00.000Z" },
  { id: "u-5", name: "Dr. James Wilson", loginId: "dr.james", password: "Doc@5678", role: "doctor", assignedCounterId: "ctr-4", status: "inactive", createdAt: "2024-04-05T00:00:00.000Z" },
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}
function getCounterName(id: string) {
  return COUNTERS.find(c => c.id === id)?.name ?? "—";
}

const AVATAR_COLORS = ["#4982CF","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#f97316"];

export function UsersManagementModule() {
  const [users, setUsers] = useState<SystemUser[]>(SEED_USERS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SystemUser, "id" | "createdAt">>(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const filtered = users.filter(u => roleFilter === "all" || u.role === roleFilter);

  function openAdd() { setForm(BLANK); setErrors({}); setShowPw(false); setEditingId(null); setShowForm(true); }
  function openEdit(u: SystemUser) {
    setForm({ name: u.name, loginId: u.loginId, password: u.password, role: u.role, assignedCounterId: u.assignedCounterId, status: u.status });
    setErrors({}); setShowPw(false); setEditingId(u.id); setShowForm(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.loginId.trim()) errs.loginId = "Login ID is required.";
    else {
      const dup = users.find(u => u.loginId === form.loginId.trim() && u.id !== editingId);
      if (dup) errs.loginId = "Login ID must be unique.";
    }
    if (!editingId && !form.password.trim()) errs.password = "Password is required.";
    if (form.password && form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    return errs;
  }

  function save() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (editingId) {
      setUsers(p => p.map(u => u.id === editingId ? { ...u, ...form } : u));
    } else {
      setUsers(p => [...p, { ...form, id: `u-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
  }

  const roleMeta = (role: UserRole) => ROLE_META[role];
  const avatarColor = (id: string) => AVATAR_COLORS[parseInt(id.replace(/\D/g, "")) % AVATAR_COLORS.length];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users & Counter Mapping</h1>
          <p className="mt-1 text-sm text-slate-500">Manage system users, roles, login credentials, and counter assignments.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2">
          <Plus className="h-4 w-4" />Add User
        </Button>
      </div>

      {/* Filters + summary */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(["all", "admin", "front-desk", "doctor"] as const).map(f => (
            <button key={f} onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors
                ${roleFilter === f ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
              {f === "all" ? "All" : ROLE_META[f as UserRole].label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { role: "admin" as const, icon: "🛡️" },
          { role: "front-desk" as const, icon: "🪪" },
          { role: "doctor" as const, icon: "🩺" },
        ]).map(({ role, icon }) => {
          const meta = ROLE_META[role];
          const count = users.filter(u => u.role === role).length;
          const active = users.filter(u => u.role === role && u.status === "active").length;
          return (
            <div key={role} className={`rounded-xl border p-4 ${meta.bg} ${meta.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{icon}</span>
                <p className={`text-xs font-bold ${meta.color}`}>{meta.label}s</p>
              </div>
              <p className={`text-3xl font-black ${meta.color}`}>{count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{active} active</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="grid border-b border-slate-100 bg-slate-50/80 px-5 py-2.5"
          style={{ gridTemplateColumns: "2fr 120px 140px 160px 100px 100px" }}>
          {["User", "Role", "Login ID", "Assigned Counter", "Status", "Joined"].map(h => (
            <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Users className="h-8 w-8 opacity-20 mb-2" />
            <p className="text-sm text-slate-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(u => {
              const meta = roleMeta(u.role);
              return (
                <div key={u.id} className="grid items-center px-5 py-3.5 hover:bg-slate-50 group transition-colors"
                  style={{ gridTemplateColumns: "2fr 120px 140px 160px 100px 100px" }}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: avatarColor(u.id) }}>{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] w-fit ${meta.color} ${meta.bg} ${meta.border}`}>{meta.label}</Badge>
                  <span className="font-mono text-xs text-slate-600">{u.loginId}</span>
                  <span className="text-xs text-slate-600 truncate">{u.assignedCounterId ? getCounterName(u.assignedCounterId) : <span className="text-slate-300">—</span>}</span>
                  <div className="flex items-center gap-1.5">
                    <Switch checked={u.status === "active"}
                      onCheckedChange={v => setUsers(p => p.map(x => x.id === u.id ? { ...x, status: v ? "active" : "inactive" } : x))}
                      className="data-[state=checked]:bg-emerald-500 scale-75" />
                    <span className={`text-xs font-medium ${u.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                      {u.status === "active" ? "Active" : "Off"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{fmtDate(u.createdAt)}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(u.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={showForm} onOpenChange={v => !v && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Full Name <span className="text-rose-500">*</span></Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ayesha Khan" className="h-9 text-sm" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Login ID <span className="text-rose-500">*</span></Label>
                <Input value={form.loginId} onChange={e => setForm(p => ({ ...p, loginId: e.target.value }))} placeholder="e.g. ayesha.k" className="h-9 text-sm font-mono" />
                {errors.loginId && <p className="text-xs text-rose-500">{errors.loginId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Password {!editingId && <span className="text-rose-500">*</span>}</Label>
                <div className="relative">
                  <Input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} type={showPw ? "text" : "password"} placeholder={editingId ? "Leave blank to keep" : "Min. 6 characters"} className="h-9 text-sm pr-9" />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-500">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Role</Label>
                <Select value={form.role} onValueChange={(v: UserRole) => setForm(p => ({ ...p, role: v, assignedCounterId: v === "admin" ? "" : p.assignedCounterId }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="front-desk">Front Desk</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Assigned Counter</Label>
                <Select value={form.assignedCounterId || "none"} onValueChange={v => setForm(p => ({ ...p, assignedCounterId: v === "none" ? "" : v }))} disabled={form.role === "admin"}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {COUNTERS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.role === "admin" && <p className="text-[10px] text-slate-400">Admins are not assigned to counters.</p>}
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch checked={form.status === "active"} onCheckedChange={v => setForm(p => ({ ...p, status: v ? "active" : "inactive" }))} className="data-[state=checked]:bg-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-600">Active</p>
                  <p className="text-[11px] text-slate-400">Inactive users cannot log in. One active session per user is enforced.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-9 text-sm">Cancel</Button>
              <Button onClick={save} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm gap-2">
                <Check className="h-4 w-4" />{editingId ? "Save Changes" : "Add User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-rose-600"><AlertCircle className="h-5 w-5" />Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 mt-1">Delete <strong>{users.find(u => u.id === deleteId)?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="h-8 text-sm">Cancel</Button>
            <Button onClick={() => { setUsers(p => p.filter(u => u.id !== deleteId)); setDeleteId(null); }} className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-sm gap-2"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
