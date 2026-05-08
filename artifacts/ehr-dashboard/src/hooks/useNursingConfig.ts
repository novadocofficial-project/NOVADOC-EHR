import { useState, useCallback, useEffect } from "react";
import type { ConditionalRule } from "@/hooks/useRegConfig";

export type { ConditionalRule };

// ─── Field Types ──────────────────────────────────────────────────────────────

export type NursingFieldType =
  | "text" | "number" | "dropdown" | "multi-select" | "checkbox" | "date" | "textarea" | "toggle";

export interface NursingField {
  id: string;
  label: string;
  type: NursingFieldType;
  required: boolean;
  enabled: boolean;
  options: string[];
  placeholder: string;
}

// ─── History System Components ────────────────────────────────────────────────

export type SystemComponentKey =
  | "chief-complaint" | "allergies" | "past-history" | "surgical-history"
  | "family-history" | "social-history" | "demographics" | "current-medicines"
  | "ros" | "hpi" | "comorbidities";

export const SYSTEM_COMPONENTS: { key: SystemComponentKey; name: string; desc: string }[] = [
  { key: "chief-complaint",   name: "Chief Complaint",     desc: "Primary reason for visit (Chief Complaint Library)" },
  { key: "allergies",         name: "Allergies",           desc: "Drug and food allergies (Clinical Libraries)" },
  { key: "past-history",      name: "Past History",        desc: "Previous medical history (Clinical Libraries)" },
  { key: "surgical-history",  name: "Surgical History",    desc: "Previous surgeries (Clinical Libraries)" },
  { key: "family-history",    name: "Family History",      desc: "Family medical history (Clinical Libraries)" },
  { key: "social-history",    name: "Social History",      desc: "Lifestyle and social factors (Clinical Libraries)" },
  { key: "demographics",      name: "Demographics",        desc: "Patient demographics (Patient Registration)" },
  { key: "current-medicines", name: "Current Medicines",   desc: "Active medication list (Formulary)" },
  { key: "ros",               name: "Review of Systems",   desc: "Systems review (Clinical Libraries)" },
  { key: "hpi",               name: "HPI",                 desc: "History of present illness (HPI Templates)" },
  { key: "comorbidities",     name: "Comorbidities",       desc: "Chronic conditions (Clinical Goals Library)" },
];

// ─── Procedure System Components ──────────────────────────────────────────────

export type ProcedureSystemComponentKey = "vitals" | "medications" | "consent" | "billing";

export const PROCEDURE_SYSTEM_COMPONENTS: { key: ProcedureSystemComponentKey; name: string; desc: string }[] = [
  { key: "vitals",      name: "Vital Signs",  desc: "Capture patient vitals before/after the procedure" },
  { key: "medications", name: "Medications",  desc: "Record medications and consumables used during the procedure" },
  { key: "consent",     name: "Consent",      desc: "Document patient consent status and witness name" },
  { key: "billing",     name: "Billing",      desc: "Generate procedure billing line items for the front desk" },
];

// ─── Component & Template Types ───────────────────────────────────────────────

export interface NursingComponent {
  id: string;
  type: "system" | "custom";
  systemKey?: SystemComponentKey | ProcedureSystemComponentKey;
  name: string;
  fields: NursingField[];
  repeatable: boolean;
  repeatLimit: number | null;
  entryLayout: "vertical" | "horizontal";
  columns: 1 | 2 | 3 | 4;
  conditionalRules: ConditionalRule[];
}

export interface NursingHistoryTemplate {
  id: string;
  name: string;
  enabled: boolean;
  components: NursingComponent[];
}

export type NursingProcedureTemplate = NursingHistoryTemplate;

export interface NursingConfig {
  templates: NursingHistoryTemplate[];
  visitTypeMappings: Record<string, string>;
  procedureTemplates: NursingProcedureTemplate[];
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

function makeComponent(partial: Partial<NursingComponent> & { id: string; name: string; type: "system" | "custom" }): NursingComponent {
  return { fields: [], repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [], ...partial };
}

const DEFAULT_CONFIG: NursingConfig = {
  visitTypeMappings: {},
  templates: [
    {
      id: "nt-default",
      name: "General Nursing Assessment",
      enabled: true,
      components: [
        makeComponent({ id: "nc-1", type: "system", systemKey: "chief-complaint",   name: "Chief Complaint"   }),
        makeComponent({ id: "nc-2", type: "system", systemKey: "allergies",         name: "Allergies"         }),
        makeComponent({ id: "nc-3", type: "system", systemKey: "past-history",      name: "Past History"      }),
        makeComponent({ id: "nc-4", type: "system", systemKey: "current-medicines", name: "Current Medicines" }),
      ],
    },
    {
      id: "nt-emergency",
      name: "Emergency Intake",
      enabled: true,
      components: [
        makeComponent({ id: "ne-1", type: "system", systemKey: "chief-complaint", name: "Chief Complaint" }),
        makeComponent({ id: "ne-2", type: "system", systemKey: "allergies",       name: "Allergies"       }),
        {
          id: "ne-3", type: "custom", name: "Injury Details",
          fields: [
            { id: "inj-1", label: "Mechanism of Injury",  type: "dropdown",  required: true,  enabled: true, options: ["Fall","MVA","Assault","Burn","Other"], placeholder: "" },
            { id: "inj-2", label: "Time of Injury",       type: "text",      required: false, enabled: true, options: [], placeholder: "e.g. 2 hours ago" },
            { id: "inj-3", label: "Location of Injury",   type: "textarea",  required: false, enabled: true, options: [], placeholder: "Describe location..." },
          ],
          repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [],
        },
      ],
    },
  ],
  procedureTemplates: [
    {
      id: "np-default",
      name: "General Procedure",
      enabled: true,
      components: [
        makeComponent({ id: "npc-1", type: "system", systemKey: "vitals",   name: "Vital Signs" }),
        makeComponent({ id: "npc-2", type: "system", systemKey: "consent",  name: "Consent"     }),
        makeComponent({ id: "npc-3", type: "system", systemKey: "billing",  name: "Billing"     }),
        {
          id: "npc-4", type: "custom", name: "Procedure Details",
          fields: [
            { id: "pd-1", label: "Procedure Name",  type: "text",     required: true,  enabled: true, options: [], placeholder: "e.g. IV Cannulation" },
            { id: "pd-2", label: "Procedure Type",  type: "dropdown", required: false, enabled: true, options: ["Wound Care","IV Therapy","Catheterization","Injection","Dressing Change","Infusion","Other"], placeholder: "" },
            { id: "pd-3", label: "Priority",        type: "dropdown", required: false, enabled: true, options: ["Normal","Urgent"], placeholder: "" },
            { id: "pd-4", label: "Reason",          type: "textarea", required: false, enabled: true, options: [], placeholder: "Clinical reason for this procedure…" },
            { id: "pd-5", label: "Nurse Notes",     type: "textarea", required: false, enabled: true, options: [], placeholder: "Observations and recovery notes…" },
          ],
          repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [],
        },
      ],
    },
    {
      id: "np-wound",
      name: "Wound Care",
      enabled: true,
      components: [
        makeComponent({ id: "nwc-1", type: "system", systemKey: "vitals",   name: "Vital Signs" }),
        makeComponent({ id: "nwc-2", type: "system", systemKey: "consent",  name: "Consent"     }),
        {
          id: "nwc-3", type: "custom", name: "Wound Assessment",
          fields: [
            { id: "wa-1", label: "Wound Location",  type: "text",     required: true,  enabled: true, options: [], placeholder: "e.g. Left forearm" },
            { id: "wa-2", label: "Wound Type",      type: "dropdown", required: true,  enabled: true, options: ["Laceration","Abrasion","Ulcer","Surgical Wound","Burn","Other"], placeholder: "" },
            { id: "wa-3", label: "Wound Size (cm)", type: "text",     required: false, enabled: true, options: [], placeholder: "e.g. 3 x 2 cm" },
            { id: "wa-4", label: "Dressing Used",   type: "dropdown", required: false, enabled: true, options: ["Simple Gauze","Non-adherent","Hydrocolloid","Foam","Alginate","None"], placeholder: "" },
            { id: "wa-5", label: "Condition",       type: "dropdown", required: false, enabled: true, options: ["Clean","Infected","Healing","Deteriorating"], placeholder: "" },
            { id: "wa-6", label: "Next Dressing",   type: "date",     required: false, enabled: true, options: [], placeholder: "" },
          ],
          repeatable: false, repeatLimit: null, entryLayout: "horizontal", columns: 2, conditionalRules: [],
        },
        makeComponent({ id: "nwc-4", type: "system", systemKey: "billing", name: "Billing" }),
      ],
    },
  ],
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ehr-nursing-config-v1";

function normalizeComponent(c: Partial<NursingComponent>): NursingComponent {
  return {
    id: c.id ?? `nc-${Date.now()}`,
    type: c.type ?? "custom",
    systemKey: c.systemKey,
    name: c.name ?? "",
    fields: Array.isArray(c.fields) ? c.fields : [],
    repeatable: c.repeatable ?? false,
    repeatLimit: c.repeatLimit ?? null,
    entryLayout: c.entryLayout === "horizontal" ? "horizontal" : "vertical",
    columns: ([1, 2, 3, 4] as const).includes(c.columns as 1|2|3|4) ? c.columns as 1|2|3|4 : 2,
    conditionalRules: Array.isArray(c.conditionalRules) ? c.conditionalRules : [],
  };
}

function normalizeTemplate(t: Partial<NursingHistoryTemplate>): NursingHistoryTemplate {
  return {
    id: t.id ?? `nt-${Date.now()}`,
    name: t.name ?? "Unnamed Template",
    enabled: t.enabled ?? true,
    components: Array.isArray(t.components) ? t.components.map(normalizeComponent) : [],
  };
}

function normalizeConfig(stored: Partial<NursingConfig>): NursingConfig {
  return {
    visitTypeMappings: (stored.visitTypeMappings && typeof stored.visitTypeMappings === "object" && !Array.isArray(stored.visitTypeMappings))
      ? stored.visitTypeMappings as Record<string, string>
      : {},
    templates: Array.isArray(stored.templates) && stored.templates.length > 0
      ? stored.templates.map(normalizeTemplate)
      : DEFAULT_CONFIG.templates,
    procedureTemplates: Array.isArray(stored.procedureTemplates) && stored.procedureTemplates.length > 0
      ? stored.procedureTemplates.map(normalizeTemplate)
      : DEFAULT_CONFIG.procedureTemplates,
  };
}

function loadConfig(): NursingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeConfig(JSON.parse(raw) as Partial<NursingConfig>);
  } catch { /**/ }
  return DEFAULT_CONFIG;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNursingConfig() {
  const [config, setConfig] = useState<NursingConfig>(loadConfig);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setConfig(loadConfig());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateConfig = useCallback((updater: (prev: NursingConfig) => NursingConfig) => {
    setConfig(prev => {
      const next = updater(prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /**/ }
      setSavedAt(Date.now());
      return next;
    });
  }, []);

  return { config, updateConfig, savedAt };
}
