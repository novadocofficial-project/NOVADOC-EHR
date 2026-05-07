import { useState, useCallback } from "react";

// ─── Field & Section Types ────────────────────────────────────────────────────

export type FieldType =
  | "text" | "number" | "dropdown" | "checkbox" | "radio"
  | "date" | "textarea" | "file" | "signature";

export interface RegField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  enabled: boolean;
  options: string[];
  placeholder: string;
  isBuiltIn?: boolean;
}

export interface ConditionalRule {
  id: string;
  triggerFieldId: string;
  triggerValues: string[];
  showFieldIds: string[];
}

export interface RegSection {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  signatureRequired: boolean;
  fields: RegField[];
  conditionalRules: ConditionalRule[];
  workflowOrder: number;
  isBuiltIn: boolean;
  sectionType: "basic-info" | "demographics" | "custom";
}

export interface PatientTypeConfig {
  id: "cash" | "insurance" | "corporate" | "welfare";
  label: string;
  color: string;
  enabled: boolean;
  extraFields: RegField[];
  welfareFormId: string | null;
}

export interface WelfareFormTemplate {
  id: string;
  name: string;
  fields: RegField[];
}

export interface QuickRegField {
  fieldId: "name" | "phone" | "cnic" | "dob";
  label: string;
  visible: boolean;
  required: boolean;
}

export interface QuickRegProfile {
  id: string;
  name: string;
  fields: QuickRegField[];
}

export interface RegConfig {
  sections: RegSection[];
  patientTypes: PatientTypeConfig[];
  welfareForms: WelfareFormTemplate[];
  quickProfiles: QuickRegProfile[];
  queueProfileMap: Record<string, string>;
}

// ─── Default Config ───────────────────────────────────────────────────────────

const DEFAULT_QUICK_FIELDS: QuickRegField[] = [
  { fieldId: "name",  label: "Name",          visible: true,  required: true  },
  { fieldId: "phone", label: "Phone",          visible: true,  required: true  },
  { fieldId: "cnic",  label: "CNIC",           visible: false, required: false },
  { fieldId: "dob",   label: "Date of Birth",  visible: false, required: false },
];

export const DEFAULT_REG_CONFIG: RegConfig = {
  sections: [
    {
      id: "basic-info",
      name: "Basic Information",
      description: "Core patient identity and contact fields.",
      enabled: true,
      signatureRequired: false,
      workflowOrder: 1,
      isBuiltIn: true,
      sectionType: "basic-info",
      conditionalRules: [
        {
          id: "rel-rule",
          triggerFieldId: "relationship_type",
          triggerValues: ["parent", "spouse", "guardian"],
          showFieldIds: ["rel_name", "rel_contact", "rel_cnic", "rel_dob"],
        },
      ],
      fields: [
        { id: "first_name",        label: "First Name",             type: "text",     required: true,  enabled: true,  options: [], placeholder: "First name",          isBuiltIn: true },
        { id: "last_name",         label: "Last Name",              type: "text",     required: false, enabled: true,  options: [], placeholder: "Last name",           isBuiltIn: true },
        { id: "dob",               label: "Date of Birth",          type: "date",     required: true,  enabled: true,  options: [], placeholder: "",                    isBuiltIn: true },
        { id: "phone",             label: "Phone Number",           type: "text",     required: true,  enabled: true,  options: [], placeholder: "+92 300 000-0000",     isBuiltIn: true },
        { id: "cnic",              label: "CNIC",                   type: "text",     required: true,  enabled: true,  options: [], placeholder: "00000-0000000-0",      isBuiltIn: true },
        { id: "referred_by",       label: "Referred By",            type: "text",     required: false, enabled: true,  options: [], placeholder: "Referrer name",        isBuiltIn: true },
        { id: "address",           label: "Complete Address",       type: "textarea", required: false, enabled: true,  options: [], placeholder: "Street, area, city...", isBuiltIn: true },
        { id: "relationship_type", label: "Relationship Type",      type: "dropdown", required: false, enabled: true,  options: ["self", "parent", "spouse", "guardian"], placeholder: "", isBuiltIn: true },
        { id: "rel_name",          label: "Related Person Name",    type: "text",     required: false, enabled: true,  options: [], placeholder: "Full name",            isBuiltIn: true },
        { id: "rel_contact",       label: "Related Person Contact", type: "text",     required: false, enabled: true,  options: [], placeholder: "Phone",               isBuiltIn: true },
        { id: "rel_cnic",          label: "Related Person CNIC",    type: "text",     required: false, enabled: true,  options: [], placeholder: "00000-0000000-0",      isBuiltIn: true },
        { id: "rel_dob",           label: "Related Person DOB",     type: "date",     required: false, enabled: true,  options: [], placeholder: "",                    isBuiltIn: true },
      ],
    },
    {
      id: "demographics",
      name: "Demographics",
      description: "Optional social and demographic information.",
      enabled: false,
      signatureRequired: false,
      workflowOrder: 2,
      isBuiltIn: true,
      sectionType: "demographics",
      conditionalRules: [],
      fields: [
        { id: "dem_language",  label: "Language Spoken",       type: "text",     required: false, enabled: true, options: [], placeholder: "" },
        { id: "dem_ethnic",    label: "Ethnic Background",     type: "text",     required: false, enabled: true, options: [], placeholder: "" },
        { id: "dem_locality",  label: "Locality of Residence", type: "text",     required: false, enabled: true, options: [], placeholder: "" },
        { id: "dem_city",      label: "City of Residence",     type: "text",     required: false, enabled: true, options: [], placeholder: "" },
        { id: "dem_education", label: "Education",             type: "dropdown", required: false, enabled: true, options: ["Primary","Secondary","Intermediate","Bachelor","Master","PhD","None"], placeholder: "" },
        { id: "dem_dwelling",  label: "Type of Dwelling",      type: "dropdown", required: false, enabled: true, options: ["Owned","Rented","Government","Shelter","Other"], placeholder: "" },
        { id: "dem_profession",label: "Profession / Job",      type: "text",     required: false, enabled: true, options: [], placeholder: "" },
        { id: "dem_living",    label: "Living Arrangement",    type: "dropdown", required: false, enabled: true, options: ["Alone","With Family","With Spouse","Hostel","Other"], placeholder: "" },
        { id: "dem_household", label: "Household Members",     type: "number",   required: false, enabled: true, options: [], placeholder: "" },
        { id: "dem_water",     label: "Water Provision",       type: "dropdown", required: false, enabled: true, options: ["Tap Water","Well","Filtered","Bottled","Other"], placeholder: "" },
        { id: "dem_sanitation",label: "Sanitation",            type: "dropdown", required: false, enabled: true, options: ["Flush Toilet","Latrine","Open","Other"], placeholder: "" },
        { id: "dem_bathroom",  label: "Bathroom Availability", type: "dropdown", required: false, enabled: true, options: ["Yes","No","Shared"], placeholder: "" },
        { id: "dem_transport", label: "Mode of Transport",     type: "dropdown", required: false, enabled: true, options: ["Car","Motorcycle","Public Bus","Walking","Rickshaw","Other"], placeholder: "" },
        { id: "dem_nutrition", label: "Meals Per Day",         type: "number",   required: false, enabled: true, options: [], placeholder: "" },
      ],
    },
  ],
  patientTypes: [
    {
      id: "cash", label: "Cash", color: "#10b981", enabled: true,
      extraFields: [],
      welfareFormId: null,
    },
    {
      id: "insurance", label: "Insurance", color: "#4982CF", enabled: true,
      extraFields: [
        { id: "ins_company",   label: "Insurance Company", type: "dropdown", required: false, enabled: true, options: ["Jubilee Insurance","EFU Life","Adamjee Insurance","IGI Corporate"], placeholder: "Select..." },
        { id: "ins_number",    label: "Insurance Number",  type: "text",     required: false, enabled: true, options: [], placeholder: "Policy number" },
        { id: "ins_emergency", label: "Emergency Contact", type: "text",     required: false, enabled: true, options: [], placeholder: "Phone" },
        { id: "ins_notes",     label: "Notes",             type: "textarea", required: false, enabled: true, options: [], placeholder: "Any additional notes..." },
      ],
      welfareFormId: null,
    },
    {
      id: "corporate", label: "Corporate", color: "#f59e0b", enabled: true,
      extraFields: [
        { id: "corp_company",     label: "Company Name",    type: "dropdown", required: false, enabled: true, options: ["Jubilee Insurance","EFU Life","Adamjee Insurance","IGI Corporate"], placeholder: "Select..." },
        { id: "corp_employee_id", label: "Employee ID",     type: "text",     required: false, enabled: true, options: [], placeholder: "ID / Number" },
        { id: "corp_emergency",   label: "Emergency Contact",type: "text",    required: false, enabled: true, options: [], placeholder: "Phone" },
        { id: "corp_notes",       label: "Notes",           type: "textarea", required: false, enabled: true, options: [], placeholder: "Any additional notes..." },
      ],
      welfareFormId: null,
    },
    {
      id: "welfare", label: "Welfare", color: "#ef4444", enabled: true,
      extraFields: [],
      welfareFormId: "wf-1",
    },
  ],
  welfareForms: [
    {
      id: "wf-1",
      name: "Standard Welfare Form",
      fields: [
        { id: "wf_income",    label: "Monthly Income",       type: "number",    required: true,  enabled: true, options: [], placeholder: "PKR amount" },
        { id: "wf_household", label: "Household Members",    type: "number",    required: true,  enabled: true, options: [], placeholder: "Count" },
        { id: "wf_reason",    label: "Reason for Welfare",   type: "textarea",  required: true,  enabled: true, options: [], placeholder: "Describe your situation..." },
        { id: "wf_cnic_proof",label: "CNIC Proof",           type: "file",      required: false, enabled: true, options: [], placeholder: "" },
        { id: "wf_signature", label: "Patient Signature",    type: "signature", required: true,  enabled: true, options: [], placeholder: "" },
      ],
    },
  ],
  quickProfiles: [
    { id: "qp-default", name: "Default Profile", fields: DEFAULT_QUICK_FIELDS },
  ],
  queueProfileMap: {},
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ehr-reg-config-v1";

// Merge stored blob with defaults to handle partial / legacy shapes safely.
function normalizeConfig(stored: Partial<RegConfig>): RegConfig {
  // Ensure top-level arrays exist
  const sections = Array.isArray(stored.sections) && stored.sections.length > 0
    ? stored.sections.map(s => ({
        ...DEFAULT_REG_CONFIG.sections.find(d => d.id === s.id) ?? DEFAULT_REG_CONFIG.sections[0],
        ...s,
        fields: Array.isArray(s.fields) ? s.fields : [],
        conditionalRules: Array.isArray(s.conditionalRules) ? s.conditionalRules : [],
      }))
    : DEFAULT_REG_CONFIG.sections;

  const patientTypes = Array.isArray(stored.patientTypes) && stored.patientTypes.length > 0
    ? stored.patientTypes.map(t => ({
        ...DEFAULT_REG_CONFIG.patientTypes.find(d => d.id === t.id) ?? DEFAULT_REG_CONFIG.patientTypes[0],
        ...t,
        extraFields: Array.isArray(t.extraFields) ? t.extraFields : [],
      }))
    : DEFAULT_REG_CONFIG.patientTypes;

  return {
    sections,
    patientTypes,
    welfareForms: Array.isArray(stored.welfareForms) ? stored.welfareForms : DEFAULT_REG_CONFIG.welfareForms,
    quickProfiles: Array.isArray(stored.quickProfiles) && stored.quickProfiles.length > 0
      ? stored.quickProfiles
      : DEFAULT_REG_CONFIG.quickProfiles,
    queueProfileMap: (stored.queueProfileMap && typeof stored.queueProfileMap === "object")
      ? stored.queueProfileMap
      : {},
  };
}

function loadConfig(): RegConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeConfig(JSON.parse(raw) as Partial<RegConfig>);
  } catch { /**/ }
  return DEFAULT_REG_CONFIG;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRegConfig() {
  const [config, setConfig] = useState<RegConfig>(loadConfig);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const updateConfig = useCallback((updater: (prev: RegConfig) => RegConfig) => {
    setConfig(prev => {
      const next = updater(prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /**/ }
      setSavedAt(Date.now());
      return next;
    });
  }, []);

  return { config, updateConfig, savedAt };
}
