import { useState } from "react";
import { Edit2, Trash2, Tag, ToggleLeft, ToggleRight, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ServiceType } from "@/pages/BillingTypes";

export function ServiceTypesModule({
  serviceTypes,
  setServiceTypes,
}: {
  serviceTypes: ServiceType[];
  setServiceTypes: React.Dispatch<React.SetStateAction<ServiceType[]>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openEdit = (st: ServiceType) => {
    setFormName(st.name);
    setEditingId(st.id);
    setShowForm(true);
  };

  const saveForm = () => {
    const name = formName.trim();
    if (!name) return;
    if (editingId) {
      setServiceTypes(prev => prev.map(st => st.id === editingId ? { ...st, name } : st));
    } else {
      const newST: ServiceType = {
        id: `st-${Date.now()}`,
        name,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setServiceTypes(prev => [...prev, newST]);
    }
    setShowForm(false);
  };

  const toggleActive = (id: string) => {
    setServiceTypes(prev => prev.map(st => st.id === id ? { ...st, active: !st.active } : st));
  };

  const deleteType = (id: string) => {
    setServiceTypes(prev => prev.filter(st => st.id !== id));
    setDeleteConfirm(null);
  };

  const activeCount = serviceTypes.filter(st => st.active).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service Types</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage service categories used across pricing and billing modules.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Types", value: serviceTypes.length, color: "text-slate-700" },
          { label: "Active", value: activeCount, color: "text-emerald-600" },
          { label: "Inactive", value: serviceTypes.length - activeCount, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {serviceTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Tag className="mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No service types yet</p>
            <p className="mt-1 text-xs">Click "Add Service Type" to get started.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_160px_120px_100px] items-center border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Service Type</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {serviceTypes.map(st => (
                <div key={st.id} className="grid grid-cols-[1fr_160px_120px_100px] items-center px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4982CF]/10">
                      <Tag className="h-3.5 w-3.5 text-[#4982CF]" />
                    </div>
                    <span className="font-semibold text-slate-800">{st.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(st.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={st.active}
                      onCheckedChange={() => toggleActive(st.id)}
                      className="data-[state=checked]:bg-[#4982CF]"
                    />
                    <Badge className={st.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]" : "bg-amber-500/10 text-amber-700 border-amber-200 text-[10px]"}>
                      {st.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(st)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#4982CF] transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(st.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => !open && setShowForm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service Type" : "Add Service Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Service Type Name <span className="text-rose-500">*</span></Label>
              <Input
                placeholder="e.g. Consultation, Lab, Procedures…"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveForm()}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                onClick={saveForm}
                disabled={!formName.trim()}
                className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white"
              >
                {editingId ? "Save Changes" : "Add Type"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Service Type?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will remove <strong>{serviceTypes.find(st => st.id === deleteConfirm)?.name}</strong> from service types.
            Services using this type won't be deleted but may need reassignment.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              onClick={() => deleteType(deleteConfirm!)}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
