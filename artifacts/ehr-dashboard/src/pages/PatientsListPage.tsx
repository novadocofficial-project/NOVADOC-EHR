import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, Eye, Edit2, Trash2, Users } from "lucide-react";
import { QueueAppHeader } from "@/pages/QueuePageLayout";
import {
  SEED_DOCTORS, SEED_VISIT_TYPES, PATIENT_TYPES, APPOINTMENT_TYPES,
} from "@/pages/QueuePageLayout";
import type { Patient } from "@/pages/QueuePageLayout";
import { usePatients } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditProfileDrawer } from "@/pages/PatientProfile";

const ACCENT = "#4982CF";

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#4982CF", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function genderLabel(g: Patient["gender"]): string {
  return g === "M" ? "Male" : g === "F" ? "Female" : "Other";
}

export function PatientsListPage() {
  const [, navigate] = useLocation();
  const { patients, updatePatient, deletePatient } = usePatients();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [apptTypeFilter, setApptTypeFilter] = useState("");
  const [patientTypeFilter, setPatientTypeFilter] = useState("");
  const [visitFilter, setVisitFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  const doctorMap = useMemo(
    () => Object.fromEntries(SEED_DOCTORS.map(d => [d.id, d.name])),
    [],
  );
  const visitTypeMap = useMemo(
    () => Object.fromEntries(SEED_VISIT_TYPES.map(v => [v.id, v.name])),
    [],
  );

  const filtered = useMemo(() => {
    return patients.filter(p => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matches = p.name.toLowerCase().includes(q)
          || p.mrn.toLowerCase().includes(q)
          || p.phone.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (dateFrom && p.dob < dateFrom) return false;
      if (dateTo && p.dob > dateTo) return false;
      if (doctorFilter && p.preferredDoctorId !== doctorFilter) return false;
      if (apptTypeFilter && p.appointmentType !== apptTypeFilter) return false;
      if (patientTypeFilter && p.patientType !== patientTypeFilter) return false;
      if (visitFilter && p.visitTypeId !== visitFilter) return false;
      if (statusFilter && (p.status ?? "active") !== statusFilter) return false;
      return true;
    });
  }, [patients, search, dateFrom, dateTo, doctorFilter, apptTypeFilter, patientTypeFilter, visitFilter, statusFilter]);

  function handleDeleteConfirm() {
    if (!deletingPatient) return;
    deletePatient(deletingPatient.id);
    toast({ title: "Patient deleted", description: `${deletingPatient.name} has been removed.` });
    setDeletingPatient(null);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <QueueAppHeader />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#4982CF]/10">
            <Users className="h-5 w-5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Patients</h1>
            <p className="text-xs text-slate-400">{filtered.length} of {patients.length} patient records</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name, MR number, or phone number..."
              className="h-9 pl-9 text-sm border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Date From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-sm border-slate-200" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Date To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-sm border-slate-200" />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Consultation</label>
              <Select value={doctorFilter || undefined} onValueChange={v => setDoctorFilter(v)}>
                <SelectTrigger className="h-9 text-sm border-slate-200">
                  <SelectValue placeholder="Select Entry" />
                </SelectTrigger>
                <SelectContent>
                  {SEED_DOCTORS.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Appointment Type</label>
              <Select value={apptTypeFilter || undefined} onValueChange={v => setApptTypeFilter(v)}>
                <SelectTrigger className="h-9 text-sm border-slate-200">
                  <SelectValue placeholder="Select Entry" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Patient Type</label>
              <Select value={patientTypeFilter || undefined} onValueChange={v => setPatientTypeFilter(v)}>
                <SelectTrigger className="h-9 text-sm border-slate-200">
                  <SelectValue placeholder="Select Entry" />
                </SelectTrigger>
                <SelectContent>
                  {PATIENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Visit</label>
              <Select value={visitFilter || undefined} onValueChange={v => setVisitFilter(v)}>
                <SelectTrigger className="h-9 text-sm border-slate-200">
                  <SelectValue placeholder="Select Entry" />
                </SelectTrigger>
                <SelectContent>
                  {SEED_VISIT_TYPES.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Patient Status</label>
              <Select value={statusFilter || undefined} onValueChange={v => setStatusFilter(v)}>
                <SelectTrigger className="h-9 text-sm border-slate-200">
                  <SelectValue placeholder="Select Entry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(search || dateFrom || dateTo || doctorFilter || apptTypeFilter || patientTypeFilter || visitFilter || statusFilter) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="h-9 text-sm w-full"
                  onClick={() => {
                    setSearch(""); setDateFrom(""); setDateTo("");
                    setDoctorFilter(""); setApptTypeFilter(""); setPatientTypeFilter("");
                    setVisitFilter(""); setStatusFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 w-14">Sr No.</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">MR No.</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Patient Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Phone Number</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Gender</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Patient Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    No patients match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const status = p.status ?? "active";
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{p.mrn}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: avatarColor(p.name) }}
                          >
                            {initials(p.name)}
                          </div>
                          <span className="font-semibold text-slate-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.phone}</td>
                      <td className="px-4 py-3 text-slate-600">{genderLabel(p.gender)}</td>
                      <td className="px-4 py-3 text-slate-600">{p.patientType ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100"}
                        >
                          {status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            title="View patient details"
                            onClick={() => navigate(`/patients/${p.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#4982CF] hover:bg-[#4982CF]/10 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            title="Edit patient info"
                            onClick={() => setEditingPatient(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#4982CF] hover:bg-[#4982CF]/10 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete patient"
                            onClick={() => setDeletingPatient(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {editingPatient && (
        <EditProfileDrawer
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={patch => {
            updatePatient(editingPatient.id, patch);
            toast({ title: "Patient updated", description: `${editingPatient.name}'s profile has been updated.` });
          }}
        />
      )}

      <AlertDialog open={deletingPatient !== null} onOpenChange={open => { if (!open) setDeletingPatient(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
