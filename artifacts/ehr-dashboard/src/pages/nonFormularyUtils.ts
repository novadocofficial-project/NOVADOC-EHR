// ─── Settings ─────────────────────────────────────────────────────────────────

export interface NonFormularySettings {
  enabled:              boolean;
  requireJustification: boolean;
  presetReasons:        string[];
}

export const NF_SETTINGS_KEY = "ehr-nf-settings-v1";

export const DEFAULT_NF_SETTINGS: NonFormularySettings = {
  enabled:              true,
  requireJustification: false,
  presetReasons: [
    "Drug shortage",
    "No formulary equivalent",
    "Patient intolerance to formulary option",
    "Specialist recommendation",
    "Patient already on this medication",
    "Clinical necessity / urgent requirement",
  ],
};

export function loadNFSettings(): NonFormularySettings {
  try {
    const raw = localStorage.getItem(NF_SETTINGS_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<NonFormularySettings>;
      return {
        enabled:              d.enabled              ?? DEFAULT_NF_SETTINGS.enabled,
        requireJustification: d.requireJustification ?? DEFAULT_NF_SETTINGS.requireJustification,
        presetReasons:        d.presetReasons        ?? DEFAULT_NF_SETTINGS.presetReasons,
      };
    }
  } catch { /**/ }
  return { ...DEFAULT_NF_SETTINGS, presetReasons: [...DEFAULT_NF_SETTINGS.presetReasons] };
}

export function saveNFSettings(s: NonFormularySettings): void {
  try { localStorage.setItem(NF_SETTINGS_KEY, JSON.stringify(s)); } catch { /**/ }
}

// ─── NF Drug Catalogue ────────────────────────────────────────────────────────

export interface NFBrandOption {
  id:       string;
  brand:    string;
  strength: string;
}

export interface NFDrug {
  id:       string;
  generic:  string;
  category: string;
  brands:   NFBrandOption[];
}

export const NF_CATALOGUE_KEY = "ehr-nf-catalogue-v1";

export const NF_SEED_CATALOGUE: NFDrug[] = [
  // ── Biologics ──
  { id: "adalimumab", generic: "Adalimumab", category: "Biologics", brands: [
    { id: "humira-40",    brand: "Humira",    strength: "40mg/0.8ml (SC)" },
    { id: "amgevita-40",  brand: "Amgevita",  strength: "40mg/0.8ml (SC)" },
  ]},
  { id: "rituximab", generic: "Rituximab", category: "Biologics", brands: [
    { id: "mabthera-100", brand: "MabThera",  strength: "100mg/10ml (IV)" },
    { id: "mabthera-500", brand: "MabThera",  strength: "500mg/50ml (IV)" },
  ]},
  { id: "etanercept", generic: "Etanercept", category: "Biologics", brands: [
    { id: "enbrel-25",    brand: "Enbrel",    strength: "25mg (SC)" },
    { id: "enbrel-50",    brand: "Enbrel",    strength: "50mg (SC)" },
  ]},
  { id: "infliximab", generic: "Infliximab", category: "Biologics", brands: [
    { id: "remicade-100", brand: "Remicade",  strength: "100mg (IV infusion)" },
  ]},
  // ── Anticoagulants ──
  { id: "apixaban", generic: "Apixaban", category: "Anticoagulants", brands: [
    { id: "eliquis-2.5",  brand: "Eliquis",   strength: "2.5mg" },
    { id: "eliquis-5",    brand: "Eliquis",   strength: "5mg" },
  ]},
  { id: "rivaroxaban", generic: "Rivaroxaban", category: "Anticoagulants", brands: [
    { id: "xarelto-10",   brand: "Xarelto",   strength: "10mg" },
    { id: "xarelto-15",   brand: "Xarelto",   strength: "15mg" },
    { id: "xarelto-20",   brand: "Xarelto",   strength: "20mg" },
  ]},
  { id: "dabigatran", generic: "Dabigatran", category: "Anticoagulants", brands: [
    { id: "pradaxa-110",  brand: "Pradaxa",   strength: "110mg" },
    { id: "pradaxa-150",  brand: "Pradaxa",   strength: "150mg" },
  ]},
  // ── Antidiabetics ──
  { id: "sitagliptin", generic: "Sitagliptin", category: "Antidiabetics", brands: [
    { id: "januvia-50",   brand: "Januvia",   strength: "50mg" },
    { id: "januvia-100",  brand: "Januvia",   strength: "100mg" },
  ]},
  { id: "empagliflozin", generic: "Empagliflozin", category: "Antidiabetics", brands: [
    { id: "jardiance-10", brand: "Jardiance", strength: "10mg" },
    { id: "jardiance-25", brand: "Jardiance", strength: "25mg" },
  ]},
  { id: "liraglutide", generic: "Liraglutide", category: "Antidiabetics", brands: [
    { id: "victoza-0.6",  brand: "Victoza",   strength: "0.6mg/dose" },
    { id: "victoza-1.2",  brand: "Victoza",   strength: "1.2mg/dose" },
    { id: "victoza-1.8",  brand: "Victoza",   strength: "1.8mg/dose" },
  ]},
  // ── Psychotropics ──
  { id: "quetiapine", generic: "Quetiapine", category: "Psychotropics", brands: [
    { id: "seroquel-25",      brand: "Seroquel",    strength: "25mg" },
    { id: "seroquel-100",     brand: "Seroquel",    strength: "100mg" },
    { id: "seroquel-xr-200",  brand: "Seroquel XR", strength: "200mg XR" },
    { id: "seroquel-xr-400",  brand: "Seroquel XR", strength: "400mg XR" },
  ]},
  { id: "aripiprazole", generic: "Aripiprazole", category: "Psychotropics", brands: [
    { id: "abilify-5",    brand: "Abilify",   strength: "5mg" },
    { id: "abilify-10",   brand: "Abilify",   strength: "10mg" },
    { id: "abilify-15",   brand: "Abilify",   strength: "15mg" },
  ]},
  { id: "clozapine", generic: "Clozapine", category: "Psychotropics", brands: [
    { id: "clozaril-25",  brand: "Clozaril",  strength: "25mg" },
    { id: "clozaril-100", brand: "Clozaril",  strength: "100mg" },
  ]},
  // ── Antidepressants ──
  { id: "venlafaxine", generic: "Venlafaxine", category: "Antidepressants", brands: [
    { id: "effexor-37.5", brand: "Effexor",    strength: "37.5mg" },
    { id: "effexor-75",   brand: "Effexor",    strength: "75mg" },
    { id: "effexor-150",  brand: "Effexor XR", strength: "150mg XR" },
  ]},
  { id: "duloxetine", generic: "Duloxetine", category: "Antidepressants", brands: [
    { id: "cymbalta-30",  brand: "Cymbalta",  strength: "30mg" },
    { id: "cymbalta-60",  brand: "Cymbalta",  strength: "60mg" },
  ]},
  { id: "mirtazapine", generic: "Mirtazapine", category: "Antidepressants", brands: [
    { id: "remeron-15",   brand: "Remeron",   strength: "15mg" },
    { id: "remeron-30",   brand: "Remeron",   strength: "30mg" },
    { id: "remeron-45",   brand: "Remeron",   strength: "45mg" },
  ]},
  // ── Neuropathic Pain ──
  { id: "pregabalin", generic: "Pregabalin", category: "Neuropathic Pain", brands: [
    { id: "lyrica-75",    brand: "Lyrica",    strength: "75mg" },
    { id: "lyrica-150",   brand: "Lyrica",    strength: "150mg" },
    { id: "lyrica-300",   brand: "Lyrica",    strength: "300mg" },
  ]},
  { id: "gabapentin", generic: "Gabapentin", category: "Neuropathic Pain", brands: [
    { id: "neurontin-100", brand: "Neurontin", strength: "100mg" },
    { id: "neurontin-300", brand: "Neurontin", strength: "300mg" },
    { id: "neurontin-400", brand: "Neurontin", strength: "400mg" },
  ]},
  // ── Oncology ──
  { id: "imatinib", generic: "Imatinib", category: "Oncology", brands: [
    { id: "gleevec-100",  brand: "Gleevec",   strength: "100mg" },
    { id: "gleevec-400",  brand: "Gleevec",   strength: "400mg" },
  ]},
  { id: "erlotinib", generic: "Erlotinib", category: "Oncology", brands: [
    { id: "tarceva-100",  brand: "Tarceva",   strength: "100mg" },
    { id: "tarceva-150",  brand: "Tarceva",   strength: "150mg" },
  ]},
  // ── Immunosuppressants ──
  { id: "mycophenolate", generic: "Mycophenolate Mofetil", category: "Immunosuppressants", brands: [
    { id: "cellcept-250", brand: "CellCept",  strength: "250mg" },
    { id: "cellcept-500", brand: "CellCept",  strength: "500mg" },
  ]},
  { id: "tacrolimus", generic: "Tacrolimus", category: "Immunosuppressants", brands: [
    { id: "prograf-0.5",  brand: "Prograf",   strength: "0.5mg" },
    { id: "prograf-1",    brand: "Prograf",   strength: "1mg" },
    { id: "prograf-5",    brand: "Prograf",   strength: "5mg" },
  ]},
];

export function loadNFCatalogue(): NFDrug[] {
  try {
    const raw = localStorage.getItem(NF_CATALOGUE_KEY);
    if (raw) return JSON.parse(raw) as NFDrug[];
  } catch { /**/ }
  return NF_SEED_CATALOGUE.map(d => ({ ...d, brands: [...d.brands] }));
}

export function saveNFCatalogue(catalogue: NFDrug[]): void {
  try { localStorage.setItem(NF_CATALOGUE_KEY, JSON.stringify(catalogue)); } catch { /**/ }
}
