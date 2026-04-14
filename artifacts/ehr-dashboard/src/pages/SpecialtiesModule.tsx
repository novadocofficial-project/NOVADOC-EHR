import { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Department, Specialty } from "@/pages/AdminSettings";

type Props = {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
};

type AddingState = {
  deptId: string;
  name: string;
  description: string;
} | null;

type EditingState = {
  deptId: string;
  specId: string;
  name: string;
} | null;

export function SpecialtiesModule({ departments, setDepartments }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(departments.map(d => [d.id, true]))
  );
  const [adding, setAdding] = useState<AddingState>(null);
  const [editing, setEditing] = useState<EditingState>(null);

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const startAdding = (deptId: string) =>
    setAdding({ deptId, name: "", description: "" });

  const cancelAdding = () => setAdding(null);

  const saveSpecialty = () => {
    if (!adding || !adding.name.trim()) return;
    setDepartments(prev => prev.map(d =>
      d.id === adding.deptId
        ? {
            ...d,
            specialties: [
              ...d.specialties,
              { id: `sp-${Date.now()}`, name: adding.name.trim(), description: adding.description.trim(), active: true },
            ],
          }
        : d
    ));
    setAdding(null);
  };

  const startEdit = (deptId: string, spec: Specialty) =>
    setEditing({ deptId, specId: spec.id, name: spec.name });

  const saveEdit = () => {
    if (!editing || !editing.name.trim()) { setEditing(null); return; }
    setDepartments(prev => prev.map(d =>
      d.id === editing.deptId
        ? { ...d, specialties: d.specialties.map(s => s.id === editing.specId ? { ...s, name: editing.name.trim() } : s) }
        : d
    ));
    setEditing(null);
  };

  const toggleSpecialty = (deptId: string, specId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId
        ? { ...d, specialties: d.specialties.map(s => s.id === specId ? { ...s, active: !s.active } : s) }
        : d
    ));

  const deleteSpecialty = (deptId: string, specId: string) =>
    setDepartments(prev => prev.map(d =>
      d.id === deptId
        ? { ...d, specialties: d.specialties.filter(s => s.id !== specId) }
        : d
    ));

  const totalSpecialties = departments.reduce((sum, d) => sum + d.specialties.length, 0);
  const activeSpecialties = departments.reduce((sum, d) => sum + d.specialties.filter(s => s.active).length, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Specialties</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage medical specialties within each department.
            <span className="ml-2 font-medium text-slate-700">{activeSpecialties} active</span>
            <span className="mx-1 text-slate-300">/</span>
            <span className="font-medium text-slate-700">{totalSpecialties} total</span>
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Specialties", value: totalSpecialties, color: "text-slate-700" },
          { label: "Active", value: activeSpecialties, color: "text-emerald-700" },
          { label: "Inactive", value: totalSpecialties - activeSpecialties, color: "text-amber-700" },
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
          const isAddingHere = adding?.deptId === dept.id;
          const activeCount = dept.specialties.filter(s => s.active).length;

          return (
            <Collapsible
              key={dept.id}
              open={isOpen}
              onOpenChange={() => toggleExpand(dept.id)}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Department header */}
              <div className="flex items-center gap-3 p-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-none text-slate-400 hover:text-slate-600">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>

                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <span className="font-bold text-slate-800">{dept.name}</span>
                  <Badge className={dept.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-amber-500/10 text-amber-700 border-amber-200"}>
                    {dept.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {dept.specialties.length} specialt{dept.specialties.length !== 1 ? "ies" : "y"}
                    {dept.specialties.length > 0 && (
                      <> · <span className="text-emerald-600">{activeCount} active</span></>
                    )}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none border-dashed border-[#4982CF]/40 text-[#4982CF] hover:bg-[#4982CF]/5 hover:border-[#4982CF]/60"
                  onClick={e => { e.stopPropagation(); startAdding(dept.id); setExpanded(prev => ({ ...prev, [dept.id]: true })); }}
                  data-testid={`btn-add-specialty-${dept.id}`}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Specialty
                </Button>
              </div>

              <CollapsibleContent>
                <div className="border-t border-slate-100 bg-slate-50/60">
                  {/* Specialty list */}
                  {dept.specialties.length === 0 && !isAddingHere ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Sparkles className="mb-2 h-7 w-7 opacity-40" />
                      <p className="text-sm">No specialties added yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-[#4982CF]"
                        onClick={() => startAdding(dept.id)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add first specialty
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {dept.specialties.map(spec => {
                        const isEditing = editing?.deptId === dept.id && editing?.specId === spec.id;
                        return (
                          <div
                            key={spec.id}
                            className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/70 transition-colors"
                            data-testid={`specialty-row-${spec.id}`}
                          >
                            {/* Color accent dot */}
                            <div className={`mt-1 h-2 w-2 flex-none rounded-full ${spec.active ? "bg-emerald-500" : "bg-slate-300"}`} />

                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    autoFocus
                                    className="h-8 w-64 text-sm"
                                    value={editing.name}
                                    onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    onKeyDown={e => e.key === "Enter" && saveEdit()}
                                    onBlur={saveEdit}
                                  />
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" onClick={() => setEditing(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="text-sm font-semibold text-slate-800">{spec.name}</span>
                                  <Badge
                                    variant="outline"
                                    className={spec.active
                                      ? "text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px]"
                                      : "text-amber-600 border-amber-200 bg-amber-50 text-[10px]"}
                                  >
                                    {spec.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              )}
                              {!isEditing && spec.description && (
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{spec.description}</p>
                              )}
                            </div>

                            <div className="flex flex-none items-center gap-2">
                              <Switch
                                checked={spec.active}
                                onCheckedChange={() => toggleSpecialty(dept.id, spec.id)}
                                className="scale-75"
                                data-testid={`toggle-specialty-${spec.id}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:bg-[#4982CF]/10 hover:text-[#4982CF]"
                                onClick={() => startEdit(dept.id, spec)}
                                data-testid={`btn-edit-specialty-${spec.id}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => deleteSpecialty(dept.id, spec.id)}
                                data-testid={`btn-delete-specialty-${spec.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline add form */}
                  {isAddingHere && (
                    <div className="border-t border-dashed border-[#4982CF]/20 bg-[#4982CF]/5 px-5 py-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#4982CF]">New Specialty for {dept.name}</p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">Specialty Name <span className="text-rose-500">*</span></label>
                          <Input
                            autoFocus
                            placeholder="e.g. Interventional Cardiology, Sports Medicine..."
                            className="h-9 bg-white"
                            value={adding.name}
                            onChange={e => setAdding(prev => prev ? { ...prev, name: e.target.value } : null)}
                            onKeyDown={e => e.key === "Enter" && saveSpecialty()}
                            data-testid="input-specialty-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">Brief Description</label>
                          <Textarea
                            placeholder="Short description of what this specialty covers..."
                            className="resize-none bg-white text-sm"
                            rows={2}
                            value={adding.description}
                            onChange={e => setAdding(prev => prev ? { ...prev, description: e.target.value } : null)}
                            data-testid="input-specialty-description"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="bg-[#4982CF] text-white hover:bg-[#3D73BC]"
                            size="sm"
                            disabled={!adding.name.trim()}
                            onClick={saveSpecialty}
                            data-testid="btn-save-specialty"
                          >
                            Save Specialty
                          </Button>
                          <Button variant="outline" size="sm" className="border-slate-200" onClick={cancelAdding}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
