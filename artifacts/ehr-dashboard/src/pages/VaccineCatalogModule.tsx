import { useState } from "react";
import {
  Plus, Trash2, Edit2, Save, X, GripVertical, Search, ChevronDown,
  ChevronRight, FileText, Syringe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function uid() { return Math.random().toString(36).slice(2, 10); }
function reorder<T>(arr: T[], from: number, to: number) {
  const next = [...arr]; const [mv] = next.splice(from, 1); next.splice(to, 0, mv); return next;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaccineItem {
  id: string;
  name: string;
  description: string;
  route?: string;
  doses?: string;
}

export interface VaccineSection {
  id: string;
  name: string;
  vaccines: VaccineItem[];
  expanded: boolean;
}

export type VaccinePartnerType = "Internal Clinic" | "Government Program" | "Private Centre";

export interface VaccinePartner {
  id: string;
  name: string;
  type: VaccinePartnerType;
  contact: string;
  active: boolean;
  selectedVaccines: string[];
  pricing: Record<string, string>;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const ROUTES = [
  "Intramuscular (IM)",
  "Subcutaneous (SC)",
  "Intradermal (ID)",
  "Oral (PO)",
  "Intranasal",
];

export const SEED_VACCINE_SECTIONS: VaccineSection[] = [
  {
    id: "vs1", name: "Routine Immunization", expanded: true, vaccines: [
      { id: "vx1",  name: "BCG",              route: "Intradermal (ID)",     doses: "Single dose (at birth)",           description: "Tuberculosis prevention" },
      { id: "vx2",  name: "Hepatitis B",      route: "Intramuscular (IM)",   doses: "3 doses: 0, 1, 6 months",          description: "Hepatitis B virus prevention" },
      { id: "vx3",  name: "OPV",              route: "Oral (PO)",             doses: "4 doses: birth, 6, 10, 14 weeks",  description: "Oral Polio Vaccine" },
    ],
  },
  {
    id: "vs2", name: "Childhood Immunization", expanded: false, vaccines: [
      { id: "vx4",  name: "DTP",              route: "Intramuscular (IM)",   doses: "3 primary + 1 booster",            description: "Diphtheria, Tetanus, Pertussis" },
      { id: "vx5",  name: "MMR",              route: "Subcutaneous (SC)",    doses: "2 doses: 12–15 months & 4–6 yrs",  description: "Measles, Mumps, Rubella" },
      { id: "vx6",  name: "Varicella",        route: "Subcutaneous (SC)",    doses: "2 doses",                          description: "Chickenpox prevention" },
      { id: "vx7",  name: "PCV13 (Pneumococcal)", route: "Intramuscular (IM)", doses: "4 doses: 2, 4, 6, 12–15 months", description: "Pneumococcal conjugate vaccine" },
    ],
  },
  {
    id: "vs3", name: "Adolescent & Adult", expanded: false, vaccines: [
      { id: "vx8",  name: "HPV",              route: "Intramuscular (IM)",   doses: "2–3 doses (age-dependent)",        description: "Human Papillomavirus" },
      { id: "vx9",  name: "Td",               route: "Intramuscular (IM)",   doses: "Every 10 years",                   description: "Tetanus-Diphtheria booster" },
      { id: "vx10", name: "Influenza",         route: "Intramuscular (IM)",   doses: "Annual",                           description: "Seasonal flu vaccine" },
      { id: "vx11", name: "COVID-19",          route: "Intramuscular (IM)",   doses: "2 primary + booster",              description: "Coronavirus disease prevention" },
    ],
  },
  {
    id: "vs4", name: "Travel Vaccines", expanded: false, vaccines: [
      { id: "vx12", name: "Typhoid",           route: "Intramuscular (IM)",   doses: "Single dose (injectable)",         description: "Typhoid fever prevention" },
      { id: "vx13", name: "Hepatitis A",       route: "Intramuscular (IM)",   doses: "2 doses: 0, 6–12 months",          description: "Hepatitis A virus prevention" },
      { id: "vx14", name: "Rabies (Pre-exposure)", route: "Intramuscular (IM)", doses: "3 doses: 0, 7, 21 days",        description: "Pre-exposure prophylaxis" },
      { id: "vx15", name: "Meningococcal",     route: "Intramuscular (IM)",   doses: "Single dose",                      description: "Meningitis prevention (travel)" },
    ],
  },
];

export const SEED_VACCINE_PARTNERS: VaccinePartner[] = [
  {
    id: "vp1", name: "In-Clinic Vaccination Centre", type: "Internal Clinic", contact: "", active: true,
    selectedVaccines: ["vx1","vx2","vx3","vx5","vx10","vx11"],
    pricing: { vx1: "0", vx2: "800", vx3: "0", vx5: "1500", vx10: "1200", vx11: "2000" },
  },
  {
    id: "vp2", name: "National Immunization Program", type: "Government Program", contact: "0800-45222", active: true,
    selectedVaccines: ["vx1","vx2","vx3","vx4","vx7"],
    pricing: { vx1: "0", vx2: "0", vx3: "0", vx4: "0", vx7: "0" },
  },
];

// ─── Vaccine Master List ───────────────────────────────────────────────────────

function VaccineMasterList({
  sections, setSections,
}: {
  sections: VaccineSection[];
  setSections: (fn: (prev: VaccineSection[]) => VaccineSection[]) => void;
}) {
  const [search, setSearch]             = useState("");
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [newSectionName, setNewSectionName]   = useState("");
  const [addVaxSectionId, setAddVaxSectionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<VaccineItem, "id">>({ name: "", description: "", route: "", doses: "" });
  const [editVaxId, setEditVaxId]       = useState<string | null>(null);
  const [editVaxData, setEditVaxData]   = useState<Omit<VaccineItem, "id">>({ name: "", description: "", route: "", doses: "" });
  const [dragSecIdx, setDragSecIdx]     = useState<number | null>(null);
  const [dropSecIdx, setDropSecIdx]     = useState<number | null>(null);
  const [dragVaxSec, setDragVaxSec]     = useState<string | null>(null);
  const [dragVaxIdx, setDragVaxIdx]     = useState<number | null>(null);
  const [dropVaxIdx, setDropVaxIdx]     = useState<number | null>(null);

  const matchSearch = (v: VaccineItem) => !search || v.name.toLowerCase().includes(search.toLowerCase());

  function toggleExpand(id: string) {
    setSections(ss => ss.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));
  }
  function addSection() {
    if (!newSectionName.trim()) return;
    setSections(ss => [...ss, { id: uid(), name: newSectionName.trim(), vaccines: [], expanded: true }]);
    setNewSectionName("");
  }
  function addVax(sectionId: string) {
    if (!draft.name.trim()) return;
    setSections(ss => ss.map(s => s.id === sectionId
      ? { ...s, vaccines: [...s.vaccines, { id: uid(), ...draft }] }
      : s));
    setDraft({ name: "", description: "", route: "", doses: "" });
    setAddVaxSectionId(null);
  }
  function saveEditSection(id: string) {
    if (!editSectionName.trim()) return;
    setSections(ss => ss.map(s => s.id === id ? { ...s, name: editSectionName } : s));
    setEditSectionId(null);
  }
  function saveEditVax(sectionId: string, vaxId: string) {
    setSections(ss => ss.map(s => s.id === sectionId
      ? { ...s, vaccines: s.vaccines.map(v => v.id === vaxId ? { ...v, ...editVaxData } : v) }
      : s));
    setEditVaxId(null);
  }
  function openEditVax(v: VaccineItem) {
    setEditVaxId(v.id);
    setEditVaxData({ name: v.name, description: v.description, route: v.route ?? "", doses: v.doses ?? "" });
  }

  function exportCSV() {
    const rows = [["Section", "Vaccine Name", "Route", "Doses", "Description"]];
    sections.forEach(s => s.vaccines.forEach(v => rows.push([s.name, v.name, v.route ?? "", v.doses ?? "", v.description])));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "vaccine-master-list.csv";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vaccines…" className="h-8 pl-8 text-xs w-56" />
        </div>
        <Button variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1.5">
          <FileText className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Add section */}
      <div className="flex gap-2">
        <Input value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addSection()}
          placeholder="New section name (e.g. Immunocompromised)…" className="h-8 text-xs flex-1" />
        <Button onClick={addSection} className="h-8 text-xs bg-[#4982CF] text-white gap-1.5 px-3">
          <Plus className="h-3.5 w-3.5" /> Add Section
        </Button>
      </div>

      {/* Section list */}
      <div className="space-y-3">
        {sections.map((sec, si) => (
          <div key={sec.id} draggable
            onDragStart={() => setDragSecIdx(si)}
            onDragOver={e => { e.preventDefault(); setDropSecIdx(si); }}
            onDrop={() => { if (dragSecIdx !== null && dragSecIdx !== si) setSections(ss => reorder(ss, dragSecIdx, si)); setDragSecIdx(null); setDropSecIdx(null); }}
            onDragEnd={() => { setDragSecIdx(null); setDropSecIdx(null); }}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${dropSecIdx === si && dragSecIdx !== si ? "border-[#4982CF] border-dashed" : "border-slate-100"}`}>

            {/* Section header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
              {editSectionId === sec.id ? (
                <Input value={editSectionName} onChange={e => setEditSectionName(e.target.value)} className="h-7 text-xs font-bold flex-1" autoFocus
                  onKeyDown={e => e.key === "Enter" && saveEditSection(sec.id)} />
              ) : (
                <button onClick={() => toggleExpand(sec.id)} className="flex items-center gap-2 flex-1 text-left">
                  {sec.expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  <span className="text-xs font-black text-slate-700">{sec.name}</span>
                  <span className="text-[10px] text-slate-400">{sec.vaccines.filter(matchSearch).length} vaccines</span>
                </button>
              )}
              <div className="flex gap-1 ml-auto">
                {editSectionId === sec.id ? (
                  <>
                    <Button onClick={() => saveEditSection(sec.id)} className="h-6 text-[10px] bg-[#4982CF] text-white px-2">Save</Button>
                    <Button variant="outline" onClick={() => setEditSectionId(null)} className="h-6 text-[10px] px-2">Cancel</Button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setAddVaxSectionId(sec.id); setSections(ss => ss.map(s => s.id === sec.id ? { ...s, expanded: true } : s)); }}
                      className="text-[10px] font-bold text-[#4982CF] flex items-center gap-0.5 hover:opacity-80">
                      <Plus className="h-3 w-3" /> Vaccine
                    </button>
                    <button onClick={() => { setEditSectionId(sec.id); setEditSectionName(sec.name); }}
                      className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                    <button onClick={() => setSections(ss => ss.filter(s => s.id !== sec.id))}
                      className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                  </>
                )}
              </div>
            </div>

            {sec.expanded && (
              <div>
                {/* Add vaccine inline */}
                {addVaxSectionId === sec.id && (
                  <div className="flex flex-col gap-1.5 px-4 py-3 bg-blue-50/40 border-b border-[#4982CF]/20">
                    <div className="flex gap-2">
                      <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        placeholder="Vaccine name…" className="h-7 text-xs flex-1" autoFocus />
                      <Input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                        placeholder="Description (optional)…" className="h-7 text-xs flex-1" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={draft.route} onChange={e => setDraft(d => ({ ...d, route: e.target.value }))}
                        className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4982CF]">
                        <option value="">Route of administration…</option>
                        {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <Input value={draft.doses} onChange={e => setDraft(d => ({ ...d, doses: e.target.value }))}
                        placeholder="Dose schedule (e.g. 2 doses: 0, 6 months)…" className="h-7 text-xs flex-1" />
                      <div className="flex gap-1 ml-auto">
                        <Button onClick={() => addVax(sec.id)} className="h-7 text-xs bg-[#4982CF] text-white px-3">Add</Button>
                        <Button variant="outline" onClick={() => { setAddVaxSectionId(null); setDraft({ name: "", description: "", route: "", doses: "" }); }} className="h-7 text-xs px-2">Cancel</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vaccine rows */}
                {sec.vaccines.filter(matchSearch).map((v, vi) => (
                  <div key={v.id} draggable
                    onDragStart={() => { setDragVaxSec(sec.id); setDragVaxIdx(vi); }}
                    onDragOver={e => { e.preventDefault(); if (dragVaxSec === sec.id) setDropVaxIdx(vi); }}
                    onDrop={() => {
                      if (dragVaxSec === sec.id && dragVaxIdx !== null && dragVaxIdx !== vi) {
                        setSections(ss => ss.map(s => s.id === sec.id ? { ...s, vaccines: reorder(s.vaccines, dragVaxIdx, vi) } : s));
                      }
                      setDragVaxSec(null); setDragVaxIdx(null); setDropVaxIdx(null);
                    }}
                    onDragEnd={() => { setDragVaxSec(null); setDragVaxIdx(null); setDropVaxIdx(null); }}
                    className={`flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 group ${dropVaxIdx === vi && dragVaxSec === sec.id ? "border-t-2 border-[#4982CF]" : ""}`}>
                    <GripVertical className="h-3.5 w-3.5 text-slate-200 cursor-grab flex-shrink-0" />

                    {editVaxId === v.id ? (
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex gap-2">
                          <Input value={editVaxData.name} onChange={e => setEditVaxData(d => ({ ...d, name: e.target.value }))} className="h-6 text-xs flex-1" autoFocus />
                          <Input value={editVaxData.description} onChange={e => setEditVaxData(d => ({ ...d, description: e.target.value }))} placeholder="Description…" className="h-6 text-xs flex-1" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <select value={editVaxData.route} onChange={e => setEditVaxData(d => ({ ...d, route: e.target.value }))}
                            className="h-6 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4982CF]">
                            <option value="">Route…</option>
                            {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <Input value={editVaxData.doses} onChange={e => setEditVaxData(d => ({ ...d, doses: e.target.value }))}
                            placeholder="Dose schedule…" className="h-6 text-xs flex-1" />
                          <Button onClick={() => saveEditVax(sec.id, v.id)} className="h-6 text-[10px] bg-[#4982CF] text-white px-2 ml-auto">Save</Button>
                          <Button variant="outline" onClick={() => setEditVaxId(null)} className="h-6 text-[10px] px-2">×</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-slate-700">{v.name}</span>
                            {v.route && (
                              <span className="inline-flex items-center rounded-full border border-[#4982CF]/30 bg-[#4982CF]/10 px-1.5 py-0 text-[10px] font-medium text-[#4982CF]">
                                {v.route}
                              </span>
                            )}
                            {v.doses && (
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                                {v.doses}
                              </span>
                            )}
                          </div>
                          {v.description && <p className="text-[10px] text-slate-400 mt-0.5">{v.description}</p>}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <button onClick={() => openEditVax(v)} className="p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-[#4982CF]"><Edit2 className="h-3 w-3" /></button>
                          <button onClick={() => setSections(ss => ss.map(s => s.id === sec.id ? { ...s, vaccines: s.vaccines.filter(x => x.id !== v.id) } : s))}
                            className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {sec.vaccines.filter(matchSearch).length === 0 && (
                  <p className="text-center text-xs text-slate-300 py-4">{search ? "No matching vaccines" : "No vaccines — click + Vaccine above"}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Vaccine Partners ──────────────────────────────────────────────────────────

function VaccinePartners({
  partners, setPartners, sections,
}: {
  partners: VaccinePartner[];
  setPartners: (fn: (prev: VaccinePartner[]) => VaccinePartner[]) => void;
  sections: VaccineSection[];
}) {
  const [step, setStep]           = useState<1 | 2>(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState({ name: "", contact: "", type: "Internal Clinic" as VaccinePartnerType });
  const [selected, setSelected]   = useState<string[]>([]);
  const [pricing, setPricing]     = useState<Record<string, string>>({});
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [expandId, setExpandId]   = useState<string | null>(null);
  const [vaxSearch, setVaxSearch] = useState("");

  const allVaccines = sections.flatMap(s => s.vaccines);
  const filtered    = allVaccines.filter(v => !vaxSearch || v.name.toLowerCase().includes(vaxSearch.toLowerCase()));

  function openNew() {
    setForm({ name: "", contact: "", type: "Internal Clinic" }); setSelected([]); setPricing({}); setEditId(null); setStep(1); setShowModal(true);
  }
  function openEdit(p: VaccinePartner) {
    setForm({ name: p.name, contact: p.contact, type: p.type }); setSelected([...p.selectedVaccines]); setPricing({ ...p.pricing }); setEditId(p.id); setStep(1); setShowModal(true);
  }
  function save() {
    if (editId) {
      setPartners(ps => ps.map(p => p.id === editId ? { ...p, ...form, selectedVaccines: selected, pricing } : p));
    } else {
      setPartners(ps => [...ps, { id: uid(), ...form, active: true, selectedVaccines: selected, pricing }]);
    }
    setShowModal(false);
  }
  function toggleVax(id: string) {
    setSelected(ss => ss.includes(id) ? ss.filter(x => x !== id) : [...ss, id]);
  }

  const PARTNER_TYPES: VaccinePartnerType[] = ["Internal Clinic", "Government Program", "Private Centre"];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="bg-[#4982CF] hover:bg-[#3b6bb5] text-white h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Partner
        </Button>
      </div>

      <div className="space-y-3">
        {partners.map(p => {
          const vaxCount    = p.selectedVaccines.length;
          const pricedCount = Object.values(p.pricing).filter(Boolean).length;
          const isExpanded  = expandId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-xl bg-[#4982CF]/10 flex items-center justify-center flex-shrink-0">
                  <Syringe className="h-4 w-4 text-[#4982CF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{p.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {p.type} · {p.contact || "No contact"} · {vaxCount} vaccines · {pricedCount} priced
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${p.type === "Government Program" ? "border-emerald-200 text-emerald-700" : p.type === "Private Centre" ? "border-purple-200 text-purple-700" : "border-[#4982CF]/30 text-[#4982CF]"}`}>
                  {p.type}
                </Badge>
                <Switch checked={p.active} onCheckedChange={v => setPartners(ps => ps.map(x => x.id === p.id ? { ...x, active: v } : x))}
                  className="data-[state=checked]:bg-[#4982CF]" />
                <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#4982CF]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setExpandId(isExpanded ? null : p.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  {p.selectedVaccines.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-slate-400 text-center">No vaccines assigned. Edit partner to assign vaccines.</p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {p.selectedVaccines.map(vid => {
                        const vax = allVaccines.find(v => v.id === vid);
                        if (!vax) return null;
                        return (
                          <div key={vid} className="flex items-center gap-3 px-4 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700">{vax.name}</p>
                              {vax.route && <p className="text-[10px] text-slate-400">{vax.route}</p>}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">Rs.</span>
                              <Input
                                value={p.pricing[vid] ?? ""}
                                onChange={e => setPartners(ps => ps.map(x => x.id === p.id
                                  ? { ...x, pricing: { ...x.pricing, [vid]: e.target.value } }
                                  : x))}
                                placeholder="0"
                                className="h-6 w-24 text-xs text-right"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {partners.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">
            No partners yet. Click "New Partner" to add one.
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Dialog open={showModal} onOpenChange={open => !open && setShowModal(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Partner" : "New Vaccine Partner"} — Step {step} of 2</DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Partner Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. City Vaccination Centre" className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Type</label>
                <div className="flex gap-2">
                  {PARTNER_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.type === t ? "bg-[#4982CF] text-white border-[#4982CF]" : "bg-white text-slate-500 border-slate-200 hover:border-[#4982CF]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Contact</label>
                <Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Phone / email" className="h-9 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button disabled={!form.name.trim()} onClick={() => setStep(2)} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                  Next: Select Vaccines →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 pt-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input value={vaxSearch} onChange={e => setVaxSearch(e.target.value)} placeholder="Search vaccines…" className="pl-8 h-8 text-xs" />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {filtered.map(v => {
                  const checked = selected.includes(v.id);
                  return (
                    <label key={v.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggleVax(v.id)}
                        className="accent-[#4982CF]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                        <p className="text-[10px] text-slate-400">{v.route ?? ""}{v.route && v.doses ? " · " : ""}{v.doses ?? ""}</p>
                      </div>
                      {checked && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Rs.</span>
                          <Input value={pricing[v.id] ?? ""} onChange={e => setPricing(pr => ({ ...pr, [v.id]: e.target.value }))}
                            placeholder="Price" className="h-6 w-20 text-xs text-right" onClick={e => e.stopPropagation()} />
                        </div>
                      )}
                    </label>
                  );
                })}
                {filtered.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">No vaccines match.</p>}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">{selected.length} selected</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>← Back</Button>
                  <Button size="sm" onClick={save} className="bg-[#4982CF] hover:bg-[#3a6ab5] text-white">
                    {editId ? "Save Changes" : "Create Partner"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Partner?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">This will permanently remove the partner and all its pricing data.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setPartners(ps => ps.filter(p => p.id !== deleteId)); setDeleteId(null); }}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Top-level module ─────────────────────────────────────────────────────────

export function VaccineCatalogModule({
  sections, setSections, partners, setPartners, initialView = "master",
}: {
  sections: VaccineSection[];
  setSections: (fn: (prev: VaccineSection[]) => VaccineSection[]) => void;
  partners: VaccinePartner[];
  setPartners: (fn: (prev: VaccinePartner[]) => VaccinePartner[]) => void;
  initialView?: "master" | "partners";
}) {
  const [view, setView] = useState<"master" | "partners">(initialView);
  const totalVaccines   = sections.reduce((s, sec) => s + sec.vaccines.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Syringe className="h-4.5 w-4.5 text-[#4982CF]" />
            Vaccine Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalVaccines} vaccines across {sections.length} sections · {partners.length} partner{partners.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(["master", "partners"] as const).map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={`px-3.5 py-1.5 text-xs font-bold transition-colors ${view === v ? "bg-[#4982CF] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
              {v === "master" ? "Vaccine Master List" : "Vaccine Partners"}
            </button>
          ))}
        </div>
      </div>

      {view === "master"
        ? <VaccineMasterList sections={sections} setSections={setSections} />
        : <VaccinePartners partners={partners} setPartners={setPartners} sections={sections} />
      }
    </div>
  );
}
