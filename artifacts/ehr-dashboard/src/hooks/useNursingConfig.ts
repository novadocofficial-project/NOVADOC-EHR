import { useState, useCallback } from "react";
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

// ─── System Components ────────────────────────────────────────────────────────

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

// ─── Component & Template Types ───────────────────────────────────────────────

export interface NursingComponent {
  id: string;
  type: "system" | "custom";
  systemKey?: SystemComponentKey;
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

export interface NursingConfig {
  templates: NursingHistoryTemplate[];
  visitTypeMappings: Record<string, string>;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: NursingConfig = {
  visitTypeMappings: {},
  templates: [
    {
      id: "nt-default",
      name: "General Nursing Assessment",
      enabled: true,
      components: [
        { id: "nc-1", type: "system", systemKey: "chief-complaint",   name: "Chief Complaint",   fields: [], repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [] },
        { id: "nc-2", type: "system", systemKey: "allergies",         name: "Allergies",         fields: [], repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [] },
        { id: "nc-3", type: "system", systemKey: "past-history",      name: "Past History",      fields: [], repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [] },
        { id: "nc-4", type: "system", systemKey: "current-medicines", name: "Current Medicines", fields: [], repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [] },
      ],
    },
    {
      id: "nt-emergency",
      name: "Emergency Intake",
      enabled: true,
      components: [
        { id: "ne-1", type: "system", systemKey: "chief-complaint",  name: "Chief Complaint",  fields: [], repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [] },
        { id: "ne-2", type: "system", systemKey: "allergies",        name: "Allergies",        fields: [], repeatable: false, repeatLimit: null, entryLayout: "vertical", columns: 2, conditionalRules: [] },
        { id: "ne-3", type: "custom", name: "Injury Details",
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
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ehr-nursing-config-v1";

function normalizeConfig(stored: Partial<NursingConfig>): NursingConfig {
  return {
    visitTypeMappings: (stored.visitTypeMappings && typeof stored.visitTypeMappings === "object" && !Array.isArray(stored.visitTypeMappings))
      ? stored.visitTypeMappings as Record<string, string>
      : {},
    templates: Array.isArray(stored.templates) && stored.templates.length > 0
      ? stored.templates.map(t => ({
          id: t.id ?? `nt-${Date.now()}`,
          name: t.name ?? "Unnamed Template",
          enabled: t.enabled ?? true,
          components: Array.isArray(t.components)
            ? t.components.map(c => ({
                id: c.id ?? `nc-${Date.now()}`,
                type: c.type ?? "custom",
                systemKey: c.systemKey,
                name: c.name ?? "",
                fields: Array.isArray(c.fields) ? c.fields : [],
                repeatable: c.repeatable ?? false,
                repeatLimit: c.repeatLimit ?? null,
                entryLayout: c.entryLayout === "horizontal" ? "horizontal" : "vertical",
                columns: ([1, 2, 3, 4] as const).includes(c.columns) ? c.columns : 2,
                conditionalRules: Array.isArray(c.conditionalRules) ? c.conditionalRules : [],
              }))
            : [],
        }))
      : DEFAULT_CONFIG.templates,
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
