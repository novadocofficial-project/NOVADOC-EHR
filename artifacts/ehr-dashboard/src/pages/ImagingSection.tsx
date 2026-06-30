import { useState } from "react";
import {
  ChevronLeft, X, CheckCircle2, ClipboardCheck,
  Plus, ScanLine, Pencil, Trash2, ChevronDown, AlertTriangle,
} from "lucide-react";

// ─── Hierarchical Imaging Catalog ────────────────────────────────────────────

export interface CatalogBodyPart {
  name:      string;
  enabled?:  boolean;
  protocols: string[];
}

export interface CatalogModality {
  name:      string;
  enabled?:  boolean;
  bodyParts: CatalogBodyPart[];
}

export const IMAGING_CATALOG_KEY = "ehr-imaging-catalog-v2";

export function loadImagingCatalog(): CatalogModality[] {
  try {
    const raw = localStorage.getItem(IMAGING_CATALOG_KEY);
    if (raw) return JSON.parse(raw) as CatalogModality[];
  } catch { /**/ }
  return IMAGING_CATALOG_SEED.map(m => ({
    ...m,
    enabled:   true,
    bodyParts: m.bodyParts.map(bp => ({ ...bp, enabled: true })),
  }));
}

const IMAGING_CATALOG_SEED: CatalogModality[] = [
  {
    name: "X-Ray",
    bodyParts: [
      { name: "Chest",           protocols: ["Single View", "AP Portable", "PA View", "PA & Lateral (2 Views)", "3 Views", "Decubitus", "Rib Series"] },
      { name: "Abdomen",         protocols: ["Supine", "Erect", "Supine & Erect"] },
      { name: "Cervical Spine",  protocols: ["AP & Lateral", "Flexion & Extension", "3 Views", "4 Views"] },
      { name: "Lumbar Spine",    protocols: ["AP & Lateral", "Flexion & Extension", "3 Views", "4 Views"] },
      { name: "Thoracic Spine",  protocols: ["AP & Lateral", "3 Views"] },
      { name: "Pelvis",          protocols: ["AP View", "AP & Lateral"] },
      { name: "Knee",            protocols: ["AP & Lateral", "Sunrise View", "3 Views", "Weight Bearing"] },
      { name: "Shoulder",        protocols: ["AP View", "Y-View", "AP & Axillary (2 Views)"] },
      { name: "Wrist",           protocols: ["AP & Lateral", "3 Views"] },
      { name: "Hand",            protocols: ["AP & Oblique", "3 Views"] },
      { name: "Ankle",           protocols: ["AP & Lateral", "3 Views"] },
      { name: "Foot",            protocols: ["AP & Lateral", "3 Views", "Weight Bearing"] },
      { name: "Hip",             protocols: ["AP View", "AP & Lateral"] },
      { name: "Elbow",           protocols: ["AP & Lateral", "3 Views"] },
      { name: "Forearm",         protocols: ["AP & Lateral"] },
      { name: "Tibia/Fibula",    protocols: ["AP & Lateral"] },
      { name: "Skull",           protocols: ["AP & Lateral", "Towne's View", "3 Views"] },
      { name: "Facial Bones",    protocols: ["Standard Views", "Waters View"] },
      { name: "Sinuses",         protocols: ["Waters View", "Paranasal Sinus Series"] },
    ],
  },
  {
    name: "CT",
    bodyParts: [
      { name: "Head/Brain",       protocols: ["Without Contrast", "With Contrast", "With & Without Contrast"] },
      { name: "Chest",            protocols: ["Without Contrast", "With Contrast", "Pulmonary Angiography (CTPA)", "High Resolution (HRCT)"] },
      { name: "Abdomen",          protocols: ["Without Contrast", "With Contrast", "With & Without Contrast"] },
      { name: "Pelvis",           protocols: ["Without Contrast", "With Contrast", "With & Without Contrast"] },
      { name: "Abdomen & Pelvis", protocols: ["Without Contrast", "With Contrast", "With & Without Contrast", "Triple Phase"] },
      { name: "Spine (Cervical)", protocols: ["Without Contrast", "With Contrast"] },
      { name: "Spine (Lumbar)",   protocols: ["Without Contrast", "With Contrast"] },
      { name: "Spine (Thoracic)", protocols: ["Without Contrast", "With Contrast"] },
      { name: "Coronary",         protocols: ["CT Coronary Angiography (CTCA)", "Calcium Score"] },
      { name: "Peripheral Angiography", protocols: ["Standard Protocol"] },
      { name: "KUB / Urogram",    protocols: ["Non-Contrast (NCCT KUB)", "With Contrast (IVU)"] },
      { name: "Neck/Soft Tissue", protocols: ["Without Contrast", "With Contrast"] },
      { name: "Sinuses",          protocols: ["Without Contrast"] },
      { name: "Orbits",           protocols: ["Without Contrast", "With Contrast"] },
    ],
  },
  {
    name: "MRI",
    bodyParts: [
      { name: "Brain",            protocols: ["Without Contrast", "With Contrast", "With & Without Contrast", "Spectroscopy", "Diffusion (DWI)"] },
      { name: "Spine (Cervical)", protocols: ["Without Contrast", "With Contrast"] },
      { name: "Spine (Lumbar)",   protocols: ["Without Contrast", "With Contrast"] },
      { name: "Spine (Thoracic)", protocols: ["Without Contrast", "With Contrast"] },
      { name: "Knee",             protocols: ["Without Contrast"] },
      { name: "Shoulder",         protocols: ["Without Contrast", "With Contrast (Arthrogram)"] },
      { name: "Hip",              protocols: ["Without Contrast", "With Contrast"] },
      { name: "Wrist",            protocols: ["Without Contrast"] },
      { name: "Ankle/Foot",       protocols: ["Without Contrast"] },
      { name: "Abdomen",          protocols: ["Without Contrast", "With Contrast", "With & Without Contrast"] },
      { name: "Pelvis",           protocols: ["Without Contrast", "With Contrast"] },
      { name: "Prostate",         protocols: ["Multi-parametric (mpMRI)"] },
      { name: "Breast",           protocols: ["Bilateral With Contrast"] },
      { name: "Cardiac (CMR)",    protocols: ["Standard Protocol", "Stress Protocol", "Viability Protocol"] },
      { name: "Whole Body",       protocols: ["Without Contrast"] },
      { name: "MRCP",             protocols: ["Standard Protocol"] },
    ],
  },
  {
    name: "Ultrasound",
    bodyParts: [
      { name: "Abdomen",             protocols: ["Complete", "Limited", "Focused"] },
      { name: "Pelvis",              protocols: ["Transabdominal", "Transvaginal (TVS)"] },
      { name: "Thyroid & Neck",      protocols: ["Standard"] },
      { name: "Renal",               protocols: ["Bilateral Kidneys", "Single Kidney", "KUB"] },
      { name: "Testicular/Scrotal",  protocols: ["Standard with Doppler"] },
      { name: "Breast",              protocols: ["Bilateral", "Unilateral Right", "Unilateral Left"] },
      { name: "Doppler – Carotid",   protocols: ["Bilateral Carotid Doppler"] },
      { name: "Doppler – Lower Limb Veins",    protocols: ["Bilateral DVT Screen", "Unilateral Right", "Unilateral Left"] },
      { name: "Doppler – Lower Limb Arteries", protocols: ["Bilateral", "Unilateral Right", "Unilateral Left"] },
      { name: "Doppler – Upper Limb Veins",    protocols: ["Bilateral", "Unilateral"] },
      { name: "Obstetric (Dating)",  protocols: ["Standard Dating Scan"] },
      { name: "Obstetric (Anatomy)", protocols: ["Detailed Anomaly Scan (18–22 weeks)"] },
      { name: "Shoulder",            protocols: ["Standard"] },
      { name: "Soft Tissue / Mass",  protocols: ["Standard"] },
      { name: "Guided Procedure",    protocols: ["Aspiration", "Biopsy", "Drainage"] },
    ],
  },
  {
    name: "Mammography",
    bodyParts: [
      { name: "Bilateral",       protocols: ["Standard Screening (2 Views Each)", "Diagnostic", "Tomosynthesis (3D)"] },
      { name: "Unilateral Right",protocols: ["Standard", "Diagnostic", "Tomosynthesis (3D)"] },
      { name: "Unilateral Left", protocols: ["Standard", "Diagnostic", "Tomosynthesis (3D)"] },
    ],
  },
  {
    name: "Echocardiography",
    bodyParts: [
      { name: "Transthoracic (TTE)",    protocols: ["2D Echo with Doppler", "M-Mode", "Bubble Study"] },
      { name: "Stress Echo",            protocols: ["Exercise Stress", "Dobutamine Stress"] },
      { name: "Trans-Esophageal (TEE)", protocols: ["Standard Protocol"] },
    ],
  },
  {
    name: "Nuclear Medicine",
    bodyParts: [
      { name: "Bone Scan",      protocols: ["Whole Body", "3-Phase", "SPECT/CT"] },
      { name: "Thyroid Scan",   protocols: ["Technetium-99m", "Iodine I-131"] },
      { name: "PET-CT",         protocols: ["Whole Body FDG", "Brain FDG", "Cardiac Viability"] },
      { name: "Renal Scan",     protocols: ["MAG3 (Dynamic)", "DMSA (Static)"] },
      { name: "Hepatobiliary",  protocols: ["HIDA Scan", "Cholecystokinin (CCK) HIDA"] },
      { name: "Ventilation/Perfusion (V/Q)", protocols: ["Standard Protocol"] },
    ],
  },
  {
    name: "Fluoroscopy",
    bodyParts: [
      { name: "Oesophagus",    protocols: ["Barium Swallow"] },
      { name: "Stomach",       protocols: ["Barium Meal", "Upper GI Series"] },
      { name: "Colon",         protocols: ["Barium Enema", "Water-Soluble Enema"] },
      { name: "Uterus/Tubes",  protocols: ["HSG (Hysterosalpingogram)"] },
      { name: "Bladder",       protocols: ["VCUG (Voiding Cystourethrogram)", "Cystogram"] },
      { name: "Bile Ducts",    protocols: ["ERCP", "T-Tube Cholangiogram"] },
    ],
  },
];

// ─── Modality colour map ──────────────────────────────────────────────────────

const MODALITY_COLORS: Record<string, string> = {
  "X-Ray":          "bg-sky-100 text-sky-700",
  "CT":             "bg-purple-100 text-purple-700",
  "MRI":            "bg-indigo-100 text-indigo-700",
  "Ultrasound":     "bg-teal-100 text-teal-700",
  "Mammography":    "bg-pink-100 text-pink-700",
  "Echocardiography": "bg-rose-100 text-rose-700",
  "Nuclear Medicine": "bg-orange-100 text-orange-700",
  "Fluoroscopy":    "bg-amber-100 text-amber-700",
};

function ModalityBadge({ modality }: { modality: string }) {
  return (
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${MODALITY_COLORS[modality] ?? "bg-slate-100 text-slate-500"}`}>
      {modality}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImagingOrder {
  uid:                 string;
  modality:            string;
  bodyPart:            string;
  protocol:            string;
  specialInstructions: string;
  createdAt:           string;
}

export interface ImagingData {
  orders:       ImagingOrder[];
  instructions: string;
}

export const EMPTY_IMAGING: ImagingData = { orders: [], instructions: "" };

// ─── Helper: format order label ───────────────────────────────────────────────

export function formatImagingLabel(o: Pick<ImagingOrder, "modality" | "bodyPart" | "protocol">): string {
  return `${o.modality} → ${o.bodyPart} → ${o.protocol}`;
}

// ─── Chips Panel ──────────────────────────────────────────────────────────────

export function ImagingChipsPanel({ data, onOpen }: { data: ImagingData; onOpen: () => void }) {
  if (data.orders.length === 0 && !data.instructions) {
    return (
      <button onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-cyan-50/60 border-2 border-dashed border-cyan-200 text-cyan-500 font-bold text-xs hover:border-cyan-400 hover:bg-cyan-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Order imaging…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {data.orders.map(o => (
        <div key={o.uid} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-cyan-100 bg-cyan-50/40">
          <ScanLine className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] font-black text-cyan-800">{o.modality} → {o.bodyPart}</p>
              <ModalityBadge modality={o.modality} />
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">{o.protocol}</p>
            {o.specialInstructions && (
              <p className="text-[10px] text-slate-400 mt-0.5 italic truncate">{o.specialInstructions}</p>
            )}
          </div>
        </div>
      ))}
      {data.instructions && (
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-wide">Requisition Instructions</p>
          <p className="text-[10px] text-amber-700 mt-0.5">{data.instructions}</p>
        </div>
      )}
      <button onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-cyan-200 text-cyan-500 text-xs font-bold hover:bg-cyan-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit imaging orders ({data.orders.length})
      </button>
    </div>
  );
}

// ─── Cascading Dropdown Form ──────────────────────────────────────────────────

interface OrderForm {
  modality:            string;
  bodyPart:            string;
  protocol:            string;
  specialInstructions: string;
}

const EMPTY_FORM: OrderForm = { modality: "", bodyPart: "", protocol: "", specialInstructions: "" };

function CascadeForm({
  value,
  onChange,
}: {
  value:    OrderForm;
  onChange: (v: OrderForm) => void;
}) {
  const [catalog] = useState(() => loadImagingCatalog());
  const activeCatalog  = catalog.filter(m => m.enabled !== false);
  const selectedModality = activeCatalog.find(m => m.name === value.modality);
  const activeBodyParts  = (selectedModality?.bodyParts ?? []).filter(b => b.enabled !== false);
  const selectedBodyPart = activeBodyParts.find(b => b.name === value.bodyPart);

  const selectClass =
    "w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      {/* Modality */}
      <div>
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
          Modality <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={value.modality}
            onChange={e => onChange({ ...EMPTY_FORM, modality: e.target.value })}
            className={selectClass}
          >
            <option value="">Select modality…</option>
            {activeCatalog.map(m => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Body Part */}
      <div>
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
          Body Part <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={value.bodyPart}
            onChange={e => onChange({ ...value, bodyPart: e.target.value, protocol: "" })}
            disabled={!selectedModality}
            className={selectClass}
          >
            <option value="">Select body part…</option>
            {activeBodyParts.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Protocol/View */}
      <div>
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
          Protocol / View <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={value.protocol}
            onChange={e => onChange({ ...value, protocol: e.target.value })}
            disabled={!selectedBodyPart}
            className={selectClass}
          >
            <option value="">Select protocol…</option>
            {(selectedBodyPart?.protocols ?? []).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">
          Special Instructions
        </label>
        <textarea
          value={value.specialInstructions}
          onChange={e => onChange({ ...value, specialInstructions: e.target.value })}
          rows={2}
          placeholder="e.g. Rule out fracture · Evaluate chronic knee pain · Urgent study required"
          className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all resize-none placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}

// ─── Imaging Drawer ───────────────────────────────────────────────────────────

interface ImagingDrawerProps {
  savedData:  ImagingData;
  onSave:     (data: ImagingData) => void;
  onClose:    () => void;
  doctorName?: string;
}

export function ImagingDrawer({ savedData, onSave, onClose, doctorName = "Dr. Attending" }: ImagingDrawerProps) {
  const [orders,       setOrders]       = useState<ImagingOrder[]>(savedData.orders);
  const [instructions, setInstructions] = useState(savedData.instructions);
  const [form,         setForm]         = useState<OrderForm>(EMPTY_FORM);
  const [editingUid,   setEditingUid]   = useState<string | null>(null);
  const [confirmUid,   setConfirmUid]   = useState<string | null>(null);

  const canAdd = form.modality !== "" && form.bodyPart !== "" && form.protocol !== "";

  function handleAdd() {
    if (!canAdd) return;
    const now = new Date().toLocaleString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const entry: ImagingOrder = {
      uid:                 editingUid ?? `img-${Date.now()}`,
      modality:            form.modality,
      bodyPart:            form.bodyPart,
      protocol:            form.protocol,
      specialInstructions: form.specialInstructions.trim(),
      createdAt:           now,
    };
    setOrders(prev => editingUid
      ? prev.map(o => o.uid === editingUid ? entry : o)
      : [...prev, entry],
    );
    setForm(EMPTY_FORM);
    setEditingUid(null);
  }

  function startEdit(o: ImagingOrder) {
    setForm({
      modality:            o.modality,
      bodyPart:            o.bodyPart,
      protocol:            o.protocol,
      specialInstructions: o.specialInstructions,
    });
    setEditingUid(o.uid);
    setConfirmUid(null);
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setEditingUid(null);
  }

  function confirmDelete(uid: string) {
    setOrders(prev => prev.filter(o => o.uid !== uid));
    setConfirmUid(null);
    if (editingUid === uid) cancelEdit();
  }

  function saveAndClose() {
    onSave({ orders, instructions });
    onClose();
  }

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={saveAndClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800">Imaging Requisition</p>
        </div>
        <button onClick={saveAndClose}
          className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-emerald-500 text-white flex-shrink-0 hover:bg-emerald-600 transition-colors">
          <ClipboardCheck className="h-3.5 w-3.5" />
          {savedData.orders.length > 0 ? "Update" : "Mark Done"}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Add / Edit form ── */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
            {editingUid ? "Edit Imaging Order" : "Add Imaging Study"}
          </p>

          <CascadeForm value={form} onChange={setForm} />

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingUid ? "Update Order" : "Add Study"}
            </button>
            {editingUid && (
              <button
                onClick={cancelEdit}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── Staged orders list ── */}
        {orders.length > 0 && (
          <>
            <div className="border-t border-slate-100 mx-4" />
            <div className="px-4 pt-3 pb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2.5">
                Imaging Orders ({orders.length})
              </p>
              <div className="space-y-2">
                {orders.map((o, idx) => {
                  const isEditing = editingUid === o.uid;
                  const isConfirm = confirmUid === o.uid;
                  return (
                    <div
                      key={o.uid}
                      className="rounded-xl border transition-all"
                      style={{
                        borderColor: isEditing ? "#67e8f9" : isConfirm ? "#fca5a5" : "#cffafe",
                        backgroundColor: isEditing ? "#ecfeff" : isConfirm ? "#fff1f2" : "#f0fdfe",
                      }}
                    >
                      <div className="flex items-start gap-2.5 px-3 py-2.5">
                        {/* Index + icon */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                          <span className="text-[9px] font-black text-slate-400 w-4 text-right">{idx + 1}.</span>
                          <ScanLine className="h-3.5 w-3.5 text-cyan-500" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[11px] font-black text-slate-800">
                              {o.modality} → {o.bodyPart}
                            </p>
                            <ModalityBadge modality={o.modality} />
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5">{o.protocol}</p>
                          {o.specialInstructions && (
                            <p className="text-[10px] text-slate-400 mt-0.5 italic">{o.specialInstructions}</p>
                          )}
                          <p className="text-[9px] text-slate-300 mt-1">
                            {o.createdAt} · {doctorName}
                          </p>
                        </div>

                        {/* Actions */}
                        {!isConfirm && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEdit(o)}
                              title="Edit"
                              className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-cyan-100 hover:bg-cyan-50 text-slate-300 hover:text-cyan-500 transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setConfirmUid(o.uid)}
                              title="Delete"
                              className="h-7 w-7 flex items-center justify-center rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline delete confirmation */}
                      {isConfirm && (
                        <div className="px-3 pb-2.5 flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-rose-400 flex-shrink-0" />
                          <p className="text-[10px] text-rose-600 font-bold flex-1">Remove this order?</p>
                          <button
                            onClick={() => confirmDelete(o.uid)}
                            className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setConfirmUid(null)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Global Requisition Instructions ── */}
        <div className="border-t border-slate-100 mx-4" />
        <div className="px-4 pt-3 pb-5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-2">
            Requisition Instructions{" "}
            <span className="font-normal text-slate-400 normal-case tracking-normal">(applies to entire order)</span>
          </label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={2}
            placeholder="e.g. Patient fasting for 6 hours · With contrast · Urgent…"
            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all resize-none placeholder:text-slate-300"
          />
        </div>
      </div>
    </div>
  );
}
