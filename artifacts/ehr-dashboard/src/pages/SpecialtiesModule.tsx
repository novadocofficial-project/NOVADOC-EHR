import { useState } from "react";
import {
  ChevronDown, ChevronUp, Edit2, Plus, Sparkles, Trash2, X,
  Building2, LayoutGrid, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Department, Specialty } from "@/pages/AdminSettings";

type Props = {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
};

type DialogState = {
  open: boolean;
  level: "department" | "subdepartment" | null;
  deptId: string;
  subDeptId: string;
  name: string;
  description: string;
};

const BLANK_DIALOG: DialogState = {
  open: false, level: null, deptId: "", subDeptId: "", name: "", description: "",
};

type EditingState = {
  context: "dept" | "subdept";
  deptId: string;
  subDeptId?: string;
  specId: string;
  name: string;
} | null;

export function SpecialtiesModule({ departments, setDepartments }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(departments.map(d => [d.id, true]))
  );
  const [dialog, setDialog] = useState<DialogState>(BLANK_DIALOG);
  const [editing, setEditing] = useState<EditingState>(null);

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Dialog helpers ──────────────────────────────────────────────────────────
  const openDialog = (preset?: Partial<DialogState>) =>
    setDialog({ ...BLANK_DIALOG, open: true, ...preset });

  const closeDialog = () => setDialog(BLANK_DIALOG);

  const selectedDept    = departments.find(d => d.id === dialog.deptId);
  const selectedSubDept = selectedDept?.subDepartments.find(s => s.id === dialog.subDeptId);

  const canSave = dialog.name.trim() &&
    dialog.level !== null &&
    dialog.deptId !== "" &&
    (dialog.level === "department" || dialog.subDeptId !== "");

  const saveSpecialty = () => {
    if (!canSave) return;
    const newSpec: Specialty = {
      id: `sp-${Date.now()}`, name: dialog.name.trim(),
      description: dialog.description.trim(), active: true,
    };

    if (dialog.level === "department") {
      setDepartments(prev => prev.map(d =>
        d.id === dialog.deptId
          ? { ...d, specialties: [...d.specialties, newSpec] }
          : d
      ));
    } else {
      setDepartments(prev => prev.map(d =>
        d.id === dialog.deptId
          ? {
              ...d,
              subDepartments: d.subDepartments.map(s =>
                s.id === dialog.subDeptId
                  ? { ...s, specialties: [...(s.specialties ?? []), newSpec] }
                  : s
              ),
            }
          : d
      ));
    }
    closeDialog();
  };

  // ── Edit helpers ────────────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editing || !editing.name.trim()) { setEditing(null); return; }

    if (editing.context === "dept") {
      setDepartments(prev => prev.map(d =>
        d.id === editing.deptId
          ? { ...d, specialties: d.specialties.map(s => s.id === editing.specId ? { ...s, name: editing.name.trim() } : s) }
          : d
      ));
    } else {
      setDepartments(prev => prev.map(d =>
        d.id === editing.deptId
          ? {
              ...d,
              subDepartments: d.subDepartments.map(sd =>
                sd.id === editing.subDeptId
                  ? { ...sd, specialties: (sd.specialties ?? []).map(s => s.id === editing.specId ? { ...s, name: editing.name.trim() } : s) }
                  : sd
              ),
            }
          : d
      ));
    }
    setEditing(null);
  };

  // ── Toggle helpers ──────────────────────────────────────────────────────────
  const toggleDeptSpecialty = (deptId: string, specId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId
        ? { ...d, specialties: d.specialties.map(s => s.id === specId ? { ...s, active: !s.active } : s) }
        : d
    ));

  const toggleSubSpecialty = (deptId: string, subDeptId: string, specId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId
        ? {
            ...d,
            subDepartments: d.subDepartments.map(sd =>
              sd.id === subDeptId
                ? { ...sd, specialties: (sd.specialties ?? []).map(s => s.id === specId ? { ...s, active: !s.active } : s) }
                : sd
            ),
          }
        : d
    ));

  // ── Delete helpers ──────────────────────────────────────────────────────────
  const deleteDeptSpecialty = (deptId: string, specId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId
        ? { ...d, specialties: d.specialties.filter(s => s.id !== specId) }
        : d
    ));

  const deleteSubSpecialty = (deptId: string, subDeptId: string, specId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId
        ? {
            ...d,
            subDepartments: d.subDepartments.map(sd =>
              sd.id === subDeptId
                ? { ...sd, specialties: (sd.specialties ?? []).filter(s => s.id !== specId) }
                : sd
            ),
          }
        : d
    ));

  // ── Stats ───────────────────────────────────────────────────────────────────
  const deptTotal  = departments.reduce((sum, d) => sum + d.specialties.length, 0);
  const subTotal   = departments.reduce((sum, d) => sum + d.subDepartments.reduce((s2, sd) => s2 + (sd.specialties?.length ?? 0), 0), 0);
  const totalSpecialties = deptTotal + subTotal;
  const activeSpecialties = departments.reduce((sum, d) =>
    sum + d.specialties.filter(s => s.active).length +
    d.subDepartments.reduce((s2, sd) => s2 + (sd.specialties ?? []).filter(s => s.active).length, 0), 0);

  // ── Specialty row renderer ──────────────────────────────────────────────────
  function SpecRow({
    spec, indent,
    onToggle, onEdit, onDelete,
    isEditing, editName, onEditNameChange, onSaveEdit, onCancelEdit,
  }: {
    spec: Specialty; indent?: boolean;
    onToggle: () => void; onEdit: () => void; onDelete: () => void;
    isEditing: boolean; editName: string;
    onEditNameChange: (v: string) => void; onSaveEdit: () => void; onCancelEdit: () => void;
  }) {
    return (
      <div className={`flex items-start gap-3 px-4 py-3 hover:bg-white/70 transition-colors ${indent ? "pl-8 border-l-2 border-[#4982CF]/10 ml-4" : "px-5"}`}>
        <div className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${spec.active ? "bg-emerald-500" : "bg-slate-300"}`} />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input autoFocus className="h-8 w-64 text-sm" value={editName}
                onChange={e => onEditNameChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSaveEdit()}
                onBlur={onSaveEdit} />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={onCancelEdit}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">{spec.name}</span>
              <Badge variant="outline" className={spec.active
                ? "text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px]"
                : "text-amber-600 border-amber-200 bg-amber-50 text-[10px]"}>
                {spec.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          )}
          {!isEditing && spec.description && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{spec.description}</p>
          )}
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <Switch checked={spec.active} onCheckedChange={onToggle} className="scale-75 data-[state=checked]:bg-[#4982CF]" />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-[#4982CF]/10 hover:text-[#4982CF]" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Specialties</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage medical specialties at department or sub-department level.
            <span className="ml-2 font-medium text-slate-700">{activeSpecialties} active</span>
            <span className="mx-1 text-slate-300">/</span>
            <span className="font-medium text-slate-700">{totalSpecialties} total</span>
          </p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white gap-2 h-9 text-sm"
        >
          <Plus className="h-4 w-4" />Add Specialty
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total",              value: totalSpecialties,              color: "text-slate-700" },
          { label: "Active",             value: activeSpecialties,             color: "text-emerald-700" },
          { label: "Inactive",           value: totalSpecialties - activeSpecialties, color: "text-amber-700" },
          { label: "Sub-Dept Assigned",  value: subTotal,                      color: "text-[#4982CF]" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Department sections */}
      <div className="space-y-3">
        {departments.map(dept => {
          const isOpen = !!expanded[dept.id];
          const deptSpecCount = dept.specialties.length;
          const subSpecCount  = dept.subDepartments.reduce((s, sd) => s + (sd.specialties?.length ?? 0), 0);
          const totalCount    = deptSpecCount + subSpecCount;

          return (
            <Collapsible key={dept.id} open={isOpen} onOpenChange={() => toggleExpand(dept.id)}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              {/* Department header */}
              <div className="flex items-center gap-3 p-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-none text-slate-400 hover:text-slate-600">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>

                <Building2 className="h-4 w-4 text-slate-400 flex-none" />

                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <span className="font-bold text-slate-800">{dept.name}</span>
                  <Badge className={dept.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-amber-500/10 text-amber-700 border-amber-200"}>
                    {dept.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {totalCount} specialt{totalCount !== 1 ? "ies" : "y"}
                    {deptSpecCount > 0 && <span className="text-slate-300"> · {deptSpecCount} dept-level</span>}
                    {subSpecCount > 0 && <span className="text-[#4982CF]/70"> · {subSpecCount} sub-dept</span>}
                  </span>
                </div>

                {/* Quick-add buttons */}
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm"
                    className="flex-none border-dashed border-slate-300 text-slate-500 hover:border-[#4982CF]/50 hover:text-[#4982CF] text-xs h-7 px-2.5"
                    onClick={e => { e.stopPropagation(); openDialog({ level: "department", deptId: dept.id }); }}>
                    <Building2 className="h-3 w-3 mr-1" />Dept
                  </Button>
                  <Button variant="outline" size="sm"
                    className="flex-none border-dashed border-slate-300 text-slate-500 hover:border-[#4982CF]/50 hover:text-[#4982CF] text-xs h-7 px-2.5"
                    onClick={e => { e.stopPropagation(); openDialog({ level: "subdepartment", deptId: dept.id }); }}>
                    <LayoutGrid className="h-3 w-3 mr-1" />Sub-Dept
                  </Button>
                </div>
              </div>

              <CollapsibleContent>
                <div className="border-t border-slate-100 bg-slate-50/40">

                  {totalCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Sparkles className="mb-2 h-7 w-7 opacity-30" />
                      <p className="text-sm">No specialties added yet</p>
                      <Button variant="ghost" size="sm" className="mt-2 text-[#4982CF]"
                        onClick={() => openDialog({ level: "department", deptId: dept.id })}>
                        <Plus className="mr-1 h-3.5 w-3.5" />Add first specialty
                      </Button>
                    </div>
                  ) : (
                    <div>

                      {/* ── Department-level specialties ── */}
                      {dept.specialties.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Department Level</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {dept.specialties.map(spec => {
                              const isEditing = editing?.context === "dept" && editing.deptId === dept.id && editing.specId === spec.id;
                              return (
                                <SpecRow
                                  key={spec.id}
                                  spec={spec}
                                  isEditing={isEditing}
                                  editName={isEditing ? editing!.name : ""}
                                  onToggle={() => toggleDeptSpecialty(dept.id, spec.id)}
                                  onEdit={() => setEditing({ context: "dept", deptId: dept.id, specId: spec.id, name: spec.name })}
                                  onDelete={() => deleteDeptSpecialty(dept.id, spec.id)}
                                  onEditNameChange={v => setEditing(prev => prev ? { ...prev, name: v } : null)}
                                  onSaveEdit={saveEdit}
                                  onCancelEdit={() => setEditing(null)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Sub-department specialties ── */}
                      {dept.subDepartments.filter(sd => (sd.specialties?.length ?? 0) > 0).map(sd => (
                        <div key={sd.id}>
                          <div className="flex items-center gap-2 px-5 py-2 border-t border-slate-100 bg-[#4982CF]/3">
                            <LayoutGrid className="h-3.5 w-3.5 text-[#4982CF]/60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4982CF]/70">{sd.name}</span>
                            <span className="ml-auto text-[9px] text-slate-400">{sd.specialties?.length ?? 0} specialt{(sd.specialties?.length ?? 0) !== 1 ? "ies" : "y"}</span>
                            <Button variant="ghost" size="sm"
                              className="h-5 px-1.5 text-[9px] text-[#4982CF] hover:bg-[#4982CF]/10"
                              onClick={() => openDialog({ level: "subdepartment", deptId: dept.id, subDeptId: sd.id })}>
                              <Plus className="h-2.5 w-2.5 mr-0.5" />Add
                            </Button>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {(sd.specialties ?? []).map(spec => {
                              const isEditing = editing?.context === "subdept" && editing.deptId === dept.id && editing.subDeptId === sd.id && editing.specId === spec.id;
                              return (
                                <SpecRow
                                  key={spec.id}
                                  spec={spec}
                                  indent
                                  isEditing={isEditing}
                                  editName={isEditing ? editing!.name : ""}
                                  onToggle={() => toggleSubSpecialty(dept.id, sd.id, spec.id)}
                                  onEdit={() => setEditing({ context: "subdept", deptId: dept.id, subDeptId: sd.id, specId: spec.id, name: spec.name })}
                                  onDelete={() => deleteSubSpecialty(dept.id, sd.id, spec.id)}
                                  onEditNameChange={v => setEditing(prev => prev ? { ...prev, name: v } : null)}
                                  onSaveEdit={saveEdit}
                                  onCancelEdit={() => setEditing(null)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* ── Add Specialty Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialog.open} onOpenChange={v => !v && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#4982CF]" />
              Add Specialty
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-1">

            {/* ── Step 1: Level selection ── */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Where to add?</Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Department level */}
                <button type="button"
                  onClick={() => setDialog(p => ({ ...p, level: "department", subDeptId: "" }))}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all
                    ${dialog.level === "department"
                      ? "border-[#4982CF] bg-[#4982CF]/5 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                  <Building2 className={`h-7 w-7 ${dialog.level === "department" ? "text-[#4982CF]" : "text-slate-400"}`} />
                  <div>
                    <p className={`text-sm font-bold ${dialog.level === "department" ? "text-[#4982CF]" : "text-slate-700"}`}>Department Level</p>
                    <p className="text-xs text-slate-400 mt-0.5">Specialty belongs to the whole department</p>
                  </div>
                </button>

                {/* Sub-department level */}
                <button type="button"
                  onClick={() => setDialog(p => ({ ...p, level: "subdepartment" }))}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all
                    ${dialog.level === "subdepartment"
                      ? "border-[#4982CF] bg-[#4982CF]/5 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                  <LayoutGrid className={`h-7 w-7 ${dialog.level === "subdepartment" ? "text-[#4982CF]" : "text-slate-400"}`} />
                  <div>
                    <p className={`text-sm font-bold ${dialog.level === "subdepartment" ? "text-[#4982CF]" : "text-slate-700"}`}>Sub-Department</p>
                    <p className="text-xs text-slate-400 mt-0.5">Specialty belongs to a specific sub-dept</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Step 2: Department selector ── */}
            {dialog.level !== null && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">
                  Department <span className="text-rose-500">*</span>
                </Label>
                <Select value={dialog.deptId || "_none"} onValueChange={v => setDialog(p => ({ ...p, deptId: v === "_none" ? "" : v, subDeptId: "" }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a department…" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="font-medium">{d.name}</span>
                        <Badge className={`ml-2 text-[9px] ${d.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                          {d.active ? "Active" : "Inactive"}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ── Step 3: Sub-department selector ── */}
            {dialog.level === "subdepartment" && dialog.deptId && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <ArrowRight className="h-3 w-3" />
                  <span>Then select a sub-department</span>
                </div>
                <Label className="text-xs font-semibold text-slate-600">
                  Sub-Department <span className="text-rose-500">*</span>
                </Label>
                <Select value={dialog.subDeptId || "_none"} onValueChange={v => setDialog(p => ({ ...p, subDeptId: v === "_none" ? "" : v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a sub-department…" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDept?.subDepartments.map(sd => (
                      <SelectItem key={sd.id} value={sd.id}>
                        <span>{sd.name}</span>
                        <span className="ml-1.5 text-xs text-slate-400">
                          ({sd.specialties?.length ?? 0} specialt{(sd.specialties?.length ?? 0) !== 1 ? "ies" : "y"})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ── Step 4: Name + description ── */}
            {(dialog.level === "department" && dialog.deptId) ||
             (dialog.level === "subdepartment" && dialog.deptId && dialog.subDeptId) ? (
              <>
                {/* Placement summary */}
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                  {dialog.level === "department"
                    ? <Building2 className="h-3.5 w-3.5 text-[#4982CF]" />
                    : <LayoutGrid className="h-3.5 w-3.5 text-[#4982CF]" />}
                  <span className="text-xs text-slate-600">
                    Adding to <strong>{selectedDept?.name}</strong>
                    {dialog.level === "subdepartment" && selectedSubDept
                      ? <> → <strong>{selectedSubDept.name}</strong></>
                      : " (department level)"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">
                    Specialty Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    autoFocus
                    placeholder="e.g. Interventional Cardiology, Sports Medicine…"
                    className="h-9"
                    value={dialog.name}
                    onChange={e => setDialog(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && canSave && saveSpecialty()}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Brief Description</Label>
                  <Textarea
                    placeholder="Short description of what this specialty covers…"
                    className="resize-none text-sm"
                    rows={2}
                    value={dialog.description}
                    onChange={e => setDialog(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </>
            ) : null}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <Button variant="outline" className="h-9 text-sm" onClick={closeDialog}>Cancel</Button>
              <Button
                className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white h-9 text-sm px-5"
                disabled={!canSave}
                onClick={saveSpecialty}
              >
                Save Specialty
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
