import { useState } from "react";
import { Banknote, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Department } from "@/pages/AdminSettings";

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

function buildInitialFees(departments: Department[]): FeeRow[] {
  const rows: FeeRow[] = [];
  departments.forEach(dept => {
    dept.subDepartments.forEach(sub => {
      rows.push({
        deptId: dept.id,
        subDeptId: sub.id,
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

function ShareToggle({
  value,
  onChange,
}: {
  value: ShareType;
  onChange: (v: ShareType) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-200">
      <button
        type="button"
        onClick={() => onChange("value")}
        className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${value === "value" ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
      >
        Rs.
      </button>
      <button
        type="button"
        onClick={() => onChange("percentage")}
        className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${value === "percentage" ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
      >
        %
      </button>
    </div>
  );
}

function computeShareDisplay(fee: string, shareType: ShareType, shareAmount: string): string {
  const f = parseFloat(fee);
  const s = parseFloat(shareAmount);
  if (isNaN(f) || isNaN(s) || f <= 0 || s < 0) return "";
  if (shareType === "percentage") {
    const amt = (f * s) / 100;
    return `= Rs. ${amt.toFixed(0)}`;
  }
  const pct = (s / f) * 100;
  return `= ${pct.toFixed(1)}%`;
}

export function FeesModule({ departments }: { departments: Department[] }) {
  const [fees, setFees] = useState<FeeRow[]>(() => buildInitialFees(departments));

  const updateFee = (deptId: string, subDeptId: string, key: keyof FeeRow, value: string | ShareType) => {
    setFees(prev =>
      prev.map(row =>
        row.deptId === deptId && row.subDeptId === subDeptId
          ? { ...row, [key]: value }
          : row
      )
    );
  };

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name ?? id;
  const getSubDeptName = (deptId: string, subId: string) =>
    departments.find(d => d.id === deptId)?.subDepartments.find(s => s.id === subId)?.name ?? subId;

  // Group by department
  const grouped = departments
    .filter(d => d.subDepartments.length > 0)
    .map(dept => ({
      dept,
      rows: fees.filter(r => r.deptId === dept.id),
    }));

  const totalConfigured = fees.filter(r => r.consultationFee.trim() !== "").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Fees & Shares</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure consultation and follow-up charges per sub-department, along with doctor share settings.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#4982CF]/20 bg-[#4982CF]/5 px-4 py-2">
          <Banknote className="h-4 w-4 text-[#4982CF]" />
          <span className="text-sm font-semibold text-[#4982CF]">{totalConfigured} of {fees.length} configured</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
        <p className="text-xs text-amber-700">
          Set consultation fees and doctor share per sub-department. Toggle <strong>Rs.</strong> for a fixed share value or <strong>%</strong> for a percentage of the consultation fee. The same options apply for follow-up charges.
        </p>
      </div>

      {departments.length === 0 || fees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
          <Banknote className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm font-medium">No sub-departments to configure</p>
          <p className="mt-1 text-xs">Add departments and sub-departments first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ dept, rows }) => (
            <div key={dept.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Dept header */}
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <span className="font-bold text-slate-800">{dept.name}</span>
                <Badge className={dept.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-amber-500/10 text-amber-700 border-amber-200"}>
                  {dept.active ? "Active" : "Inactive"}
                </Badge>
                <span className="ml-auto text-xs text-slate-400">{rows.length} sub-dept{rows.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[180px_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-slate-100 bg-slate-50/40 px-5 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sub-Department</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Consult Fee (Rs.)</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Share Type</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Share Amount</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Follow-up Fee (Rs.)</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">F/U Share Type</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">F/U Share Amount</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {rows.map(row => {
                  const shareDisplay = computeShareDisplay(row.consultationFee, row.shareType, row.shareAmount);
                  const fuShareDisplay = computeShareDisplay(row.followUpFee, row.followUpShareType, row.followUpShareAmount);
                  const subDept = dept.subDepartments.find(s => s.id === row.subDeptId);

                  return (
                    <div
                      key={row.subDeptId}
                      className="grid grid-cols-[180px_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Sub-dept label */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">{getSubDeptName(row.deptId, row.subDeptId)}</p>
                        {subDept && !subDept.active && (
                          <Badge variant="outline" className="mt-0.5 text-[9px] text-amber-600 border-amber-200">Inactive</Badge>
                        )}
                      </div>

                      {/* Consultation Fee */}
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Rs.</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={row.consultationFee}
                          onChange={e => updateFee(row.deptId, row.subDeptId, "consultationFee", e.target.value)}
                          className="h-8 pl-8 text-sm"
                        />
                      </div>

                      {/* Share Type */}
                      <div>
                        <ShareToggle
                          value={row.shareType}
                          onChange={v => updateFee(row.deptId, row.subDeptId, "shareType", v)}
                        />
                      </div>

                      {/* Share Amount */}
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={row.shareType === "percentage" ? 100 : undefined}
                          placeholder={row.shareType === "percentage" ? "0%" : "0"}
                          value={row.shareAmount}
                          onChange={e => updateFee(row.deptId, row.subDeptId, "shareAmount", e.target.value)}
                          className="h-8 text-sm"
                        />
                        {shareDisplay && (
                          <span className="mt-0.5 block text-[10px] font-medium text-[#4982CF]">{shareDisplay}</span>
                        )}
                      </div>

                      {/* Follow-up Fee */}
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Rs.</span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={row.followUpFee}
                          onChange={e => updateFee(row.deptId, row.subDeptId, "followUpFee", e.target.value)}
                          className="h-8 pl-8 text-sm"
                        />
                      </div>

                      {/* Follow-up Share Type */}
                      <div>
                        <ShareToggle
                          value={row.followUpShareType}
                          onChange={v => updateFee(row.deptId, row.subDeptId, "followUpShareType", v)}
                        />
                      </div>

                      {/* Follow-up Share Amount */}
                      <div>
                        <Input
                          type="number"
                          min={0}
                          max={row.followUpShareType === "percentage" ? 100 : undefined}
                          placeholder={row.followUpShareType === "percentage" ? "0%" : "0"}
                          value={row.followUpShareAmount}
                          onChange={e => updateFee(row.deptId, row.subDeptId, "followUpShareAmount", e.target.value)}
                          className="h-8 text-sm"
                        />
                        {fuShareDisplay && (
                          <span className="mt-0.5 block text-[10px] font-medium text-[#4982CF]">{fuShareDisplay}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dept totals summary */}
              {rows.some(r => r.consultationFee) && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                  <div className="flex flex-wrap gap-4">
                    {rows.filter(r => r.consultationFee).map(r => (
                      <div key={r.subDeptId} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{getSubDeptName(r.deptId, r.subDeptId)}:</span>
                        <span className="text-xs font-semibold text-slate-700">Rs. {r.consultationFee}</span>
                        {r.shareAmount && (
                          <span className="text-[10px] text-slate-400">
                            (Dr. share: {r.shareType === "percentage" ? `${r.shareAmount}%` : `Rs. ${r.shareAmount}`})
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
  );
}
