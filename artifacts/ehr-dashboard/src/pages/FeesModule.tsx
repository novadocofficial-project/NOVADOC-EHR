import { useState, useEffect } from "react";
import { Banknote, Info, UserRound, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Department } from "@/pages/AdminSettings";
import type { Doctor } from "@/pages/DoctorsModule";

type ShareType = "value" | "percentage";

type FeeRow = {
  deptId: string;
  subDeptId: string;
  consultationFee: string;
  shareType: ShareType;
  shareAmount: string;
  followUpFee: string;
  followUpShareType: ShareType;
  followUpShareAmount: string;
};

function buildRowsForDoctor(doctor: Doctor, departments: Department[]): FeeRow[] {
  const rows: FeeRow[] = [];
  doctor.departments.forEach(deptId => {
    const subDeptIds = doctor.subDepartments[deptId] ?? [];
    subDeptIds.forEach(subDeptId => {
      rows.push({
        deptId,
        subDeptId,
        consultationFee: "",
        shareType: "percentage",
        shareAmount: "",
        followUpFee: "",
        followUpShareType: "percentage",
        followUpShareAmount: "",
      });
    });
  });
  return rows;
}

function ShareToggle({ value, onChange }: { value: ShareType; onChange: (v: ShareType) => void }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-200">
      <button
        type="button"
        onClick={() => onChange("value")}
        className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${value === "value" ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
      >
        Rs.
      </button>
      <button
        type="button"
        onClick={() => onChange("percentage")}
        className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${value === "percentage" ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
      >
        %
      </button>
    </div>
  );
}

function computeEquiv(fee: string, shareType: ShareType, shareAmt: string): string {
  const f = parseFloat(fee);
  const s = parseFloat(shareAmt);
  if (isNaN(f) || isNaN(s) || f <= 0 || s < 0) return "";
  if (shareType === "percentage") return `= Rs. ${((f * s) / 100).toFixed(0)}`;
  return `= ${((s / f) * 100).toFixed(1)}%`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");
}

export function FeesModule({ departments, doctors }: { departments: Department[]; doctors: Doctor[] }) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fees, setFees] = useState<Record<string, FeeRow[]>>({});

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) ?? null;

  useEffect(() => {
    if (!selectedDoctorId || fees[selectedDoctorId]) return;
    const rows = buildRowsForDoctor(doctors.find(d => d.id === selectedDoctorId)!, departments);
    setFees(prev => ({ ...prev, [selectedDoctorId]: rows }));
  }, [selectedDoctorId, doctors, departments, fees]);

  const updateFee = (doctorId: string, deptId: string, subDeptId: string, key: keyof FeeRow, value: string | ShareType) => {
    setFees(prev => ({
      ...prev,
      [doctorId]: (prev[doctorId] ?? []).map(row =>
        row.deptId === deptId && row.subDeptId === subDeptId ? { ...row, [key]: value } : row
      ),
    }));
  };

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;
  const getSubDeptName = (deptId: string, subId: string) =>
    departments.find(d => d.id === deptId)?.subDepartments.find(s => s.id === subId)?.name ?? subId;

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const doctorRows = selectedDoctorId ? (fees[selectedDoctorId] ?? []) : [];

  const groupedRows = selectedDoctor
    ? selectedDoctor.departments.map(deptId => ({
        deptId,
        deptName: getDeptName(deptId),
        rows: doctorRows.filter(r => r.deptId === deptId),
      })).filter(g => g.rows.length > 0)
    : [];

  const configuredCount = doctorRows.filter(r => r.consultationFee.trim() !== "").length;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Fees & Shares</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a doctor to configure consultation and follow-up charges per sub-department.
        </p>
      </div>

      <div className="flex gap-5" style={{ minHeight: "calc(100vh - 220px)" }}>
        {/* Doctor List */}
        <aside className="flex w-64 flex-none flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search doctors…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {filteredDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <UserRound className="mb-2 h-7 w-7 opacity-40" />
                <p className="text-xs">No doctors found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredDoctors.map(doc => {
                  const docFees = fees[doc.id] ?? [];
                  const configured = docFees.filter(r => r.consultationFee.trim() !== "").length;
                  const total = docFees.length || doc.departments.reduce((acc, dId) => acc + (doc.subDepartments[dId]?.length ?? 0), 0);
                  const isSelected = selectedDoctorId === doc.id;

                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${isSelected ? "bg-[#4982CF]/8 border-l-2 border-[#4982CF]" : "hover:bg-slate-50 border-l-2 border-transparent"}`}
                    >
                      <div
                        className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold ${isSelected ? "bg-[#4982CF] text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {initials(doc.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${isSelected ? "text-[#4982CF]" : "text-slate-700"}`}>
                          {doc.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${doc.status === "active" ? "bg-emerald-500" : "bg-amber-400"}`} />
                          <span className="text-[10px] text-slate-400 capitalize">{doc.status}</span>
                          {total > 0 && configured > 0 && (
                            <span className="text-[10px] text-[#4982CF] font-medium">· {configured}/{total} set</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <ChevronRight className="h-3.5 w-3.5 flex-none text-[#4982CF]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Fee Config Panel */}
        <div className="flex-1 min-w-0">
          {!selectedDoctor ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
              <Banknote className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-base font-semibold text-slate-500">Select a doctor</p>
              <p className="mt-1 text-sm">Choose a doctor from the list to configure their fees.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Doctor summary bar */}
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#4982CF] text-sm font-bold text-white">
                  {initials(selectedDoctor.name)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{selectedDoctor.name}</p>
                  <p className="text-xs text-slate-500">
                    {selectedDoctor.departments.map(getDeptName).join(", ")}
                    {" · "}{selectedDoctor.shift} shift
                  </p>
                </div>
                <Badge className={selectedDoctor.status === "active" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-amber-500/10 text-amber-700 border-amber-200"}>
                  {selectedDoctor.status}
                </Badge>
                {configuredCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#4982CF]/8 px-3 py-1.5">
                    <Banknote className="h-3.5 w-3.5 text-[#4982CF]" />
                    <span className="text-xs font-semibold text-[#4982CF]">{configuredCount}/{doctorRows.length} configured</span>
                  </div>
                )}
              </div>

              {/* Info hint */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-600" />
                <p className="text-xs text-amber-700">
                  Fees below apply to <strong>{selectedDoctor.name}</strong>. Toggle <strong>Rs.</strong> for a fixed share value or <strong>%</strong> for a percentage. The equivalent is shown automatically.
                </p>
              </div>

              {groupedRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-14 text-slate-400">
                  <p className="text-sm font-medium">No sub-departments assigned</p>
                  <p className="mt-1 text-xs">Assign sub-departments to this doctor from Doctor Profiles first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedRows.map(({ deptId, deptName, rows }) => (
                    <div key={deptId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {/* Dept header */}
                      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
                        <span className="font-bold text-slate-800">{deptName}</span>
                        <span className="ml-auto text-xs text-slate-400">{rows.length} sub-dept{rows.length !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Column headers */}
                      <div className="grid grid-cols-[160px_1fr_100px_1fr_1fr_100px_1fr] items-center gap-3 border-b border-slate-100 bg-slate-50/40 px-5 py-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Sub-Dept</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Consult Fee (Rs.)</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Share</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Share Amt</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Follow-up Fee (Rs.)</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">F/U Share</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">F/U Amt</span>
                      </div>

                      {/* Rows */}
                      <div className="divide-y divide-slate-100">
                        {rows.map(row => {
                          const shareEquiv = computeEquiv(row.consultationFee, row.shareType, row.shareAmount);
                          const fuEquiv = computeEquiv(row.followUpFee, row.followUpShareType, row.followUpShareAmount);
                          return (
                            <div
                              key={row.subDeptId}
                              className="grid grid-cols-[160px_1fr_100px_1fr_1fr_100px_1fr] items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                            >
                              {/* Sub-dept name */}
                              <div className="pt-1.5">
                                <p className="truncate text-sm font-semibold text-slate-700">{getSubDeptName(row.deptId, row.subDeptId)}</p>
                              </div>

                              {/* Consultation Fee */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Rs.</span>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  value={row.consultationFee}
                                  onChange={e => updateFee(selectedDoctorId!, deptId, row.subDeptId, "consultationFee", e.target.value)}
                                  className="h-8 pl-8 text-sm"
                                />
                              </div>

                              {/* Share Type */}
                              <div>
                                <ShareToggle
                                  value={row.shareType}
                                  onChange={v => updateFee(selectedDoctorId!, deptId, row.subDeptId, "shareType", v)}
                                />
                              </div>

                              {/* Share Amount */}
                              <div>
                                <Input
                                  type="number"
                                  min={0}
                                  max={row.shareType === "percentage" ? 100 : undefined}
                                  placeholder={row.shareType === "percentage" ? "%" : "Rs."}
                                  value={row.shareAmount}
                                  onChange={e => updateFee(selectedDoctorId!, deptId, row.subDeptId, "shareAmount", e.target.value)}
                                  className="h-8 text-sm"
                                />
                                {shareEquiv && <span className="mt-0.5 block text-[10px] font-medium text-[#4982CF]">{shareEquiv}</span>}
                              </div>

                              {/* Follow-up Fee */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Rs.</span>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  value={row.followUpFee}
                                  onChange={e => updateFee(selectedDoctorId!, deptId, row.subDeptId, "followUpFee", e.target.value)}
                                  className="h-8 pl-8 text-sm"
                                />
                              </div>

                              {/* Follow-up Share Type */}
                              <div>
                                <ShareToggle
                                  value={row.followUpShareType}
                                  onChange={v => updateFee(selectedDoctorId!, deptId, row.subDeptId, "followUpShareType", v)}
                                />
                              </div>

                              {/* Follow-up Share Amount */}
                              <div>
                                <Input
                                  type="number"
                                  min={0}
                                  max={row.followUpShareType === "percentage" ? 100 : undefined}
                                  placeholder={row.followUpShareType === "percentage" ? "%" : "Rs."}
                                  value={row.followUpShareAmount}
                                  onChange={e => updateFee(selectedDoctorId!, deptId, row.subDeptId, "followUpShareAmount", e.target.value)}
                                  className="h-8 text-sm"
                                />
                                {fuEquiv && <span className="mt-0.5 block text-[10px] font-medium text-[#4982CF]">{fuEquiv}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Dept fee summary */}
                      {rows.some(r => r.consultationFee) && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5">
                          <div className="flex flex-wrap gap-4">
                            {rows.filter(r => r.consultationFee).map(r => (
                              <div key={r.subDeptId} className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{getSubDeptName(r.deptId, r.subDeptId)}:</span>
                                <span className="text-xs font-bold text-slate-700">Rs. {r.consultationFee}</span>
                                {r.shareAmount && (
                                  <span className="text-[10px] text-slate-400">
                                    (share: {r.shareType === "percentage" ? `${r.shareAmount}%` : `Rs. ${r.shareAmount}`})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
