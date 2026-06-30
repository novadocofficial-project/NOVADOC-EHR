import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, RefreshCw, ChevronDown, MoreHorizontal, ChevronRight, ChevronUp,
  AlertTriangle, Activity, Heart, Thermometer, User, Ruler, Zap, Brain, Scale,
  Edit3, FileText, CheckCircle2, Clock, X, Maximize2, Minimize2,
  BarChart2, Calendar, Pill, FlaskConical, Stethoscope, PenLine,
  ClipboardList, Users, FileBarChart, ScanLine, TrendingUp,
  Microscope, Eye, BookOpen, Target,
  ShieldAlert, Scissors, Send, BookMarked, ListChecks, MessageSquare,
  TestTube, HeartPulse, UserCheck, Home,
  Printer, FilePenLine, GitBranch, Layers, Camera, Globe,
} from "lucide-react";
import { MultiEntry } from "@/hooks/useMultiStepQueue";
import { useSoapNoteDraft, saveRoutingSnapshot, savePendingLabOrders, savePatientClinicalSnapshot } from "@/hooks/useSoapNoteDraft";
import { getPatientIdByMrn } from "@/hooks/usePatients";
import { Button } from "@/components/ui/button";
import { View360Drawer } from "@/pages/View360Drawer";
import { LabsDrawer } from "@/pages/LabsDrawer";
import { ScannedDocumentsDrawer } from "@/pages/ScannedDocumentsDrawer";
import { ClinicalNoteDrawer, EMPTY_NOTE } from "@/pages/ClinicalNoteDrawer";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";
import { EMPTY_FORMULARY } from "@/pages/FormularySection";
import { EMPTY_IMAGING } from "@/pages/ImagingSection";
import { EMPTY_CARE_PLAN } from "@/pages/CarePlanSection";
import { EMPTY_HEALTH_ED } from "@/pages/HealthEdSection";
import { EMPTY_REFERRAL_DATA } from "@/pages/ReferralSection";
import { EMPTY_PROCEDURE_ORDERS } from "@/pages/ProcedureOrdersSection";
import { EMPTY_PATIENT_GOALS } from "@/pages/PatientGoalsSection";
import { EMPTY_SOCIAL_HISTORY } from "@/pages/MedicalHistorySection";
import type { SocAnswers } from "@/pages/MedicalHistorySection";
import { loadSocConfig } from "@/pages/ClinicalLibrariesModule";
import { SoapDummyNote, SOAP_DUMMY } from "@/data/soapDummy";
export type { SoapDummyNote } from "@/data/soapDummy";
export { SOAP_DUMMY } from "@/data/soapDummy";
import { ROS_SYSTEMS, BODY_SYSTEMS, PeSummary } from "@/pages/RosPeSection";
import { loadForms } from "@/pages/SpecialtyFormsModule";
import type { SpecialtyForm } from "@/pages/SpecialtyFormsModule";
import { printHealthRecord } from "@/lib/printHealthRecord";
import type { PrintNoteKind } from "@/lib/printHealthRecord";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Static mock data ─────────────────────────────────────────────────────────

const VITALS = [
  { label: "BP",      value: "121/77", unit: "mmHg",  Icon: Activity,    color: "#4982CF" },
  { label: "Pulse",   value: "76",     unit: "bpm",   Icon: Heart,       color: "#ef4444" },
  { label: "Temp",    value: "37.0",   unit: "°C",    Icon: Thermometer, color: "#f59e0b" },
  { label: "Weight",  value: "72",     unit: "kg",    Icon: User,        color: "#8b5cf6" },
  { label: "Height",  value: "168",    unit: "cm",    Icon: Ruler,       color: "#10b981" },
  { label: "BMI",     value: "25.5",   unit: "kg/m²", Icon: Scale,       color: "#14b8a6" },
  { label: "Pain",    value: "5/10",   unit: "score", Icon: Zap,         color: "#ec4899" },
  { label: "PHQ-4",   value: "7",      unit: "Mental", Icon: Brain,      color: "#7c3aed" },
];

const CONDITIONS = [
  { name: "Hypertension",    code: "I10",   color: "#f97316" },
  { name: "Type 2 Diabetes", code: "E11.9", color: "#ef4444" },
];

const ALLERGIES_LIST = [
  { name: "Penicillin",   severity: "Severe",   reaction: "Anaphylaxis"       },
  { name: "NSAIDs",       severity: "Moderate", reaction: "GI upset, rash"    },
  { name: "Sulfonamides", severity: "Moderate", reaction: "Rash, urticaria"   },
  { name: "Latex",        severity: "Mild",     reaction: "Contact dermatitis" },
];

const CURRENT_MEDICATIONS = [
  { name: "Lisinopril",    dose: "10 mg",  form: "Tablet", frequency: "Once daily",       route: "Oral", indication: "Hypertension",    prescriber: "Dr. Asif Imam",  startDate: "12 Jan 2025", status: "Active"   },
  { name: "Metformin",     dose: "500 mg", form: "Tablet", frequency: "Twice daily",      route: "Oral", indication: "Type 2 Diabetes", prescriber: "Dr. Asif Imam",  startDate: "05 Mar 2024", status: "Active"   },
  { name: "Atorvastatin",  dose: "20 mg",  form: "Tablet", frequency: "Once at bedtime",  route: "Oral", indication: "Dyslipidaemia",   prescriber: "Dr. Asif Imam",  startDate: "18 Jun 2024", status: "Active"   },
  { name: "Aspirin",       dose: "75 mg",  form: "Tablet", frequency: "Once daily",       route: "Oral", indication: "Cardioprotection", prescriber: "Dr. Asif Imam", startDate: "12 Jan 2025", status: "Active"   },
  { name: "Omeprazole",    dose: "20 mg",  form: "Capsule",frequency: "Once daily",       route: "Oral", indication: "GI protection",   prescriber: "Dr. Asif Imam",  startDate: "12 Jan 2025", status: "Active"   },
  { name: "Amlodipine",    dose: "5 mg",   form: "Tablet", frequency: "Once daily",       route: "Oral", indication: "Hypertension",    prescriber: "Dr. Asif Imam",  startDate: "20 Sep 2024", status: "On Hold"  },
];

const NAV_TABS: { label: string; Icon: React.ElementType }[] = [
  { label: "Last Visit",              Icon: Calendar      },
  { label: "Current Medications",     Icon: Pill          },
  { label: "Labs",                    Icon: FlaskConical  },
  { label: "Imaging",                 Icon: Camera        },
  { label: "Procedures",              Icon: Scissors      },
  { label: "MDT",                     Icon: Users         },
  { label: "Referrals to Specialists",Icon: Send          },
  { label: "Goals",                   Icon: Target        },
  { label: "Data Analytics",          Icon: TrendingUp    },
  { label: "Scanned Documents",       Icon: ScanLine      },
  { label: "Patient Portal",          Icon: Globe         },
];

const NOTE_HISTORY = [
  {
    date: "Dec 10, 2024", day: "Tuesday",   time: "10:55",
    type: "Comprehensive Note", doctor: "Dr. Asif Imam", selected: false, signed: false,
  },
  {
    date: "Nov 10, 2024", day: "Monday",    time: "08:10",
    type: "Comprehensive Note", doctor: "Dr. Abc",       selected: true, signed: false,
  },
  {
    date: "Sep 25, 2024", day: "Wednesday", time: "05:20",
    type: "Comprehensive Note", doctor: "Dr. Xyz",       selected: false, signed: false,
  },
];

export interface SignedRecord {
  date: string;
  day: string;
  time: string;
  type: string;
  doctor: string;
  signed: true;
  signedAt?: number;
  noteState?: NoteState;
}

function SpecialtyNotePreview({ form, data, note }: { form: SpecialtyForm; data: Record<string, unknown>; note?: NoteState }) {
  const Section = ({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      </div>
      {children}
    </div>
  );

  const unifiedLayout = [
    ...form.sections.map(s => ({ type: "section" as const, item: s, pos: s.globalOrder ?? 0 })),
    ...(form.systemComponents ?? []).map(sc => ({ type: "sc" as const, item: sc, pos: sc.order })),
  ].sort((a, b) => a.pos - b.pos);

  function renderSystemComponent(id: string): React.ReactNode {
    if (!note) return null;
    switch (id) {
      case "chief-complaint": {
        if (!note.chiefComplaints.length) return null;
        return (
          <Section key="sc-cc" icon={<PenLine className="h-3.5 w-3.5" />} title="Chief Complaint" color="#4982CF">
            <div className="flex flex-wrap gap-1.5">
              {note.chiefComplaints.map(c => (
                <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{c}</span>
              ))}
            </div>
          </Section>
        );
      }

      case "hpi": {
        const hasText = !!note.hpi?.trim();
        const done = note.hpiDoneComplaints ?? [];
        if (!hasText && !done.length) return null;
        return (
          <Section key="sc-hpi" icon={<FileText className="h-3.5 w-3.5" />} title="History of Present Illness" color="#6366f1">
            {hasText ? (
              <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">{note.hpi}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {done.map(c => (
                  <span key={c} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" /> {c}
                  </span>
                ))}
              </div>
            )}
          </Section>
        );
      }

      case "allergies": {
        if (!note.allergies.length) return null;
        return (
          <Section key="sc-allg" icon={<ShieldAlert className="h-3.5 w-3.5" />} title="Allergies" color="#ef4444">
            <div className="space-y-1.5">
              {note.allergies.map(a => {
                const sevClass = a.severity === "severe"   ? "bg-red-50 text-red-700 border-red-200"
                              : a.severity === "moderate" ? "bg-amber-50 text-amber-700 border-amber-200"
                              :                             "bg-sky-50 text-sky-700 border-sky-200";
                return (
                  <div key={a.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${sevClass}`}>
                    <span className="text-[10px] font-black flex-shrink-0">{a.name}</span>
                    {a.reaction && (
                      <>
                        <div className="w-px self-stretch bg-current opacity-20 flex-shrink-0" />
                        <p className="text-[10px] flex-1">{a.reaction}</p>
                      </>
                    )}
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/60 capitalize flex-shrink-0">{a.severity}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        );
      }

      case "medical-history": {
        const hasPmh     = note.pmhActive.length > 0 || note.pmhResolved.length > 0;
        const hasSurgical = note.surgicalRows.length > 0;
        const hasFH      = note.fhRows.length > 0;
        const sh          = (note.socialHistory ?? {}) as SocAnswers;
        const socQuestions = loadSocConfig();
        const hasSocial   = Object.keys(sh).some(k => {
          const a = sh[k]; if (!a) return false;
          if (Array.isArray(a.main)) return a.main.length > 0;
          return a.main !== "" && a.main !== "No";
        });
        if (!hasPmh && !hasSurgical && !hasFH && !hasSocial) return null;
        return (
          <Section key="sc-mhx" icon={<FileText className="h-3.5 w-3.5" />} title="Medical, Surgical, Family & Social History" color="#6366f1">
            <div className="space-y-3">
              {hasPmh && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Past Medical History</p>
                  <div className="flex flex-wrap gap-1.5">
                    {note.pmhActive.map(h => (
                      <span key={h} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{h}</span>
                    ))}
                    {note.pmhResolved.map(h => (
                      <span key={`r-${h}`} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 line-through">{h}</span>
                    ))}
                  </div>
                </div>
              )}
              {hasSurgical && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Surgical History</p>
                  <div className="space-y-1">
                    {note.surgicalRows.map(s => (
                      <div key={s.id} className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <p className="text-[11px] text-slate-600">{s.procedure}{s.date ? ` · ${s.date}` : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hasFH && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Family History</p>
                  <div className="space-y-1">
                    {note.fhRows.map(f => (
                      <div key={f.id} className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                        <p className="text-[11px] text-slate-600"><span className="font-semibold">{f.relation}:</span> {f.condition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hasSocial && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Social History</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(sh).map(([qId, ans]) => {
                      if (!ans) return null;
                      if (Array.isArray(ans.main) ? ans.main.length === 0 : (!ans.main || ans.main === "No")) return null;
                      const q = socQuestions.find(x => x.id === qId);
                      const label = q?.name ?? qId;
                      const displayVal = Array.isArray(ans.main) ? ans.main.join(", ") : ans.main;
                      const chipText = displayVal === "Yes" ? label : `${label}: ${displayVal}`;
                      return (
                        <span key={qId} className="text-[10px] px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                          {chipText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Section>
        );
      }

      case "ros": {
        const rosEntries = ROS_SYSTEMS.filter(s => (note.ros[s.id] ?? []).length > 0);
        if (!rosEntries.length) return null;
        return (
          <Section key="sc-ros" icon={<Activity className="h-3.5 w-3.5" />} title="Review of Systems" color="#0ea5e9">
            <div className="space-y-2">
              {rosEntries.map(sys => (
                <div key={sys.id} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-black text-sky-700 mb-1.5 uppercase tracking-wide">{sys.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {(note.ros[sys.id] ?? []).map(symptom => (
                      <span key={symptom} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{symptom}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        );
      }

      case "physical-exam": {
        const peSystemObjs = BODY_SYSTEMS.filter(s => note.peSystems.includes(s.id));
        if (!peSystemObjs.length) return null;
        return (
          <Section key="sc-pe" icon={<Stethoscope className="h-3.5 w-3.5" />} title="Physical Examination" color="#8b5cf6">
            <div className="space-y-2">
              {peSystemObjs.map(sys => {
                const saved = (note.peSavedData ?? {})[sys.id];
                const hasFindings = saved && Object.values(saved).some(v => v.trim());
                return (
                  <div key={sys.id} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-black text-violet-700 mb-1 uppercase tracking-wide">{sys.label}</p>
                    {hasFindings
                      ? <PeSummary systemId={sys.id} savedData={saved} />
                      : <p className="text-[10px] text-slate-400 italic">No findings recorded</p>
                    }
                  </div>
                );
              })}
            </div>
          </Section>
        );
      }

      case "poc-labs": {
        const completed = (note.pocTests ?? []).filter(t => t.status !== "pending");
        if (!completed.length) return null;
        return (
          <Section key="sc-poc" icon={<TestTube className="h-3.5 w-3.5" />} title="Point of Care Labs" color="#0ea5e9">
            <div className="space-y-1.5">
              {completed.map(t => {
                const isPositive = t.status === "positive";
                return (
                  <div key={t.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${isPositive ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <span className="text-[10px] font-bold flex-1 text-slate-700">{t.name}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize ${isPositive ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>
        );
      }

      case "diagnosis": {
        if (!note.diagnoses.length) return null;
        return (
          <Section key="sc-dx" icon={<Target className="h-3.5 w-3.5" />} title="Assessment & Diagnosis" color="#ef4444">
            <div className="space-y-2">
              {note.diagnoses.map((d, i) => (
                <div key={d.code ?? i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <span className="text-[10px] font-black font-mono text-slate-600">{d.code}</span>
                  <div className="w-px self-stretch bg-slate-200 flex-shrink-0" />
                  <p className="text-[11px] font-semibold flex-1 text-slate-700">{d.name}</p>
                  {d.isProvisional && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">Provisional</span>
                  )}
                  {d.isFinal && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">Final</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        );
      }

      case "lab-orders": {
        if (!note.labOrders.length) return null;
        return (
          <Section key="sc-lab" icon={<Microscope className="h-3.5 w-3.5" />} title="Lab Orders" color="#f59e0b">
            <div className="space-y-2">
              {note.labOrders.map((order, idx) => (
                <div key={order.id ?? idx} className={`rounded-lg border px-3 py-2 ${order.voided ? "border-rose-100 bg-rose-50/60" : "border-amber-100 bg-amber-50/40"}`}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${order.voided ? "text-rose-400 line-through" : "text-amber-700"}`}>
                      Order {idx + 1}{idx === 0 ? " · Original" : " · Follow-up"}
                    </span>
                    {order.sentAt && (
                      <span className="text-[9px] text-slate-400">
                        · {new Date(order.sentAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                    {order.voided && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200">VOIDED</span>
                    )}
                  </div>
                  {order.voided && order.voidReason && (
                    <p className="text-[9px] text-rose-400 italic mb-1">Reason: {order.voidReason}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {order.tests.map(t => (
                      <span key={t.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${order.voided ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{t.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        );
      }

      case "formulary": {
        const meds = note.formulary?.medicines ?? [];
        if (!meds.length) return null;
        return (
          <Section key="sc-rx" icon={<Pill className="h-3.5 w-3.5" />} title="Prescriptions" color="#8b5cf6">
            <div className="space-y-2">
              {meds.map(m => (
                <div key={m.uid} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                  <p className="text-[11px] font-black text-slate-800">{m.brand}{m.genericName ? ` (${m.genericName})` : ""}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {[m.dose && m.unit ? `${m.dose} ${m.unit}` : m.dose, m.route, m.frequency].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        );
      }

      case "imaging": {
        const orders = note.imaging?.orders ?? [];
        if (!orders.length) return null;
        return (
          <Section key="sc-img" icon={<Eye className="h-3.5 w-3.5" />} title="Imaging Orders" color="#0ea5e9">
            <div className="space-y-1.5">
              {orders.map(o => (
                <div key={o.uid} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ScanLine className="h-3 w-3 text-sky-500 flex-shrink-0" />
                    <span className="text-[11px] font-black text-sky-800 flex-1">
                      {o.modality} → {o.bodyPart}
                    </span>
                    <span className="text-[9px] font-bold text-sky-500 flex-shrink-0">{o.protocol}</span>
                  </div>
                  {o.specialInstructions && (
                    <p className="text-[10px] text-sky-600 mt-0.5 pl-5 italic">{o.specialInstructions}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        );
      }

      case "care-plan": {
        const instructions = note.carePlan?.instructions?.trim() ?? "";
        if (!instructions) return null;
        return (
          <Section key="sc-cp" icon={<BookOpen className="h-3.5 w-3.5" />} title="Care Plan" color="#10b981">
            <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 whitespace-pre-wrap">{instructions}</p>
          </Section>
        );
      }

      case "referrals": {
        const refs = note.referrals?.referrals ?? [];
        if (!refs.length) return null;
        return (
          <Section key="sc-ref" icon={<Send className="h-3.5 w-3.5" />} title="Referrals" color="#4982CF">
            <div className="space-y-1.5">
              {refs.map(r => {
                const label = r.referralTarget === "Consultant" ? (r.speciality || r.consultantName)
                            : r.referralTarget === "Procedure"  ? r.procedureName
                            : r.referralTarget === "ER"         ? r.facilityName
                            :                                     r.customTarget;
                return (
                  <div key={r.id} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-3">
                    <span className="text-[10px] font-black text-blue-700 flex-shrink-0 pt-0.5">{label}</span>
                    {r.consultantName && r.referralTarget === "Consultant" && (
                      <>
                        <div className="w-px self-stretch bg-blue-200 flex-shrink-0" />
                        <p className="text-[10px] text-blue-600">{r.consultantName}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        );
      }

      case "patient-goals": {
        const goals = note.patientGoals?.goals ?? [];
        if (!goals.length) return null;
        return (
          <Section key="sc-pg" icon={<Target className="h-3.5 w-3.5" />} title="Patient Goals" color="#10b981">
            <div className="space-y-1.5">
              {goals.map(g => (
                <div key={g.uid} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-slate-700 font-medium">{g.title}</p>
                    {g.targetDate && <p className="text-[9px] text-slate-400 mt-0.5">Target: {g.targetDate}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        );
      }

      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <Layers className="h-3.5 w-3.5 flex-shrink-0" style={{ color: ACCENT }} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{form.name}</p>
      </div>

      {/* Unified layout — custom sections and system components interleaved by globalOrder/order */}
      {unifiedLayout.map(entry => {
        if (entry.type === "sc") {
          return note ? renderSystemComponent(entry.item.id) : null;
        }
        const section = entry.item;
        const filledFields = section.fields.filter(field => {
          const v = data[field.id];
          return v !== undefined && v !== "" && (!Array.isArray(v) || (v as string[]).length > 0);
        });
        if (filledFields.length === 0) return null;
        return (
          <div key={section.id}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{section.title}</p>
            <div className="grid grid-cols-2 gap-3">
              {filledFields.map(field => {
                const value = data[field.id];
                return (
                  <div key={field.id} className="bg-white border border-slate-100 rounded-lg px-3.5 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{field.label}</p>
                    {Array.isArray(value) ? (
                      <div className="flex flex-wrap gap-1">
                        {(value as string[]).map(v => (
                          <span key={v} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{v}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{String(value)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LiveNotePreview({ note }: { note: NoteState }) {
  const hasSpecialtyData = !!(
    note.specialtyFormId &&
    note.specialtyFormData &&
    Object.values(note.specialtyFormData).some(
      v => v !== undefined && v !== "" && (!Array.isArray(v) || (v as string[]).length > 0)
    )
  );
  const specialtyForm: SpecialtyForm | null = hasSpecialtyData
    ? loadForms().find(f => f.id === note.specialtyFormId) ?? null
    : null;

  const Section = ({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <span style={{ color }}>{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      </div>
      {children}
    </div>
  );

  const rosEntries = ROS_SYSTEMS.filter(s => (note.ros[s.id] ?? []).length > 0);
  const peSystemObjs = BODY_SYSTEMS.filter(s => note.peSystems.includes(s.id));

  return (
    <div className="px-6 py-5 bg-slate-50 border-t border-slate-100">
      {specialtyForm ? (
        <SpecialtyNotePreview form={specialtyForm} data={note.specialtyFormData!} note={note} />
      ) : (
      <div className="grid grid-cols-2 gap-x-8">

        {/* ══ LEFT ══ */}
        <div>
          {note.chiefComplaints.length > 0 && (
            <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Chief Complaint" color="#4982CF">
              <div className="flex flex-wrap gap-1.5">
                {note.chiefComplaints.map(c => (
                  <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{c}</span>
                ))}
              </div>
            </Section>
          )}

          {note.hpi.trim() && (
            <Section icon={<FileText className="h-3.5 w-3.5" />} title="History of Present Illness" color="#6366f1">
              <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">{note.hpi}</p>
            </Section>
          )}

          <Section icon={<Activity className="h-3.5 w-3.5" />} title="Review of Systems" color="#0ea5e9">
            {rosEntries.length > 0 ? (
              <div className="space-y-2">
                {rosEntries.map(sys => (
                  <div key={sys.id} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-black text-sky-700 mb-1.5 uppercase tracking-wide">{sys.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {(note.ros[sys.id] ?? []).map(symptom => (
                        <span key={symptom} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">{symptom}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">Not reviewed</p>
            )}
          </Section>
        </div>

        {/* ══ RIGHT ══ */}
        <div>
          <Section icon={<Stethoscope className="h-3.5 w-3.5" />} title="Physical Examination" color="#8b5cf6">
            {peSystemObjs.length > 0 ? (
              <div className="space-y-2">
                {peSystemObjs.map(sys => {
                  const saved = (note.peSavedData ?? {})[sys.id];
                  const hasFindings = saved && Object.values(saved).some(v => v.trim());
                  return (
                    <div key={sys.id} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-black text-violet-700 mb-1 uppercase tracking-wide">{sys.label}</p>
                      {hasFindings
                        ? <PeSummary systemId={sys.id} savedData={saved} />
                        : <p className="text-[10px] text-slate-400 italic">No findings recorded</p>
                      }
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No systems examined</p>
            )}
          </Section>

          {note.visitNote?.trim() && (
            <Section icon={<FileText className="h-3.5 w-3.5" />} title="Visit Note" color="#6366f1">
              <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">{note.visitNote}</p>
            </Section>
          )}
        </div>

      </div>
      )}

      {/* Signature footer */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
        <p className="text-[10px] text-slate-500">
          Electronically signed and added to the patient record.
        </p>
      </div>
    </div>
  );
}

export interface AddendumRow {
  date: string;
  day: string;
  time: string;
  type: string;
  doctor: string;
  selected: false;
  isNew: true;
  isAddendum: true;
  amendedFromDate: string;
}

function soapDummyToNoteState(dummy: SoapDummyNote): NoteState {
  return {
    chiefComplaints: dummy.cc,
    hpi: dummy.hpi,
    allergies: dummy.allergies.map((a, i) => ({
      id: `allergy-${i}`,
      name: a.name,
      allergenType: "Drug",
      date: "",
      reaction: a.reaction,
      onset: "",
      severity: a.severity.toLowerCase() as "severe" | "moderate" | "mild",
    })),
    pmhActive:       dummy.medicalHistory,
    pmhResolved:     [],
    surgicalRows:    [],
    fhRows:          dummy.familyHistory.map((h, i) => ({ id: `fh-${i}`, condition: h, relation: "" })),
    fhGenetic:       [],
    socialHistory:   EMPTY_SOCIAL_HISTORY,
    ros:             {},
    peSystems:       [],
    pocTests:        [],
    formulary:       EMPTY_FORMULARY,
    imaging:         EMPTY_IMAGING,
    carePlan:        EMPTY_CARE_PLAN,
    healthEd:        EMPTY_HEALTH_ED,
    referrals:       EMPTY_REFERRAL_DATA,
    procedureOrders: EMPTY_PROCEDURE_ORDERS,
    patientGoals:    EMPTY_PATIENT_GOALS,
    otherOrders:     dummy.otherOrders.join("\n"),
    visitNote:       dummy.visitDescription,
    followUpDate:    dummy.followUp,
    planTags:        [],
    labOrders:       [],
    labOrderDone:    false,
    diagnoses:       [],
    diagnosisDone:   false,
    hpiSavedData:    {},
    hpiDoneComplaints: [],
    peSavedData:     {},
    peDoneSystemIds: [],
  };
}


const SEV_COLOR: Record<string, string> = {
  Low:      "bg-sky-50 text-sky-700 border-sky-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  High:     "bg-red-50 text-red-700 border-red-200",
};

const ALG_SEV: Record<string, string> = {
  Severe:   "bg-red-50 text-red-700 border-red-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Mild:     "bg-sky-50 text-sky-700 border-sky-200",
};

function SoapNotePreview({ note }: { note: SoapDummyNote }) {
  const Section = ({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <span style={{ color }}>{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="px-6 py-5 bg-slate-50 border-t border-slate-100">

      {/* ── Vitals strip ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {[
          { label: "BP",     value: note.vitals.bp,     unit: "mmHg", color: "#4982CF" },
          { label: "Pulse",  value: note.vitals.pulse,  unit: "bpm",  color: "#ef4444" },
          { label: "Temp",   value: note.vitals.temp,   unit: "°C",   color: "#f59e0b" },
          { label: "SpO₂",  value: note.vitals.spo2,   unit: "%",    color: "#10b981" },
          { label: "Weight", value: note.vitals.weight, unit: "",     color: "#8b5cf6" },
        ].map(v => (
          <div key={v.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: v.color }}>{v.label}</span>
            <span className="text-xs font-black text-slate-800">{v.value}</span>
            {v.unit && <span className="text-[9px] text-slate-400">{v.unit}</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-8">

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
        <div>

          {/* Chief Complaint */}
          <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Chief Complaint" color="#4982CF">
            <div className="flex flex-wrap gap-1.5">
              {note.cc.map(c => (
                <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{c}</span>
              ))}
            </div>
          </Section>

          {/* History of Present Illness */}
          <Section icon={<FileText className="h-3.5 w-3.5" />} title="History of Present Illness" color="#6366f1">
            <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5">{note.hpi}</p>
          </Section>

          {/* Allergies */}
          <Section icon={<ShieldAlert className="h-3.5 w-3.5" />} title="Allergies" color="#ef4444">
            <div className="space-y-1.5">
              {note.allergies.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${ALG_SEV[a.severity]}`}>
                  <span className="text-[10px] font-black flex-shrink-0">{a.name}</span>
                  <div className="w-px self-stretch bg-current opacity-20 flex-shrink-0" />
                  <p className="text-[10px] flex-1">{a.reaction}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/60 flex-shrink-0">{a.severity}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Medical History */}
          <Section icon={<FileText className="h-3.5 w-3.5" />} title="Medical History" color="#6366f1">
            <div className="space-y-1">
              {note.medicalHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Surgical History */}
          <Section icon={<Scissors className="h-3.5 w-3.5" />} title="Surgical History" color="#f59e0b">
            <div className="space-y-1">
              {note.surgicalHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Family History */}
          <Section icon={<Users className="h-3.5 w-3.5" />} title="Family History" color="#ec4899">
            <div className="space-y-1">
              {note.familyHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Social History */}
          <Section icon={<Home className="h-3.5 w-3.5" />} title="Social History" color="#8b5cf6">
            <div className="flex flex-wrap gap-1.5">
              {note.socialHistory.map((h, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{h}</span>
              ))}
            </div>
          </Section>

          {/* Review of Systems */}
          <Section icon={<Activity className="h-3.5 w-3.5" />} title="Review of Systems" color="#0ea5e9">
            <div className="space-y-1">
              {note.ros.map((r, i) => {
                const positive = r.toLowerCase().includes("present") || r.toLowerCase().includes("positive");
                const absent   = r.toLowerCase().includes("absent") || r.toLowerCase().includes("negative");
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${positive ? "bg-amber-400" : absent ? "bg-emerald-400" : "bg-slate-300"}`} />
                    <p className="text-[11px] text-slate-600">{r}</p>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Physical Examination */}
          <Section icon={<Stethoscope className="h-3.5 w-3.5" />} title="Physical Examination" color="#8b5cf6">
            <div className="space-y-1.5">
              {note.pe.map((p, i) => (
                <div key={i} className="flex items-start gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600">{p}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Point of Care Labs */}
          {note.pocLabs.length > 0 && (
            <Section icon={<FlaskConical className="h-3.5 w-3.5" />} title="Point of Care Labs" color="#0ea5e9">
              <div className="space-y-1.5">
                {note.pocLabs.map((l, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${l.status === "Abnormal" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <span className="text-[10px] font-bold flex-1 text-slate-700">{l.test}</span>
                    <span className="text-[10px] font-black text-slate-800">{l.result}{l.unit ? ` ${l.unit}` : ""}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${l.status === "Abnormal" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════════ */}
        <div>

          {/* Assessment & Diagnosis */}
          <Section icon={<Target className="h-3.5 w-3.5" />} title="Assessment & Diagnosis" color="#ef4444">
            <div className="space-y-2">
              {note.diagnoses.map((d, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${SEV_COLOR[d.severity]}`}>
                  <span className="text-[10px] font-black font-mono">{d.code}</span>
                  <div className="w-px self-stretch bg-current opacity-20" />
                  <p className="text-[11px] font-semibold flex-1">{d.name}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/60">{d.severity}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Lab Orders */}
          {((note.labOrders ?? []).length > 0 || note.labs.length > 0) && (
            <Section icon={<Microscope className="h-3.5 w-3.5" />} title="Lab Orders" color="#f59e0b">
              {(note.labOrders ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(note.labOrders ?? []).map((order, idx) => (
                    <div key={idx} className={`rounded-lg border px-3 py-2 ${order.voided ? "border-rose-100 bg-rose-50/60" : "border-amber-100 bg-amber-50/40"}`}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${order.voided ? "text-rose-400 line-through" : "text-amber-700"}`}>
                          Order {idx + 1}
                          {idx === 0 ? " · Original" : " · Follow-up"}
                        </span>
                        {order.sentAt && (
                          <span className="text-[9px] text-slate-400">
                            · {new Date(order.sentAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                        {order.voided && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200">VOIDED</span>
                        )}
                      </div>
                      {order.voided && order.voidReason && (
                        <p className="text-[9px] text-rose-400 italic mb-1">Reason: {order.voidReason}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {order.tests.map(t => (
                          <span key={t.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${order.voided ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{t.name}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {note.labs.map(l => (
                    <span key={l} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{l}</span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Prescriptions */}
          <Section icon={<Pill className="h-3.5 w-3.5" />} title="Prescription" color="#8b5cf6">
            <div className="space-y-2">
              {note.prescriptions.map((rx, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-slate-800">{rx.drug}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{rx.sig}</p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex-shrink-0">Qty: {rx.qty}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Order Imaging */}
          {note.imaging.length > 0 && (
            <Section icon={<Eye className="h-3.5 w-3.5" />} title="Order Imaging" color="#0ea5e9">
              <div className="space-y-1">
                {note.imaging.map(img => (
                  <div key={img} className="flex items-center gap-2 text-[11px] text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-1.5">
                    <ScanLine className="h-3 w-3 flex-shrink-0" /> {img}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Care Plan */}
          {note.carePlan.length > 0 && (
            <Section icon={<BookOpen className="h-3.5 w-3.5" />} title="Care Plan" color="#10b981">
              <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 whitespace-pre-wrap">
                {note.carePlan}
              </p>
            </Section>
          )}

          {/* Procedure Orders */}
          {note.procedureOrders.length > 0 && (
            <Section icon={<ListChecks className="h-3.5 w-3.5" />} title="Procedure Orders" color="#f97316">
              <div className="space-y-1">
                {note.procedureOrders.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" /> {p}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Referrals */}
          {note.referrals.length > 0 && (
            <Section icon={<Send className="h-3.5 w-3.5" />} title="Referrals" color="#4982CF">
              <div className="space-y-1.5">
                {note.referrals.map((r, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-3">
                    <span className="text-[10px] font-black text-blue-700 flex-shrink-0 pt-0.5">{r.specialty}</span>
                    <div className="w-px self-stretch bg-blue-200 flex-shrink-0" />
                    <p className="text-[10px] text-blue-600">{r.reason}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Patient Goals */}
          <Section icon={<Target className="h-3.5 w-3.5" />} title="Patient Goals" color="#10b981">
            <div className="space-y-1">
              {note.patientGoals.map((g, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600">{g}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Health Education */}
          <Section icon={<BookMarked className="h-3.5 w-3.5" />} title="Health Education" color="#6366f1">
            <div className="space-y-1">
              {note.healthEducation.map((h, i) => (
                <div key={i} className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <p className="text-[11px] text-indigo-700">{h}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Other Orders */}
          {note.otherOrders.length > 0 && (
            <Section icon={<MessageSquare className="h-3.5 w-3.5" />} title="Other Orders" color="#94a3b8">
              <div className="space-y-1">
                {note.otherOrders.map((o, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    <p className="text-[11px] text-slate-600">{o}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Visit Description */}
          <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Visit Description" color="#4982CF">
            <p className="text-[11px] leading-relaxed text-slate-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 italic">{note.visitDescription}</p>
          </Section>

          {/* Footer — Follow-up + Signed by */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] text-slate-500">Follow-up Visit: <strong className="text-slate-700">{note.followUp}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
              <PenLine className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700">{note.signedBy}</span>
              <span className="text-[9px] text-emerald-500">· {note.signedAt}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Module Drawer ────────────────────────────────────────────────────────────

interface DrawerProps {
  label: string;
  Icon: React.ElementType;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

function CurrentMedicationsDrawer({ fullscreen, onToggleFullscreen, onClose }: Omit<DrawerProps, "label" | "Icon">) {
  const statusColor = (s: string) => s === "Active" ? "#10b981" : "#f59e0b";
  return (
    <>
      {!fullscreen && <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-30" />}
      <div className={["absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-40 transition-all duration-300", fullscreen ? "inset-0 w-full" : "w-[560px] border-l border-slate-200"].join(" ")}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
            <Pill className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <p className="text-sm font-black text-slate-800 flex-1">Current Medications</p>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: ACCENT }}>
            {CURRENT_MEDICATIONS.length}
          </span>
          <button onClick={onToggleFullscreen} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          {[
            { label: "Total", value: CURRENT_MEDICATIONS.length, color: ACCENT },
            { label: "Active", value: CURRENT_MEDICATIONS.filter(m => m.status === "Active").length, color: "#10b981" },
            { label: "On Hold", value: CURRENT_MEDICATIONS.filter(m => m.status === "On Hold").length, color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-lg font-black" style={{ color }}>{value}</span>
              <span className="text-[11px] text-slate-500 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Medication list */}
        <div className="flex-1 overflow-y-auto">
          {CURRENT_MEDICATIONS.map((med, i) => (
            <div key={i} className="px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${ACCENT}12` }}>
                    <Pill className="h-4 w-4" style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-800">{med.name}</span>
                      <span className="text-[11px] font-bold text-slate-500">{med.dose} · {med.form}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{med.frequency} · {med.route}</p>
                    <p className="text-xs text-slate-400 mt-1">For: <span className="text-slate-600 font-medium">{med.indication}</span></p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: `${statusColor(med.status)}18`, color: statusColor(med.status) }}>
                  {med.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2.5 pl-12">
                <span className="text-[10px] text-slate-400">Prescribed by <span className="text-slate-600 font-medium">{med.prescriber}</span></span>
                <span className="text-[10px] text-slate-400">Started <span className="text-slate-600 font-medium">{med.startDate}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ModuleDrawer({ label, Icon, fullscreen, onToggleFullscreen, onClose }: DrawerProps) {
  return (
    <>
      {/* Backdrop — only when NOT fullscreen so background is still visible */}
      {!fullscreen && (
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-30"
        />
      )}

      {/* Drawer panel */}
      <div
        className={[
          "absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-40 transition-all duration-300",
          fullscreen ? "inset-0 w-full" : "w-[480px] border-l border-slate-200",
        ].join(" ")}>

        {/* Drawer header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}15` }}>
            <Icon className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <p className="text-sm font-black text-slate-800 flex-1">{label}</p>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen
              ? <Minimize2 className="h-4 w-4" />
              : <Maximize2 className="h-4 w-4" />
            }
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer body — placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${ACCENT}10` }}>
            <Icon className="h-7 w-7" style={{ color: ACCENT }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Module coming soon</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SoapNotePageProps {
  entry: MultiEntry;
  onBack: () => void;
  doctorId?: string;
  faceSheetOpenedAt?: number;
  onSendToLab?: () => void;
  onDiscardLab?: () => void;
  onSaveAndClose?: () => void;
  onDoctorSign?: (noteState: NoteState | null) => void;
  signedRecords?: SignedRecord[];
  /** Past-session signed records shown in All Records but NOT used for the signed/locked state check. */
  historicalRecords?: SignedRecord[];
  /** Forwarded to ClinicalNoteDrawer to show a session badge, e.g. "Note #2". */
  noteLabel?: string;
}

export function SoapNotePage({ entry, onBack, doctorId, faceSheetOpenedAt, onSendToLab, onDiscardLab, onSaveAndClose, onDoctorSign, signedRecords = [], historicalRecords = [], noteLabel }: SoapNotePageProps) {
  const { draft, saveDraft, clearDraft } = useSoapNoteDraft(entry.id);

  const [openDrawer, setOpenDrawer]             = useState<string | null>(null);
  const [drawerFullscreen, setDrawerFullscreen] = useState(false);
  const [showNoteDrawer, setShowNoteDrawer]     = useState(false);
  const [expandedIndex, setExpandedIndex]       = useState<number | null>(null);
  const [openMenuIdx, setOpenMenuIdx]           = useState<number | null>(null);
  const [isPrinting,  setIsPrinting]            = useState(false);
  const [editingDummyIdx, setEditingDummyIdx]   = useState<number | null>(null);
  const [showAddendumDrawer, setShowAddendumDrawer] = useState(false);
  const [addendumRows, setAddendumRows]         = useState<AddendumRow[]>([]);
  const menuRef                                 = useRef<HTMLDivElement | null>(null);

  // Stamp an initial draft immediately on mount so hasSoapDraft() returns true
  // as soon as the doctor closes the note — even without editing anything.
  // saveDraft sets pendingRef; the useSoapNoteDraft unmount flush writes it to
  // localStorage synchronously when SoapNotePage unmounts.
  useEffect(() => {
    saveDraft(draft ?? EMPTY_NOTE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (openMenuIdx === null) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuIdx(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenuIdx]);

  const p       = entry.patient;
  const name    = p?.name  ?? "Walk-in Patient";
  const mrn     = p?.mrn   ?? "—";
  const dob     = p?.dob   ?? "—";
  const phone   = p?.phone ?? "—";
  const gender  = p?.gender === "F" ? "Female" : p?.gender === "O" ? "Other" : "Male";
  const address = "House 14, Street 7, DHA Phase 3, Lahore";
  const today   = formatToday();

  function openModule(label: string) {
    setOpenDrawer(label);
    setDrawerFullscreen(false);
  }

  function closeDrawer() {
    setOpenDrawer(null);
    setDrawerFullscreen(false);
  }

  const activeTabMeta = NAV_TABS.find(t => t.label === openDrawer);

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden relative">

      {/* ═══════════════════════════════════════════════════════════════════════
          FIXED HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-white shadow-sm z-10">

        {/* ── Row 1: Breadcrumb nav ────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Face Sheet
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            SOAP Notes — Consultation
          </span>
          <div className="flex-1" />
          <Button
            className="h-8 px-4 text-xs font-bold gap-1.5 text-white"
            style={{ backgroundColor: ACCENT }}
            onClick={onBack}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Save & Close
          </Button>
        </div>

        {/* ── Row 2: Patient info bar ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100">
          <div
            className="h-11 w-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-black text-white shadow"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #2d5fa8)` }}>
            {name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-0.5">
              <p className="text-base font-black text-slate-900 leading-tight">{name}</p>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ACCENT }}>
                {mrn}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-100">
                {gender}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
              <span>DOB: <strong className="text-slate-600">{dob}</strong></span>
              <span>Last Visit: <strong className="text-slate-600">21 Feb 2025</strong></span>
              <span>{phone}</span>
              <span>{address}</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Alerts strip ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-2 border-b border-red-100 bg-red-50">
          <div className="flex items-center gap-1.5 mr-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Conditions</span>
          </div>
          {CONDITIONS.map(c => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: c.color }}>
              {c.name}
              <span className="opacity-80">({c.code})</span>
            </span>
          ))}
          <div className="w-px h-4 bg-red-200 mx-1" />
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 mr-1">Allergies</span>
          {ALLERGIES_LIST.map(a => (
            <span
              key={a.name}
              title={`Reaction: ${a.reaction}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              {a.name}
              <span className="font-normal opacity-75">— {a.reaction}</span>
              <span className="ml-0.5 text-[9px] font-black opacity-60">· {a.severity}</span>
            </span>
          ))}
        </div>

        {/* ── Row 4: Vitals strip ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 overflow-x-auto">
          {VITALS.map(v => (
            <div
              key={v.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
              <span style={{ color: v.color }}>
                <v.Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{v.label}</p>
                <p className="text-sm font-black text-slate-800 leading-tight">
                  {v.value}&thinsp;
                  <span className="text-[9px] font-medium text-slate-400">{v.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 5: Module nav tabs (open drawer on click) ───────────────── */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-100">
          {NAV_TABS.map(({ label, Icon }) => {
            const active = openDrawer === label;
            return (
              <button
                key={label}
                onClick={() => active ? closeDrawer() : openModule(label)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 transition-all flex-shrink-0"
                style={active
                  ? { borderBottomColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}08` }
                  : { borderBottomColor: "transparent", color: "#94a3b8" }}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN SCROLLABLE CONTENT — always visible (SOAP notes)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-5">

          {/* ─── New Notes Panel ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800">New Notes</p>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: signedRecords.length > 0 ? "#94a3b8" : ACCENT }}>
                  {signedRecords.length > 0 ? 0 : 1}
                </span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                  <BookOpen className="h-3.5 w-3.5" />
                  Medical References
                </button>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {/* Addendum In Progress card */}
              {editingDummyIdx !== null && (
                <div
                  className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: "#f59e0b" }}>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow bg-amber-500">
                      <GitBranch className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-black text-slate-900">{today}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          In Progress
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Addendum · {editingDummyIdx >= 0 && editingDummyIdx < SOAP_DUMMY.length
                          ? NOTE_HISTORY[editingDummyIdx]?.date ?? ""
                          : "Signed Note"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Being edited by Dr. Asif Imam
                      </p>
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90 bg-amber-500"
                    onClick={() => setShowAddendumDrawer(true)}>
                    <FilePenLine className="h-3.5 w-3.5" /> Open
                  </button>
                </div>
              )}

              {/* Regular note card */}
              {signedRecords.length > 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                  <p className="text-sm font-semibold text-slate-500">Note signed and saved to All Records</p>
                  <p className="text-xs text-slate-400">No new notes in progress</p>
                </div>
              ) : (
                <div
                  className="flex items-start justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-4"
                  style={{ borderLeftWidth: 4, borderLeftColor: ACCENT }}>
                  <div className="flex items-start gap-4">
                    <div
                      className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow"
                      style={{ backgroundColor: ACCENT }}>
                      <Edit3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-black text-slate-900">{today}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          In Progress
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">Comprehensive Note</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Auto-created on entry · By Dr. Asif Imam
                      </p>
                    </div>
                  </div>
                  <button
                    className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                    onClick={() => setShowNoteDrawer(true)}>
                    <FileText className="h-3.5 w-3.5" /> Open Note
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── All Records Section ────────────────────────────────────────── */}
          {(() => {
            const allRows = [
              ...addendumRows,
              ...signedRecords.map(r => ({ ...r, selected: false, isNew: true, isAddendum: false as const })).reverse(),
              ...historicalRecords.map(r => ({ ...r, selected: false, isNew: true, isAddendum: false as const })).reverse(),
              ...NOTE_HISTORY.map(r => ({ ...r, isNew: false, isAddendum: false as const })),
            ];
            return (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-800">All Records</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {allRows.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:text-slate-800 transition-colors">
                      Order by Patient Event Date
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div>
                  {allRows.map((note, i) => {
                    const isOpen   = expandedIndex === i;
                    const isAddendum = (note as AddendumRow).isAddendum === true;
                    const dummyOffset = addendumRows.length + signedRecords.length;
                    const dummyIdx = (!note.isNew && !isAddendum) ? i - dummyOffset : -1;
                    const dummy    = dummyIdx >= 0 && dummyIdx < SOAP_DUMMY.length ? SOAP_DUMMY[dummyIdx] : null;
                    const menuOpen = openMenuIdx === i;
                    return (
                    <div
                      key={i}
                      className={`transition-colors ${i < allRows.length - 1 ? "border-b border-slate-100" : ""}`}>

                      {/* ── Row header ── */}
                      <div className={`flex items-stretch ${isAddendum ? "bg-amber-50" : note.isNew ? "bg-emerald-50" : (note as {selected?: boolean}).selected ? "bg-blue-50" : isOpen ? "bg-slate-50" : "hover:bg-slate-50"}`}>
                        <div
                          className="w-1 flex-shrink-0"
                          style={{ backgroundColor: isAddendum ? "#f59e0b" : note.isNew ? "#10b981" : (note as {selected?: boolean}).selected ? ACCENT : "transparent" }}
                        />

                        <div className="flex items-center gap-5 px-5 py-4 flex-1 min-w-0">
                          <div className="w-28 flex-shrink-0">
                            <p className="text-xs font-black text-slate-800 leading-tight">
                              {note.date.split(" ").slice(0, 2).join(" ")}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {note.date.split(" ").slice(2).join(" ")}
                            </p>
                          </div>

                          <div className="w-px self-stretch bg-slate-200 flex-shrink-0" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-black text-slate-800">{note.day}</span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {note.time}
                              </span>
                              {isAddendum && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <GitBranch className="h-2.5 w-2.5" /> Addendum
                                </span>
                              )}
                              {!isAddendum && note.isNew && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Signed
                                </span>
                              )}
                              {!isAddendum && !note.isNew && (note as {selected?: boolean}).selected && (
                                <span
                                  className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: ACCENT }}>
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-600">{note.type}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">By {note.doctor}</p>
                            {isAddendum && (
                              <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                                <GitBranch className="h-2.5 w-2.5" />
                                Addendum to: {(note as AddendumRow).amendedFromDate}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setExpandedIndex(isOpen ? null : i)}
                              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                isOpen
                                  ? "border-slate-300 bg-slate-100 text-slate-700"
                                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 bg-white"
                              }`}>
                              {isOpen
                                ? <><ChevronUp className="h-3 w-3" /> Collapse</>
                                : <><ChevronRight className="h-3 w-3" /> Expand</>
                              }
                            </button>
                            {/* ── 3-dot menu ── */}
                            <div className="relative" ref={menuOpen ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuIdx(menuOpen ? null : i)}
                                className={`p-1.5 rounded-lg border transition-colors ${menuOpen ? "border-slate-300 bg-slate-100 text-slate-700" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white"}`}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                              {menuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                  <button
                                    disabled={isPrinting}
                                    onClick={() => {
                                      if (isPrinting) return;
                                      setOpenMenuIdx(null);
                                      const nk: PrintNoteKind = dummy
                                        ? { kind: "dummy", note: dummy }
                                        : (!isAddendum && note.isNew && "noteState" in note && note.noteState)
                                          ? (() => {
                                              const ns = (note as SignedRecord).noteState!;
                                              const form = ns.specialtyFormId
                                                ? loadForms().find(f => f.id === ns.specialtyFormId)
                                                : undefined;
                                              return { kind: "live" as const, noteState: ns, form };
                                            })()
                                          : { kind: "empty" as const };
                                      setIsPrinting(true);
                                      void printHealthRecord({
                                        patient: { name, mrn },
                                        noteRow: {
                                          date: note.date,
                                          time: note.time,
                                          type: note.type,
                                          doctor: note.doctor,
                                        },
                                        visitType: noteLabel ?? note.type,
                                        noteKind: nk,
                                      }).finally(() => setIsPrinting(false));
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                                    {isPrinting ? "Generating…" : "Print"}
                                  </button>
                                  {!isAddendum && (
                                    <button
                                      onClick={() => {
                                        setOpenMenuIdx(null);
                                        setEditingDummyIdx(dummy !== null ? dummyIdx : -99);
                                        setShowAddendumDrawer(true);
                                        setShowNoteDrawer(false);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100">
                                      <FilePenLine className="h-3.5 w-3.5 text-slate-400" /> Edit Note
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>{/* end row header */}

                      {/* ── Expand panel ── */}
                      {isOpen && (
                        dummy
                          ? <SoapNotePreview note={dummy} />
                          : (!isAddendum && note.isNew && "noteState" in note && note.noteState)
                          ? <LiveNotePreview note={(note as SignedRecord & { isNew: true; isAddendum: false }).noteState as NoteState} />
                          : (
                            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
                              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800">Note Signed Successfully</p>
                                <p className="text-[11px] text-slate-500 mt-1">Signed by <strong>{note.doctor}</strong> on {note.date} at {note.time}</p>
                                <p className="text-[11px] text-slate-400 mt-1">This consultation note has been electronically signed and added to the patient record.</p>
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  );
                  })}
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CLINICAL NOTE DRAWER (Open Note)
      ═══════════════════════════════════════════════════════════════════════ */}
      {showNoteDrawer && (
        <ClinicalNoteDrawer
          entryId={entry.id}
          patientName={name}
          doctorId={doctorId}
          faceSheetOpenedAt={faceSheetOpenedAt}
          noteLabel={noteLabel}
          awaitingLab={entry.pendingLab}
          labResultsReady={entry.labResultsReady}
          onSendToLab={onSendToLab}
          onDiscardLab={onDiscardLab}
          onSaveAndClose={onSaveAndClose}
          signed={signedRecords.length > 0}
          initialNote={draft ?? undefined}
          onNoteChange={saveDraft}
          onDoctorSign={() => {
            // Capture routing flags before wiping the draft — handleFaceSheetComplete reads these
            const unsentOrders = (draft?.labOrders ?? []).filter(o => !o.sentAt && !o.voided);
            saveRoutingSnapshot(entry.id, {
              hasUnsentLabOrders: unsentOrders.length > 0,
              hasPrescription: (draft?.formulary?.medicines?.length ?? 0) > 0,
            });
            // Persist unsent lab orders BEFORE clearDraft() erases them — the Lab Panel
            // reads from ehr_pending_lab_orders_{id} since the draft is gone by then.
            if (unsentOrders.length > 0) savePendingLabOrders(entry.id, unsentOrders);
            // Persist clinical snapshot per-patient BEFORE clearing the draft.
            // This accumulates allergies/medicines/labs/imaging/fhRows/diagnoses
            // across signed visits so Patient Profile can read from signed history.
            if (draft && entry.patient?.mrn) {
              savePatientClinicalSnapshot(draft, entry.patient.mrn);
            }
            const noteStateToPersist = draft;
            clearDraft();
            onDoctorSign?.(noteStateToPersist);
            setShowNoteDrawer(false);
          }}
          onClose={() => setShowNoteDrawer(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ADDENDUM DRAWER (Edit Note → Addendum mode)
      ═══════════════════════════════════════════════════════════════════════ */}
      {editingDummyIdx !== null && showAddendumDrawer && (() => {
        const srcDummy = editingDummyIdx >= 0 && editingDummyIdx < SOAP_DUMMY.length
          ? SOAP_DUMMY[editingDummyIdx]
          : null;
        const amendedDate = editingDummyIdx >= 0 && editingDummyIdx < NOTE_HISTORY.length
          ? NOTE_HISTORY[editingDummyIdx].date
          : today;
        return (
          <ClinicalNoteDrawer
            patientName={name}
            isAddendumMode
            initialNote={srcDummy ? soapDummyToNoteState(srcDummy) : undefined}
            onAddendum={(filledNote) => {
              const now = new Date();
              const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
              const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              const newRow: AddendumRow = {
                date: `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
                day:  days[now.getDay()],
                time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
                type: "Addendum Note",
                doctor: "Dr. Asif Imam",
                selected: false,
                isNew: true,
                isAddendum: true,
                amendedFromDate: amendedDate,
              };
              setAddendumRows(prev => [newRow, ...prev]);
              setEditingDummyIdx(null);
              setShowAddendumDrawer(false);
              void filledNote;
            }}
            onClose={() => setShowAddendumDrawer(false)}
            onCancel={() => { setEditingDummyIdx(null); setShowAddendumDrawer(false); }}
          />
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODULE DRAWER (right-side overlay)
      ═══════════════════════════════════════════════════════════════════════ */}
      {!showNoteDrawer && openDrawer === "Current Medications" && (
        <CurrentMedicationsDrawer
          fullscreen={drawerFullscreen}
          onToggleFullscreen={() => setDrawerFullscreen(f => !f)}
          onClose={closeDrawer}
        />
      )}

      {!showNoteDrawer && openDrawer && openDrawer !== "Labs" && openDrawer !== "Scanned Documents" && openDrawer !== "Current Medications" && activeTabMeta && (
        <ModuleDrawer
          label={openDrawer}
          Icon={activeTabMeta.Icon}
          fullscreen={drawerFullscreen}
          onToggleFullscreen={() => setDrawerFullscreen(f => !f)}
          onClose={closeDrawer}
        />
      )}

      {/* Labs drawer */}
      {!showNoteDrawer && openDrawer === "Labs" && (
        <LabsDrawer
          entry={entry}
          fullscreen={drawerFullscreen}
          onToggleFullscreen={() => setDrawerFullscreen(f => !f)}
          onClose={closeDrawer}
        />
      )}

      {/* Scanned Documents drawer */}
      {!showNoteDrawer && openDrawer === "Scanned Documents" && (
        <ScannedDocumentsDrawer
          patientId={entry.patient?.mrn ? getPatientIdByMrn(entry.patient.mrn) : (entry.patient?.id ?? "")}
          doctorId={doctorId}
          fullscreen={drawerFullscreen}
          onToggleFullscreen={() => setDrawerFullscreen(f => !f)}
          onClose={closeDrawer}
        />
      )}

    </div>
  );
}
