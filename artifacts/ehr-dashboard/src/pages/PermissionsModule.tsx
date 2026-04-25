import { useState } from "react";
import {
  Shield, Lock, Save, CheckCircle2, Info, ChevronDown, ChevronRight,
  UserCheck, FileSignature, Clock, AlertTriangle, ToggleLeft, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#4982CF";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Admin" | "Senior Doctor" | "Doctor" | "Nurse" | "Front Desk" | "Billing";
type NoteType = "SOAP Note" | "Referral" | "Lab Order" | "Procedure Order" | "Prescription" | "Sick Leave";
type Permission = "view" | "create" | "edit" | "sign" | "cosign" | "void";

interface RoleAccess {
  role:      Role;
  noteType:  NoteType;
  perms:     Set<Permission>;
}

interface SigningRule {
  noteType:          NoteType;
  signers:           Role[];
  cosigners:         Role[];
  cosignRequired:    boolean;
  discardAfterSign:  boolean;
  autoLockHours:     number | null;
  customConditions:  boolean;
  customNote:        string;
}

// ─── Seeds ────────────────────────────────────────────────────────────────────

const ROLES: Role[] = ["Admin","Senior Doctor","Doctor","Nurse","Front Desk","Billing"];
const NOTE_TYPES: NoteType[] = ["SOAP Note","Referral","Lab Order","Procedure Order","Prescription","Sick Leave"];
const ALL_PERMS: Permission[] = ["view","create","edit","sign","cosign","void"];

const PERM_LABELS: Record<Permission, string> = {
  view: "View", create: "Create", edit: "Edit", sign: "Sign", cosign: "Co-sign", void: "Void",
};

const ROLE_COLORS: Record<Role, string> = {
  Admin:           "#4982CF",
  "Senior Doctor": "#7c3aed",
  Doctor:          "#10b981",
  Nurse:           "#f97316",
  "Front Desk":    "#0ea5e9",
  Billing:         "#f59e0b",
};

function initAccess(): RoleAccess[] {
  const rows: RoleAccess[] = [];
  for (const role of ROLES) {
    for (const noteType of NOTE_TYPES) {
      const perms: Set<Permission> = new Set();
      if (role === "Admin") { ALL_PERMS.forEach(p => perms.add(p)); }
      else if (role === "Senior Doctor") { (["view","create","edit","sign","cosign"] as Permission[]).forEach(p => perms.add(p)); }
      else if (role === "Doctor") {
        (["view","create","edit","sign"] as Permission[]).forEach(p => perms.add(p));
        if (noteType === "Sick Leave" || noteType === "Referral") perms.add("cosign");
      }
      else if (role === "Nurse") { (["view","create","edit"] as Permission[]).forEach(p => perms.add(p)); }
      else if (role === "Front Desk") { (["view"] as Permission[]).forEach(p => perms.add(p)); }
      else if (role === "Billing") { (["view"] as Permission[]).forEach(p => perms.add(p)); }
      rows.push({ role, noteType, perms });
    }
  }
  return rows;
}

function initSigningRules(): SigningRule[] {
  return NOTE_TYPES.map(nt => ({
    noteType:         nt,
    signers:          nt === "SOAP Note" || nt === "Prescription" ? ["Doctor","Senior Doctor"] : ["Doctor","Senior Doctor","Admin"],
    cosigners:        ["Senior Doctor","Admin"],
    cosignRequired:   nt === "Referral" || nt === "Sick Leave",
    discardAfterSign: false,
    autoLockHours:    nt === "SOAP Note" ? 24 : null,
    customConditions: false,
    customNote:       "",
  }));
}

// ─── Role Access Matrix ───────────────────────────────────────────────────────

function RoleAccessTab() {
  const [access, setAccess]     = useState<RoleAccess[]>(initAccess);
  const [filterRole, setFilterRole] = useState<Role | "All">("All");
  const [expandedNote, setExpandedNote] = useState<NoteType | null>("SOAP Note");
  const [saved, setSaved]       = useState(false);

  function togglePerm(role: Role, noteType: NoteType, perm: Permission) {
    setAccess(prev => prev.map(r => {
      if (r.role !== role || r.noteType !== noteType) return r;
      const next = new Set(r.perms);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return { ...r, perms: next };
    }));
  }

  function getRow(role: Role, noteType: NoteType) {
    return access.find(r => r.role === role && r.noteType === noteType);
  }

  const visibleRoles = filterRole === "All" ? ROLES : [filterRole];

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
        <Users className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-600">Filter by role:</span>
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...ROLES] as (Role | "All")[]).map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterRole === r ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
              style={filterRole === r ? { background: r === "All" ? ACCENT : ROLE_COLORS[r as Role] } : {}}>
              {r}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={handleSave} style={{ background: ACCENT }}
          className="text-white text-xs gap-1.5 ml-auto">
          {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {NOTE_TYPES.map(noteType => {
          const isExp = expandedNote === noteType;
          return (
            <div key={noteType} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setExpandedNote(isExp ? null : noteType)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                <FileSignature className="h-4 w-4 text-slate-400" />
                <span className="flex-1 font-medium text-sm text-slate-700">{noteType}</span>
                {isExp ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {isExp && (
                <div className="border-t border-slate-100 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-2 font-semibold text-slate-600 w-36">Role</th>
                        {ALL_PERMS.map(p => (
                          <th key={p} className="px-3 py-2 text-center font-semibold text-slate-600">{PERM_LABELS[p]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleRoles.map(role => {
                        const row = getRow(role, noteType);
                        return (
                          <tr key={role} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[role] }} />
                                {role}
                              </span>
                            </td>
                            {ALL_PERMS.map(perm => (
                              <td key={perm} className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={row?.perms.has(perm) ?? false}
                                  onChange={() => togglePerm(role, noteType, perm)}
                                  className="rounded cursor-pointer"
                                  style={{ accentColor: ACCENT }}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Signing Rules Tab ────────────────────────────────────────────────────────

function SigningRulesTab() {
  const [rules, setRules]   = useState<SigningRule[]>(initSigningRules);
  const [expanded, setExpanded] = useState<NoteType | null>("SOAP Note");
  const [saved, setSaved]   = useState(false);

  function update(noteType: NoteType, fn: (r: SigningRule) => SigningRule) {
    setRules(prev => prev.map(r => r.noteType === noteType ? fn(r) : r));
  }

  function toggleRole(noteType: NoteType, field: "signers" | "cosigners", role: Role) {
    update(noteType, r => ({
      ...r,
      [field]: r[field].includes(role) ? r[field].filter(x => x !== role) : [...r[field], role],
    }));
  }

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="h-3.5 w-3.5" />
          Configure who can sign or co-sign each note type, and set auto-lock rules.
        </div>
        <Button size="sm" onClick={handleSave} style={{ background: ACCENT }} className="text-white text-xs gap-1.5">
          {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save Rules"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {rules.map(rule => {
          const isExp = expanded === rule.noteType;
          return (
            <div key={rule.noteType} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setExpanded(isExp ? null : rule.noteType)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                <FileSignature className="h-4 w-4 text-slate-400" />
                <span className="flex-1 font-medium text-sm text-slate-700">{rule.noteType}</span>
                <div className="flex gap-1.5 mr-2">
                  {rule.cosignRequired && (
                    <Badge className="text-[10px] px-1.5 py-0 text-white" style={{ background: "#8b5cf6" }}>Co-sign required</Badge>
                  )}
                  {rule.autoLockHours && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">Auto-lock {rule.autoLockHours}h</Badge>
                  )}
                </div>
                {isExp ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {isExp && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-5">
                  {/* Signers */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" /> Who Can Sign
                    </label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ROLES.map(role => {
                        const sel = rule.signers.includes(role);
                        return (
                          <button key={role} onClick={() => toggleRole(rule.noteType, "signers", role)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              sel ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                            style={sel ? { background: ROLE_COLORS[role] } : {}}>
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Co-signers */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Who Can Co-sign
                    </label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ROLES.map(role => {
                        const sel = rule.cosigners.includes(role);
                        return (
                          <button key={role} onClick={() => toggleRole(rule.noteType, "cosigners", role)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              sel ? "text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                            }`}
                            style={sel ? { background: ROLE_COLORS[role] } : {}}>
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <div>
                        <p className="text-xs font-medium text-slate-700">Co-signature Required</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Note cannot be finalised without a co-sign</p>
                      </div>
                      <Switch checked={rule.cosignRequired}
                        onCheckedChange={v => update(rule.noteType, r => ({ ...r, cosignRequired: v }))} />
                    </div>

                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <div>
                        <p className="text-xs font-medium text-slate-700">Discard After Signing</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Draft deleted once note is signed</p>
                      </div>
                      <Switch checked={rule.discardAfterSign}
                        onCheckedChange={v => update(rule.noteType, r => ({ ...r, discardAfterSign: v }))} />
                    </div>

                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <div>
                        <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Auto-lock
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Lock note for editing after N hours</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={168}
                          placeholder="—"
                          value={rule.autoLockHours ?? ""}
                          onChange={e => update(rule.noteType, r => ({
                            ...r,
                            autoLockHours: e.target.value ? Number(e.target.value) : null,
                          }))}
                          className="w-14 h-7 text-xs border border-slate-200 rounded px-2 bg-white text-right"
                        />
                        <span className="text-[10px] text-slate-500">hrs</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <div>
                        <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                          <ToggleLeft className="h-3 w-3" /> Custom Conditions
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Enable manual condition override note</p>
                      </div>
                      <Switch checked={rule.customConditions}
                        onCheckedChange={v => update(rule.noteType, r => ({ ...r, customConditions: v }))} />
                    </div>
                  </div>

                  {/* Custom condition note */}
                  {rule.customConditions && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-amber-500" /> Custom Condition Note
                      </label>
                      <textarea
                        value={rule.customNote}
                        onChange={e => update(rule.noteType, r => ({ ...r, customNote: e.target.value }))}
                        placeholder="Describe the custom signing condition…"
                        rows={2}
                        className="w-full text-xs border border-slate-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

type TabKey = "role-access" | "signing-rules";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "role-access",    label: "Role Access",    icon: <Shield className="h-3.5 w-3.5" /> },
  { key: "signing-rules",  label: "Signing Rules",  icon: <Lock className="h-3.5 w-3.5" /> },
];

interface Props { initialTab?: TabKey; }

export function PermissionsModule({ initialTab = "role-access" }: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Shield className="h-5 w-5" style={{ color: ACCENT }} />
          Permissions & Signing Rules
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Control role-based access and note signing policies</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            style={tab === t.key ? { borderColor: ACCENT, color: ACCENT } : {}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "role-access"   && <RoleAccessTab />}
        {tab === "signing-rules" && <SigningRulesTab />}
      </div>
    </div>
  );
}
