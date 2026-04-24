import { useState, useRef } from "react";
import {
  FlaskConical, X, Maximize2, Minimize2, ArrowLeft,
  ChevronDown, ChevronRight, Search, Printer, FileText,
  Clock, CheckCircle2, AlertTriangle, Eye, FolderOpen,
  CalendarDays, User, TestTube,
} from "lucide-react";
import { MultiEntry } from "@/hooks/useMultiStepQueue";

// ─── Accent ────────────────────────────────────────────────────────────────

const ACCENT = "#4982CF";

// ─── Data types ────────────────────────────────────────────────────────────

type TestStatus = "pending" | "completed";
type ResultFlag = "normal" | "low" | "high" | "critical";

interface LabResult {
  parameter:  string;
  value:      string;
  unit:       string;
  reference:  string;
  flag:       ResultFlag;
}

interface LabFile {
  name: string;
  type: "pdf" | "image";
}

interface LabTest {
  id:        string;
  serial:    number;
  name:      string;
  lab:       string;
  status:    TestStatus;
  hasFiles:  boolean;
  results:   LabResult[];
  files:     LabFile[];
  updatedAt: string;
}

interface LabOrder {
  id:                  string;
  orderedBy:           string;
  orderDate:           string;
  orderTime:           string;
  sampleCollectedBy:   string | null;
  collectionDate:      string | null;
  collectionTime:      string | null;
  tests:               LabTest[];
}

// ─── Dummy data ─────────────────────────────────────────────────────────────

const LAB_ORDERS: LabOrder[] = [
  {
    id:                "ord-001",
    orderedBy:         "Dr. Asif Imam",
    orderDate:         "10 Dec 2024",
    orderTime:         "11:30 AM",
    sampleCollectedBy: "Nurse Lena Roy",
    collectionDate:    "10 Dec 2024",
    collectionTime:    "12:15 PM",
    tests: [
      {
        id: "t1", serial: 1,
        name:      "Complete Blood Count (CBC)",
        lab:       "CityPath Diagnostics",
        status:    "completed",
        hasFiles:  true,
        updatedAt: "10 Dec 2024, 03:45 PM",
        results: [
          { parameter: "Haemoglobin",  value: "11.2", unit: "g/dL",      reference: "13.0–17.0",  flag: "low"    },
          { parameter: "WBC",          value: "10.8", unit: "×10³/µL",   reference: "4.5–11.0",   flag: "normal" },
          { parameter: "Platelets",    value: "340",  unit: "×10³/µL",   reference: "150–400",    flag: "normal" },
          { parameter: "Neutrophils",  value: "78",   unit: "%",          reference: "40–70",      flag: "high"   },
          { parameter: "Lymphocytes",  value: "18",   unit: "%",          reference: "20–40",      flag: "low"    },
          { parameter: "MCV",          value: "82",   unit: "fL",         reference: "80–100",     flag: "normal" },
        ],
        files: [{ name: "CBC_Report_Dec10.pdf", type: "pdf" }],
      },
      {
        id: "t2", serial: 2,
        name:      "C-Reactive Protein (CRP)",
        lab:       "CityPath Diagnostics",
        status:    "completed",
        hasFiles:  false,
        updatedAt: "10 Dec 2024, 04:00 PM",
        results: [
          { parameter: "CRP", value: "48", unit: "mg/L", reference: "0–5", flag: "high" },
        ],
        files: [],
      },
      {
        id: "t3", serial: 3,
        name:      "Throat Swab Culture & Sensitivity",
        lab:       "ABC Lab",
        status:    "pending",
        hasFiles:  false,
        updatedAt: "",
        results: [],
        files:   [],
      },
    ],
  },
  {
    id:                "ord-002",
    orderedBy:         "Dr. Abc",
    orderDate:         "10 Nov 2024",
    orderTime:         "09:00 AM",
    sampleCollectedBy: "Nurse Mark",
    collectionDate:    "10 Nov 2024",
    collectionTime:    "09:30 AM",
    tests: [
      {
        id: "t4", serial: 1,
        name:      "Electrocardiogram (ECG)",
        lab:       "CardioLab",
        status:    "completed",
        hasFiles:  true,
        updatedAt: "10 Nov 2024, 11:00 AM",
        results: [
          { parameter: "Heart Rate",    value: "88",  unit: "bpm", reference: "60–100",  flag: "normal" },
          { parameter: "PR Interval",   value: "180", unit: "ms",  reference: "120–200", flag: "normal" },
          { parameter: "QRS Duration",  value: "108", unit: "ms",  reference: "70–110",  flag: "normal" },
          { parameter: "QTc",           value: "445", unit: "ms",  reference: "360–440", flag: "high"   },
        ],
        files: [{ name: "ECG_Report_Nov10.pdf", type: "pdf" }],
      },
      {
        id: "t5", serial: 2,
        name:      "Ambulatory BP Monitoring (ABPM)",
        lab:       "CardioLab",
        status:    "completed",
        hasFiles:  true,
        updatedAt: "11 Nov 2024, 08:00 AM",
        results: [
          { parameter: "Daytime Avg SBP",  value: "142", unit: "mmHg", reference: "< 135", flag: "high"   },
          { parameter: "Daytime Avg DBP",  value: "88",  unit: "mmHg", reference: "< 85",  flag: "high"   },
          { parameter: "Night Avg SBP",    value: "128", unit: "mmHg", reference: "< 120", flag: "high"   },
          { parameter: "Night Avg DBP",    value: "74",  unit: "mmHg", reference: "< 70",  flag: "high"   },
        ],
        files: [{ name: "ABPM_Report_Nov10.pdf", type: "pdf" }],
      },
    ],
  },
  {
    id:                "ord-003",
    orderedBy:         "Dr. Xyz",
    orderDate:         "25 Sep 2024",
    orderTime:         "06:00 AM",
    sampleCollectedBy: null,
    collectionDate:    null,
    collectionTime:    null,
    tests: [
      {
        id: "t6", serial: 1,
        name:      "HbA1c",
        lab:       "MedCheck Labs",
        status:    "pending",
        hasFiles:  false,
        updatedAt: "",
        results: [],
        files:   [],
      },
      {
        id: "t7", serial: 2,
        name:      "Fasting Blood Glucose",
        lab:       "MedCheck Labs",
        status:    "pending",
        hasFiles:  false,
        updatedAt: "",
        results: [],
        files:   [],
      },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const FLAG_STYLE: Record<ResultFlag, string> = {
  normal:   "text-slate-700 bg-slate-50",
  low:      "text-blue-700 bg-blue-50 font-bold",
  high:     "text-red-700 bg-red-50 font-bold",
  critical: "text-white bg-red-600 font-bold",
};
const FLAG_LABEL: Record<ResultFlag, string> = {
  normal: "", low: "↓", high: "↑", critical: "!",
};

// ─── ResultPanel ─────────────────────────────────────────────────────────────

function ResultPanel({
  test,
  onBack,
}: {
  test:   LabTest;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"results" | "files">("results");

  return (
    <div className="flex flex-col h-full">

      {/* Panel header */}
      <div className="flex items-start gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 mt-0.5"
          title="Back to list">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-800 leading-tight truncate">{test.name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{test.lab}{test.updatedAt ? ` · Updated ${test.updatedAt}` : ""}</p>
        </div>
        <button
          className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors flex-shrink-0"
          onClick={() => window.print()}>
          <Printer className="h-3 w-3" /> Print
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white flex-shrink-0 px-5">
        {["results", ...(test.hasFiles ? ["files"] : [])].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as "results" | "files")}
            className={[
              "px-4 py-2.5 text-xs font-bold capitalize border-b-2 transition-colors",
              tab === t
                ? "border-[#4982CF] text-[#4982CF]"
                : "border-transparent text-slate-400 hover:text-slate-600",
            ].join(" ")}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {tab === "results" && (
          <div className="p-4">
            {test.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <Clock className="h-8 w-8 opacity-40" />
                <p className="text-sm font-semibold">Awaiting Results</p>
                <p className="text-xs">Results will appear here once the lab processes this test.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Parameter</th>
                      <th className="text-right px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Value</th>
                      <th className="text-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Unit</th>
                      <th className="text-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Reference</th>
                      <th className="text-center px-4 py-2.5 font-black text-[10px] uppercase tracking-widest text-slate-400">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {test.results.map((r, i) => (
                      <tr
                        key={i}
                        className={[
                          "border-b border-slate-50 last:border-0",
                          r.flag !== "normal" ? "bg-red-50/30" : "",
                        ].join(" ")}>
                        <td className="px-4 py-2.5 font-semibold text-slate-700">{r.parameter}</td>
                        <td className={`px-4 py-2.5 text-right rounded ${FLAG_STYLE[r.flag]}`}>{r.value}</td>
                        <td className="px-4 py-2.5 text-center text-slate-400">{r.unit}</td>
                        <td className="px-4 py-2.5 text-center text-slate-400">{r.reference}</td>
                        <td className="px-4 py-2.5 text-center">
                          {r.flag !== "normal" ? (
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-black ${FLAG_STYLE[r.flag]}`}>
                              {FLAG_LABEL[r.flag]}
                            </span>
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "files" && (
          <div className="p-4">
            {test.files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <FolderOpen className="h-8 w-8 opacity-40" />
                <p className="text-sm font-semibold">No Files Uploaded</p>
                <p className="text-xs">Attached reports will appear here once uploaded.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {test.files.map((f, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{f.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase">{f.type}</p>
                    </div>
                    <button className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors flex-shrink-0">
                      Preview
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-center text-slate-400 mt-3">
                  Click Preview to open report inside the drawer · Full-screen available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LabsDrawer ──────────────────────────────────────────────────────────────

interface LabsDrawerProps {
  entry:              MultiEntry;
  fullscreen:         boolean;
  onToggleFullscreen: () => void;
  onClose:            () => void;
}

export function LabsDrawer({ fullscreen, onToggleFullscreen, onClose }: LabsDrawerProps) {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [labFilter, setLabFilter]     = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["ord-001"]));
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [savedScroll, setSavedScroll] = useState(0);

  const allLabs = Array.from(
    new Set(LAB_ORDERS.flatMap(o => o.tests.map(t => t.lab)))
  ).sort();

  const filteredOrders = LAB_ORDERS.map(order => ({
    ...order,
    tests: order.tests.filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.lab.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchLab    = labFilter === "all" || t.lab === labFilter;
      return matchSearch && matchStatus && matchLab;
    }),
  })).filter(o => o.tests.length > 0);

  const totalTests    = LAB_ORDERS.flatMap(o => o.tests).length;
  const pendingCount  = LAB_ORDERS.flatMap(o => o.tests).filter(t => t.status === "pending").length;
  const doneCount     = LAB_ORDERS.flatMap(o => o.tests).filter(t => t.status === "completed").length;

  function toggleOrder(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openResult(test: LabTest) {
    setSavedScroll(scrollRef.current?.scrollTop ?? 0);
    setSelectedTest(test);
  }

  function closeResult() {
    setSelectedTest(null);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = savedScroll;
    });
  }

  return (
    <>
      {/* Backdrop */}
      {!fullscreen && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-30" />
      )}

      {/* Drawer panel */}
      <div className={[
        "absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col z-40 transition-all duration-300",
        fullscreen ? "inset-0 w-full" : "w-1/2 border-l border-slate-200",
      ].join(" ")}>

        {/* ── Drawer Header ── */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
            <FlaskConical className="h-4 w-4" style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Record</p>
            <p className="text-sm font-black text-slate-800">Labs</p>
          </div>

          {/* Summary badges */}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
            {totalTests} tests
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
            {pendingCount} pending
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
            {doneCount} done
          </span>

          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Filter Bar (hidden in result view) ── */}
        {!selectedTest && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search test name or lab…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4982CF]/40 placeholder:text-slate-400"
              />
            </div>
            {/* Status + Lab filters */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4982CF]/40 text-slate-600">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={labFilter}
                onChange={e => setLabFilter(e.target.value)}
                className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4982CF]/40 text-slate-600">
                <option value="all">All Labs</option>
                {allLabs.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        {selectedTest ? (
          <ResultPanel test={selectedTest} onBack={closeResult} />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">

            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <TestTube className="h-8 w-8 opacity-40" />
                <p className="text-sm font-semibold">No matching tests found</p>
                <p className="text-xs">Try clearing your filters.</p>
              </div>
            )}

            {filteredOrders.map((order) => {
              const isOpen = expandedIds.has(order.id);
              const completedCount = order.tests.filter(t => t.status === "completed").length;
              const pendingCount   = order.tests.filter(t => t.status === "pending").length;

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                  {/* Order header (collapsible toggle) */}
                  <button
                    onClick={() => toggleOrder(order.id)}
                    className="w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${ACCENT}12` }}>
                        <FlaskConical className="h-4 w-4" style={{ color: ACCENT }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-black text-slate-800">{order.orderedBy}</span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {order.orderDate} at {order.orderTime}
                          </span>
                        </div>

                        {order.sampleCollectedBy ? (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Collected by {order.sampleCollectedBy}
                            {order.collectionDate ? ` · ${order.collectionDate} at ${order.collectionTime}` : ""}
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-600 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            Sample not collected yet
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {order.tests.length} test{order.tests.length !== 1 ? "s" : ""}
                          </span>
                          {completedCount > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              {completedCount} completed
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              {pendingCount} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isOpen
                          ? <ChevronDown className="h-4 w-4 text-slate-400" />
                          : <ChevronRight className="h-4 w-4 text-slate-400" />
                        }
                      </div>
                    </div>
                  </button>

                  {/* Tests list */}
                  {isOpen && (
                    <div className="border-t border-slate-100 divide-y divide-slate-50">
                      {order.tests.map((test) => {
                        const isDone = test.status === "completed";
                        return (
                          <div key={test.id} className="px-4 py-3 flex items-center gap-3">
                            {/* Serial */}
                            <span
                              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 text-white"
                              style={{ backgroundColor: isDone ? "#10b981" : "#94a3b8" }}>
                              {test.serial}
                            </span>

                            {/* Test info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{test.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{test.lab}</p>
                            </div>

                            {/* Status badge */}
                            <div className="flex-shrink-0">
                              {isDone ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                  <Clock className="h-2.5 w-2.5" /> Awaiting Results
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                disabled={!isDone}
                                onClick={() => isDone && openResult(test)}
                                className={[
                                  "flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors",
                                  isDone
                                    ? "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                    : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed",
                                ].join(" ")}
                                title={isDone ? "View Result" : "Awaiting Results"}>
                                <Eye className="h-3 w-3" />
                                View Result
                              </button>

                              {isDone && test.hasFiles && (
                                <button
                                  onClick={() => { openResult(test); }}
                                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                                  title="View Files">
                                  <FolderOpen className="h-3 w-3" />
                                  Files
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
