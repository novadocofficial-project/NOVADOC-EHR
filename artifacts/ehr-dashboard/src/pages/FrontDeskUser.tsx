import { useState, useEffect, useRef } from "react";
import {
  PhoneCall, UserCheck, CreditCard, SkipForward, RotateCcw,
  ChevronUp, Clock, User, AlertCircle, CheckCircle2, X,
  Fingerprint, CreditCard as CardIcon, Search,
  Building2, Shield, Heart, FileSignature, Phone, MapPin,
  CalendarDays, Hash, UserPlus, Banknote, RefreshCw,
  Maximize2, Minimize2, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueAppHeader, SEED_PATIENTS, timeAgo, Patient, uid } from "@/pages/QueuePageLayout";
import { useMultiStepQueue, MultiEntry } from "@/hooks/useMultiStepQueue";

// ─── Constants ────────────────────────────────────────────────────────────────

const CALL_WINDOW_SECS = 30;
const MAX_CALLS = 3;

function getSecsLeft(callTimestamp: number | null): number {
  if (!callTimestamp) return 0;
  return Math.max(0, CALL_WINDOW_SECS - Math.floor((Date.now() - callTimestamp) / 1000));
}

// ─── Right Drawer ─────────────────────────────────────────────────────────────
// Children are responsible for their own scroll + footer layout
// (flex flex-col h-full with an overflow-y-auto region + a fixed footer div)

interface RightDrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function RightDrawer({ title, subtitle, onClose, children }: RightDrawerProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-l border-slate-200 ${
          fullscreen ? "w-full" : "w-[40%] min-w-[480px]"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? "Collapse" : "Expand to full screen"}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content — each child manages its own scroll + footer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Registration Content ─────────────────────────────────────────────────────
// Layout: tabs (fixed) → scrollable form → pinned footer button

type RegMode = "search" | "new";

interface RegistrationContentProps {
  onRegister: (patient: Patient) => void;
  isReassign?: boolean;
}

function RegistrationContent({ onRegister, isReassign = false }: RegistrationContentProps) {
  const [mode, setMode]       = useState<RegMode>("search");
  const [searchQ, setSearchQ] = useState("");
  const [found, setFound]     = useState<Patient | null>(null);

  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [dob, setDob]               = useState("");
  const [phone, setPhone]           = useState("");
  const [address, setAddress]       = useState("");
  const [cnic, setCnic]             = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [relation, setRelation]     = useState("self");
  const [relName, setRelName]       = useState("");
  const [relContact, setRelContact] = useState("");
  const [relCnic, setRelCnic]       = useState("");
  const [relDob, setRelDob]         = useState("");
  const [patientType, setPatientType] = useState("cash");
  const [insCompany, setInsCompany]   = useState("");
  const [insNumber, setInsNumber]     = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes]           = useState("");
  const [showWelfare, setShowWelfare] = useState(false);
  const sigCanvasRef                = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing]       = useState(false);

  const filtered = SEED_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchQ.toLowerCase()) ||
    p.phone.includes(searchQ) ||
    (searchQ.length > 3 && p.dob.includes(searchQ))
  );

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const cv = sigCanvasRef.current; if (!cv) return;
    setDrawing(true);
    const r = cv.getBoundingClientRect();
    const ctx = cv.getContext("2d")!;
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  }
  function drawLine(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const cv = sigCanvasRef.current; if (!cv) return;
    const r = cv.getBoundingClientRect();
    const ctx = cv.getContext("2d")!;
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
  }
  function endDraw() { setDrawing(false); }
  function clearSig() {
    const cv = sigCanvasRef.current; if (!cv) return;
    cv.getContext("2d")!.clearRect(0, 0, cv.width, cv.height);
  }

  function handleConfirmExisting() {
    if (!found) return;
    onRegister(found);
  }

  function handleRegisterNew() {
    if (!firstName || !dob || !phone || !cnic) return;
    const newPatient: Patient = {
      id: uid(),
      mrn: "MR-" + Math.floor(45000 + Math.random() * 5000),
      name: `${firstName} ${lastName}`.trim(),
      phone, dob, gender: "M",
    };
    onRegister(newPatient);
  }

  const needsRelDetails = relation !== "self";
  const needsInsDetails = patientType === "insurance" || patientType === "corporate";
  const isWelfare       = patientType === "welfare";
  const canSubmitNew    = !!(firstName && dob && phone && cnic);

  return (
    <div className="flex flex-col h-full">

      {/* ── Tab switcher (fixed top) ──────────────────────────────── */}
      <div className="flex gap-1 px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
        {(["search", "new"] as RegMode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`h-8 px-5 rounded-full text-xs font-bold transition-all ${mode === m ? "bg-[#4982CF] text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {m === "search" ? "Search Existing" : "Register New"}
          </button>
        ))}
      </div>

      {/* ── Scrollable form area ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* SEARCH MODE */}
        {mode === "search" && (
          <div className="p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by name, MRN, phone, or CNIC..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus />
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] transition-colors flex-1 justify-center">
                <CardIcon className="h-4 w-4" /> Scan Card
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] transition-colors flex-1 justify-center">
                <Fingerprint className="h-4 w-4" /> Scan Thumb
              </button>
            </div>

            {searchQ.length > 0 && (
              <div className="space-y-2">
                {filtered.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-6">No patients found</p>
                )}
                {filtered.map(p => (
                  <button key={p.id} onClick={() => setFound(p === found ? null : p)}
                    className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all ${found?.id === p.id ? "border-[#4982CF] bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.mrn} · {p.phone}</p>
                    </div>
                    {found?.id === p.id && <CheckCircle2 className="h-5 w-5 text-[#4982CF] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEW PATIENT MODE */}
        {mode === "new" && (
          <div className="p-5 space-y-5">
            {/* MR No */}
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <Hash className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient ID / MR No</p>
                <p className="text-sm font-mono font-bold text-slate-700">MR-{Math.floor(45100 + Math.random() * 900)} (auto-generated)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">First Name <span className="text-red-500">*</span></label>
                <Input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Last Name</label>
                <Input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Date of Birth <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input className="pl-8" type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input className="pl-8" placeholder="+92 300 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">CNIC <span className="text-red-500">*</span></label>
                <Input placeholder="00000-0000000-0" value={cnic} onChange={e => setCnic(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Referred By</label>
                <Input placeholder="Referrer name" value={referredBy} onChange={e => setReferredBy(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Complete Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <textarea className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16"
                  placeholder="Street, area, city..." value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Relationship</label>
              <Select value={relation} onValueChange={setRelation}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {needsRelDetails && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{relation} Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Name</label>
                    <Input placeholder="Full name" value={relName} onChange={e => setRelName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Contact</label>
                    <Input placeholder="Phone" value={relContact} onChange={e => setRelContact(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">CNIC</label>
                    <Input placeholder="00000-0000000-0" value={relCnic} onChange={e => setRelCnic(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Date of Birth</label>
                    <Input type="date" value={relDob} onChange={e => setRelDob(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-2 block">Type of Patient</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: "cash",      label: "Cash",      icon: <Banknote className="h-4 w-4" />,  color: "#10b981" },
                  { v: "corporate", label: "Corporate", icon: <Building2 className="h-4 w-4" />, color: "#f59e0b" },
                  { v: "insurance", label: "Insurance", icon: <Shield className="h-4 w-4" />,    color: "#4982CF" },
                  { v: "welfare",   label: "Welfare",   icon: <Heart className="h-4 w-4" />,     color: "#ef4444" },
                ].map(t => (
                  <button key={t.v} onClick={() => setPatientType(t.v)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition-all ${patientType === t.v ? "text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                    style={patientType === t.v ? { borderColor: t.color, backgroundColor: t.color } : undefined}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>
            </div>

            {needsInsDetails && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {patientType === "insurance" ? "Insurance Details" : "Corporate Details"}
                </p>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">
                    {patientType === "insurance" ? "Insurance Company" : "Corporate Organisation"}
                  </label>
                  <Select value={insCompany} onValueChange={setInsCompany}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jubilee">Jubilee Insurance</SelectItem>
                      <SelectItem value="efulife">EFU Life</SelectItem>
                      <SelectItem value="adamjee">Adamjee Insurance</SelectItem>
                      <SelectItem value="igicorp">IGI Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">
                      {patientType === "insurance" ? "Insurance Number" : "Employee ID"}
                    </label>
                    <Input placeholder="ID / Number" value={insNumber} onChange={e => setInsNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Emergency Contact</label>
                    <Input placeholder="Phone" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {isWelfare && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-red-500" />
                    <p className="text-sm font-bold text-red-700">Welfare Form Required</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowWelfare(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700">Skip for later</button>
                    <button onClick={() => setShowWelfare(v => !v)}
                      className="h-7 px-3 rounded-full bg-red-500 text-white text-xs font-bold">
                      {showWelfare ? "Hide" : "Open Form"}
                    </button>
                  </div>
                </div>
                {showWelfare && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-semibold text-red-700">Patient Signature</p>
                    <div className="rounded-xl border-2 border-dashed border-red-200 bg-white overflow-hidden">
                      <canvas ref={sigCanvasRef} width={560} height={120}
                        className="w-full touch-none cursor-crosshair"
                        onMouseDown={startDraw} onMouseMove={drawLine} onMouseUp={endDraw} onMouseLeave={endDraw} />
                    </div>
                    <button onClick={clearSig} className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Clear Signature
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
              <textarea className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16"
                placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Pinned footer ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white px-5 py-4">
        {mode === "search" ? (
          found ? (
            <Button className="w-full h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
              onClick={handleConfirmExisting}>
              <UserCheck className="h-4 w-4" />
              {isReassign ? `Reassign to ${found.name}` : `Confirm — ${found.name}`}
            </Button>
          ) : (
            <Button className="w-full h-11 text-sm font-bold gap-2 opacity-40 cursor-not-allowed" disabled
              style={{ backgroundColor: "#4982CF" }}>
              <Search className="h-4 w-4" /> Search and select a patient above
            </Button>
          )
        ) : (
          <Button className="w-full h-11 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
            disabled={!canSubmitNew} onClick={handleRegisterNew}>
            <UserPlus className="h-4 w-4" />
            {isReassign ? "Register & Reassign Patient" : "Register Patient & Continue"}
          </Button>
        )}
      </div>

    </div>
  );
}

// ─── Billing Content ───────────────────────────────────────────────────────────
// Layout: scrollable form area → pinned footer button

interface BillingContentProps {
  entry: MultiEntry;
  onComplete: () => void;
}

function BillingContent({ entry, onComplete }: BillingContentProps) {
  const [payMethod, setPayMethod] = useState("cash");
  const [amount, setAmount]       = useState("500");

  return (
    <div className="flex flex-col h-full">

      {/* ── Scrollable billing form ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Patient summary */}
        <div className="rounded-xl border border-[#4982CF]/20 bg-blue-50/60 px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#4982CF]/15 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-[#4982CF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {entry.patient?.name ?? "Walk-in Patient"}
            </p>
            {entry.patient && <p className="text-xs text-slate-400">{entry.patient.mrn} · {entry.patient.phone}</p>}
          </div>
          <span className="font-mono font-black text-[#4982CF] text-sm flex-shrink-0">{entry.tokenNumber}</span>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Payment Method</p>
          <div className="flex gap-2">
            {[
              { v: "cash",      label: "Cash",      icon: <Banknote className="h-3.5 w-3.5" /> },
              { v: "card",      label: "Card",      icon: <CreditCard className="h-3.5 w-3.5" /> },
              { v: "insurance", label: "Insurance", icon: <Shield className="h-3.5 w-3.5" /> },
            ].map(m => (
              <button key={m.v} onClick={() => setPayMethod(m.v)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold flex-1 justify-center transition-all ${payMethod === m.v ? "border-[#4982CF] bg-[#4982CF] text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Consultation Fee (PKR)</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
            <Input className="pl-8 h-11 text-base font-bold" type="number" value={amount}
              onChange={e => setAmount(e.target.value)} />
          </div>
        </div>

        {/* Quick amounts */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Quick Select</p>
          <div className="flex gap-2 flex-wrap">
            {["200", "500", "800", "1000", "1500"].map(v => (
              <button key={v} onClick={() => setAmount(v)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${amount === v ? "border-[#4982CF] bg-[#4982CF]/10 text-[#4982CF]" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                Rs. {v}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── Pinned footer ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-100 bg-white px-5 py-4">
        <Button className="w-full h-12 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
          onClick={onComplete}>
          <CheckCircle2 className="h-4 w-4" />
          Mark Payment Completed · Rs. {amount}
        </Button>
      </div>

    </div>
  );
}

// ─── Front Desk User Page ─────────────────────────────────────────────────────

type DrawerType = "registration" | "reassign" | "billing" | null;

export function FrontDeskUser() {
  const {
    queue,
    fdCall, fdTimerExpire, fdRegisterStart, fdRegisterComplete,
    fdBilling, fdCompleteBilling, fdSkip, fdRecall,
  } = useMultiStepQueue();

  const [tick, setTick]               = useState(0);
  const [showSkipped, setShowSkipped] = useState(false);
  const [drawerType, setDrawerType]   = useState<DrawerType>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  // Billing setting for this counter (ctr-1 = Registration Desk 1)
  const billingEnabled = (() => {
    try {
      const stored = localStorage.getItem("ehr-billing-counters");
      if (stored) {
        const map = JSON.parse(stored) as Record<string, boolean>;
        return map["ctr-1"] ?? true;
      }
      return JSON.parse(localStorage.getItem("ehr-billing-reg") ?? "true");
    } catch { return true; }
  })();

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    queue.forEach(e => {
      if (!e.callTimestamp) return;
      const elapsed = Date.now() - e.callTimestamp;
      if (elapsed >= CALL_WINDOW_SECS * 1000) {
        fdTimerExpire(e.id);
        if (e.callCount >= MAX_CALLS) showToastMsg(`Token ${e.tokenNumber} auto-skipped after ${MAX_CALLS} calls`);
      }
    });
  }, [tick]);

  function showToastMsg(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3500);
  }

  function closeDrawer() {
    setDrawerType(null);
    setActiveEntryId(null);
  }

  // Front desk sees only step-1, non-completed, non-skipped tokens (FIFO)
  const fdQueue = queue
    .filter(e => e.step === 1 && e.status !== "completed" && !e.skipped)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const skippedQueue    = queue.filter(e => e.step === 1 && e.skipped);
  const atCounterEntry  = fdQueue.find(e => e.status === "called") ?? null;
  const activeCallEntry = fdQueue.find(e => e.callTimestamp !== null && getSecsLeft(e.callTimestamp) > 0) ?? null;
  const waitingTokens   = fdQueue.filter(e => e.status === "waiting" && !e.callTimestamp && e.id !== atCounterEntry?.id);
  const activeDrawerEntry = queue.find(e => e.id === activeEntryId) ?? atCounterEntry ?? null;

  function handleCall(id: string) {
    fdCall(id); showToastMsg("Token called — 30 second window started");
  }

  function handleRegisterClick(entry: MultiEntry) {
    fdRegisterStart(entry.id);
    setActiveEntryId(entry.id);
    setDrawerType("registration");
  }

  function handleReassignClick(entry: MultiEntry) {
    setActiveEntryId(entry.id);
    setDrawerType("reassign");
  }

  function handleBillingClick(entry: MultiEntry) {
    fdBilling(entry.id);
    setActiveEntryId(entry.id);
    setDrawerType("billing");
    showToastMsg(`${entry.tokenNumber} is now At Counter`);
  }

  function handleOpenBillingDrawer(entry: MultiEntry) {
    setActiveEntryId(entry.id);
    setDrawerType("billing");
  }

  function handleRegComplete(patient: Patient) {
    if (!activeEntryId) return;
    fdRegisterComplete(activeEntryId, patient);
    closeDrawer();
    const verb = drawerType === "reassign" ? "reassigned" : "registered";
    showToastMsg(`Patient ${verb} — ${patient.name}`);
  }

  function handleBillingComplete() {
    if (!activeEntryId) return;
    fdCompleteBilling(activeEntryId);
    closeDrawer();
    showToastMsg("Payment completed — token advanced to next step");
  }

  function handleSkip(id: string) {
    fdSkip(id); closeDrawer(); showToastMsg("Token skipped");
  }

  function handleRecall(id: string, tokenNum: string) {
    fdRecall(id); showToastMsg(`Token ${tokenNum} recalled to queue`);
  }

  const secsLeft = getSecsLeft(activeCallEntry?.callTimestamp ?? null);
  const timerPct = (secsLeft / CALL_WINDOW_SECS) * 100;

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <QueueAppHeader />

      {/* Assignment bar */}
      <div className="flex items-center gap-3 bg-[#4982CF] px-6 py-2.5 flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Registration Counter · Main Branch — Lahore</p>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/70">Billing:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${billingEnabled ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}>
            {billingEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Queue Stats</p>
            {[
              { label: "At Counter", value: fdQueue.filter(e => e.status === "called").length, color: "text-[#4982CF]", bg: "bg-blue-50 border-blue-200" },
              { label: "Waiting",    value: waitingTokens.length,                               color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
              { label: "Skipped",    value: skippedQueue.length,                                color: "text-red-600",   bg: "bg-red-50 border-red-200" },
            ].map(s => (
              <div key={s.label} className={`flex items-center justify-between rounded-xl border px-4 py-2.5 mb-2 ${s.bg}`}>
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Assigned Queues</p>
            <div className="rounded-xl border border-[#4982CF]/30 bg-blue-50 px-4 py-3">
              <p className="text-sm font-bold text-[#4982CF]">Registration Queue</p>
              <p className="text-xs text-slate-500 mt-0.5">Step 1 tokens · Billing enabled</p>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* ── AT COUNTER ─────────────────────────────────────────── */}
            {atCounterEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[#4982CF] animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4982CF]">Now At Counter</p>
                </div>
                <div className="rounded-2xl border-2 border-[#4982CF]/30 bg-white shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-[#4982CF]" />
                  <div className="flex items-center gap-5 px-6 py-5">
                    {/* Token */}
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 border-[#4982CF]/50 bg-blue-50 px-6 py-3">
                        <p className="font-mono font-black text-2xl text-[#4982CF]">{atCounterEntry.tokenNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Call #{atCounterEntry.callCount}</p>
                    </div>
                    {/* Patient */}
                    <div className="flex-1 min-w-0">
                      {atCounterEntry.patient ? (
                        <>
                          <p className="text-base font-black text-slate-900 leading-tight">{atCounterEntry.patient.name}</p>
                          <p className="text-xs text-slate-400">{atCounterEntry.patient.mrn} · {atCounterEntry.patient.phone}</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4982CF] animate-pulse" />
                        <span className="text-xs font-semibold text-[#4982CF]">At Counter</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(atCounterEntry.createdAt)}</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {billingEnabled ? (
                        <Button className="h-10 px-5 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                          onClick={() => handleOpenBillingDrawer(atCounterEntry)}>
                          <CreditCard className="h-4 w-4" /> Billing
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => handleSkip(atCounterEntry.id)}>
                          <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip
                        </Button>
                      )}
                      {/* Reassign patient button */}
                      <Button variant="outline" size="sm"
                        className="h-8 px-3 text-xs border-slate-200 text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] gap-1.5"
                        onClick={() => handleReassignClick(atCounterEntry)}>
                        <Pencil className="h-3 w-3" />
                        {atCounterEntry.patient ? "Reassign Patient" : "Assign Patient"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIVE CALL WINDOW ─────────────────────────────────── */}
            {activeCallEntry && !atCounterEntry && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Call Window Active</p>
                </div>
                <div className="rounded-2xl border-2 border-amber-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-1.5 w-full bg-slate-100 relative">
                    <div className="h-full transition-all duration-1000"
                      style={{ width: `${timerPct}%`, backgroundColor: secsLeft < 10 ? "#ef4444" : "#f59e0b" }} />
                  </div>
                  <div className="flex items-center gap-5 px-6 py-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 py-3">
                        <p className="font-mono font-black text-2xl text-amber-700">{activeCallEntry.tokenNumber}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Attempt {activeCallEntry.callCount}/{MAX_CALLS}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {activeCallEntry.patient ? (
                        <>
                          <p className="text-base font-black text-slate-900 leading-tight">{activeCallEntry.patient.name}</p>
                          <p className="text-xs text-slate-400">{activeCallEntry.patient.mrn}</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-slate-500">Walk-in Patient</p>
                      )}
                      <p className="text-sm font-semibold text-amber-600 mt-1">Window expires in {secsLeft}s</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {activeCallEntry.patient ? (
                        <>
                          <Button className="h-10 px-5 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                            onClick={() => handleBillingClick(activeCallEntry)}>
                            <CreditCard className="h-4 w-4" /> Billing
                          </Button>
                          <Button variant="outline" size="sm"
                            className="h-8 px-3 text-xs border-slate-200 text-slate-500 hover:border-[#4982CF] hover:text-[#4982CF] gap-1.5"
                            onClick={() => handleReassignClick(activeCallEntry)}>
                            <Pencil className="h-3 w-3" /> Reassign
                          </Button>
                        </>
                      ) : (
                        <Button className="h-11 px-6 text-sm font-bold gap-2" style={{ backgroundColor: "#4982CF" }}
                          onClick={() => handleRegisterClick(activeCallEntry)}>
                          <UserCheck className="h-4 w-4" /> Register
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                        onClick={() => handleSkip(activeCallEntry.id)}>
                        <SkipForward className="h-3 w-3 mr-1" /> Skip Token
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── WAITING QUEUE ───────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  Waiting in Queue · {waitingTokens.length}
                </p>
              </div>

              {waitingTokens.length === 0 && !atCounterEntry && !activeCallEntry && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <UserCheck className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Queue is empty</p>
                  <p className="text-xs">No tokens waiting at registration</p>
                </div>
              )}

              <div className="space-y-2">
                {waitingTokens.map((entry, idx) => {
                  const isFirst = idx === 0 && !atCounterEntry && !activeCallEntry;
                  return (
                    <div key={entry.id}
                      className={`flex items-center gap-4 rounded-xl border px-4 py-3 bg-white transition-all ${isFirst ? "border-slate-300 shadow-sm" : "border-slate-100 opacity-70"}`}>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black bg-slate-100 text-slate-500">
                        {idx + 1}
                      </div>
                      <div className="font-mono font-black text-sm text-slate-700 flex-shrink-0">{entry.tokenNumber}</div>
                      <div className="flex-1 min-w-0">
                        {entry.patient ? (
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {entry.patient.name}
                            <span className="ml-2 text-xs font-normal text-slate-400">{entry.patient.mrn}</span>
                          </p>
                        ) : (
                          <p className="text-sm font-bold text-slate-500">Walk-in Patient</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                      {isFirst ? (
                        <Button size="sm" className="h-8 px-4 text-xs font-bold flex-shrink-0 gap-1.5"
                          style={{ backgroundColor: "#4982CF" }} onClick={() => handleCall(entry.id)}>
                          <PhoneCall className="h-3.5 w-3.5" /> Call
                        </Button>
                      ) : (
                        <div className="h-8 px-4 flex items-center text-[10px] font-semibold text-slate-400 flex-shrink-0">Locked</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>{/* end scrollable */}

          {/* ── SKIPPED TOKENS SLIDE-UP ─────────────────────────────── */}
          {skippedQueue.length > 0 && (
            <>
              <button onClick={() => setShowSkipped(v => !v)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-red-200 bg-white shadow-lg px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-all z-10">
                <AlertCircle className="h-3.5 w-3.5" />
                Skipped Tokens ({skippedQueue.length})
                <ChevronUp className={`h-3.5 w-3.5 transition-transform ${showSkipped ? "rotate-180" : ""}`} />
              </button>

              {showSkipped && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-red-200 rounded-t-3xl shadow-2xl z-20 max-h-72 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-bold text-slate-900">Skipped Tokens</p>
                    </div>
                    <button onClick={() => setShowSkipped(false)}
                      className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {skippedQueue.map(entry => (
                      <div key={entry.id}
                        className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <div className="font-mono font-black text-sm text-red-700 flex-shrink-0">{entry.tokenNumber}</div>
                        <div className="flex-1 min-w-0">
                          {entry.patient ? (
                            <p className="text-sm font-semibold text-slate-800">{entry.patient.name}</p>
                          ) : (
                            <p className="text-sm font-semibold text-slate-500">Walk-in</p>
                          )}
                          <p className="text-[10px] text-slate-400">{timeAgo(entry.createdAt)}</p>
                        </div>
                        <span className="text-xs font-bold text-red-500 flex-shrink-0">{entry.callCount}/{MAX_CALLS} calls</span>
                        <Button variant="outline" size="sm"
                          className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-100 flex-shrink-0"
                          onClick={() => handleRecall(entry.id, entry.tokenNumber)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Recall
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>{/* end main area */}
      </div>{/* end flex row */}

      {/* ── RIGHT DRAWERS ─────────────────────────────────────────────── */}

      {/* Registration drawer (walk-in → new patient) */}
      {drawerType === "registration" && activeEntryId && (
        <RightDrawer
          title="Patient Registration"
          subtitle="Link a patient record to this token"
          onClose={closeDrawer}
        >
          <RegistrationContent onRegister={handleRegComplete} />
        </RightDrawer>
      )}

      {/* Reassign drawer (fix a wrong patient assignment) */}
      {drawerType === "reassign" && activeEntryId && (
        <RightDrawer
          title="Reassign Patient"
          subtitle={`Correct the patient linked to ${activeDrawerEntry?.tokenNumber ?? "this token"}`}
          onClose={closeDrawer}
        >
          <RegistrationContent onRegister={handleRegComplete} isReassign />
        </RightDrawer>
      )}

      {/* Billing drawer */}
      {drawerType === "billing" && activeDrawerEntry && (
        <RightDrawer
          title="Billing"
          subtitle={activeDrawerEntry.patient?.name ?? "Walk-in Patient"}
          onClose={closeDrawer}
        >
          <BillingContent
            entry={activeDrawerEntry}
            onComplete={handleBillingComplete}
          />
        </RightDrawer>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold shadow-xl animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
