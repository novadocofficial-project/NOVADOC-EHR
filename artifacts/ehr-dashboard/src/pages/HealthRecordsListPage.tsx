import { useState } from "react";
import { FileText, Eye, Trash2 } from "lucide-react";
import { QueueAppHeader } from "@/pages/QueuePageLayout";
import { useHealthRecords } from "@/hooks/useHealthRecords";
import { getSoapDummyNote } from "@/data/healthRecordsSeed";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { printHealthRecord } from "@/lib/printHealthRecord";
import type { HealthRecordEntry } from "@/data/healthRecordsSeed";

const ACCENT = "#4982CF";

function splitCreatedAt(createdAt: string): { date: string; time: string } {
  const [date, time] = createdAt.split(",").map(s => s.trim());
  return { date: date ?? createdAt, time: time ?? "" };
}

export function HealthRecordsListPage() {
  const { records, deleteHealthRecord } = useHealthRecords();
  const { toast } = useToast();

  const [deletingRecord, setDeletingRecord] = useState<HealthRecordEntry | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  function handleView(record: HealthRecordEntry) {
    setViewingId(record.id);
    const { date, time } = splitCreatedAt(record.createdAt);
    void printHealthRecord({
      patient:   { name: record.patientName, mrn: record.mrn },
      noteRow:   { date, time, type: record.type === "Addendum" ? "Addendum Note" : "Comprehensive Note", doctor: record.consultant },
      visitType: record.visitType,
      noteKind:  { kind: "dummy", note: getSoapDummyNote(record.noteIndex) },
    }).finally(() => setViewingId(null));
  }

  function handleDeleteConfirm() {
    if (!deletingRecord) return;
    deleteHealthRecord(deletingRecord.id);
    toast({ title: "Health record deleted", description: `Record for ${deletingRecord.patientName} has been removed.` });
    setDeletingRecord(null);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <QueueAppHeader />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#4982CF]/10">
            <FileText className="h-5 w-5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Health Records</h1>
            <p className="text-xs text-slate-400">{records.length} health record{records.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 w-14">Sr No.</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">MR No.</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Patient Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Consultant</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Vitals By</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Created At</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Health Record Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    No health records found.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{r.mrn}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.patientName}</td>
                    <td className="px-4 py-3 text-slate-600">{r.consultant}</td>
                    <td className="px-4 py-3 text-slate-600">{r.vitalsBy}</td>
                    <td className="px-4 py-3 text-slate-500">{r.createdAt}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={r.type === "New"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
                          : "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-50"}
                      >
                        {r.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="View PDF"
                          disabled={viewingId === r.id}
                          onClick={() => handleView(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#4982CF] hover:bg-[#4982CF]/10 transition-colors disabled:opacity-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete record"
                          onClick={() => setDeletingRecord(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AlertDialog open={deletingRecord !== null} onOpenChange={open => { if (!open) setDeletingRecord(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Health Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this health record? This action cannot be undone.
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
