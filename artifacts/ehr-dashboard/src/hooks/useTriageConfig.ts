import { useState, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TriageStepType =
  | "patient-details"
  | "presenting-complaint"
  | "question-group"
  | "flag-checklist"
  | "severity-scale"
  | "character-checklist"
  | "outcome";

export type TriageOutcomeType = "ambulance" | "teleconsultation" | "doctor-visit" | "advice";

export interface TriageOutcome {
  type: TriageOutcomeType;
  adviceItems: string[];
}

export interface TriageItem {
  id: string;
  label: string;
}

export interface SeverityBand {
  id: string;
  from: number;
  to: number;
  label: string;
  color: string;
}

export interface TriageStep {
  id: string;
  type: TriageStepType;
  title: string;
  items: TriageItem[];
  ifAnyYes?: TriageOutcome;
  ifAllNo?: TriageOutcome;
  scaleMax: number;
  bands: SeverityBand[];
}

export interface TriageAlgorithm {
  id: string;
  name: string;
  complaintLabel: string;
  enabled: boolean;
  steps: TriageStep[];
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────

function step(
  partial: Partial<TriageStep> & { id: string; type: TriageStepType; title: string },
): TriageStep {
  return { items: [], scaleMax: 10, bands: [], ...partial };
}

// ─── Back-Pain seed algorithm (from First Responder Backpain Triage PDF) ──────

const BACK_PAIN_SEED: TriageAlgorithm = {
  id: "ta-backpain",
  name: "First Responder Backpain Triage",
  complaintLabel: "Back Pain",
  enabled: true,
  steps: [
    step({ id: "ts-bp-1", type: "patient-details",     title: "Patient Basic Details" }),
    step({ id: "ts-bp-2", type: "presenting-complaint", title: "Presenting Complaint" }),
    step({
      id: "ts-bp-3", type: "question-group", title: "Emergency Screening Questions",
      items: [
        { id: "ti-bp-3-1", label: "Unconsciousness" },
        { id: "ti-bp-3-2", label: "Serious Accident" },
        { id: "ti-bp-3-3", label: "Difficulty Staying Standing" },
      ],
      ifAnyYes: { type: "ambulance", adviceItems: [] },
    }),
    step({
      id: "ts-bp-4", type: "question-group", title: "Back Pain Assessment Questions",
      items: [
        { id: "ti-bp-4-1", label: "Duration of back pain more than 5 days" },
        { id: "ti-bp-4-2", label: "Ill contacts at home or work" },
        { id: "ti-bp-4-3", label: "Taken medicine for the back pain" },
        { id: "ti-bp-4-4", label: "Got relief from back pain after taking medicine" },
        { id: "ti-bp-4-5", label: "Contact with a COVID patient" },
      ],
    }),
    step({
      id: "ts-bp-5", type: "flag-checklist", title: "Co-morbid Diseases & High Risk Flags",
      items: [
        { id: "ti-bp-5-1",  label: "Age less than 5 months or over 50" },
        { id: "ti-bp-5-2",  label: "Diabetes" },
        { id: "ti-bp-5-3",  label: "Hypertension" },
        { id: "ti-bp-5-4",  label: "Kidney Disease" },
        { id: "ti-bp-5-5",  label: "Heart Disease" },
        { id: "ti-bp-5-6",  label: "Smoker" },
        { id: "ti-bp-5-7",  label: "Mental Illness" },
        { id: "ti-bp-5-8",  label: "Major Surgery History" },
        { id: "ti-bp-5-9",  label: "Disturbance of Sleep" },
        { id: "ti-bp-5-10", label: "Localized Spinal Tenderness" },
        { id: "ti-bp-5-11", label: "Unexplained Weight Loss" },
      ],
      ifAnyYes: { type: "teleconsultation", adviceItems: [] },
    }),
    step({
      id: "ts-bp-6", type: "severity-scale", title: "Severity of Pain (1 Least – 10 Highest)",
      scaleMax: 10,
      bands: [
        { id: "tb-bp-6-1", from: 1, to: 3,  label: "Mild Grade Pain",     color: "#22c55e" },
        { id: "tb-bp-6-2", from: 4, to: 5,  label: "Moderate Grade Pain", color: "#f59e0b" },
        { id: "tb-bp-6-3", from: 6, to: 8,  label: "High Grade Pain",     color: "#f97316" },
        { id: "tb-bp-6-4", from: 9, to: 10, label: "Severe Pain",         color: "#ef4444" },
      ],
    }),
    step({
      id: "ts-bp-7", type: "character-checklist", title: "Character of Pain",
      items: [
        { id: "ti-bp-7-1", label: "Dull / Achy" },
        { id: "ti-bp-7-2", label: "Sharp" },
        { id: "ti-bp-7-3", label: "Stabbing" },
        { id: "ti-bp-7-4", label: "Shooting" },
        { id: "ti-bp-7-5", label: "Burning or Numb Sensation" },
      ],
    }),
    step({
      id: "ts-bp-8", type: "flag-checklist", title: "Red Flags",
      items: [
        { id: "ti-bp-8-1", label: "Urine Obstruction / Stone" },
        { id: "ti-bp-8-2", label: "Headache / Neck Stiffness / Vomiting" },
        { id: "ti-bp-8-3", label: "Vertigo / Shortness of Breath" },
        { id: "ti-bp-8-4", label: "Lethargic / Disorientation" },
        { id: "ti-bp-8-5", label: "Unusual Bleeding" },
        { id: "ti-bp-8-6", label: "History of Injury" },
      ],
      ifAnyYes: { type: "teleconsultation", adviceItems: [] },
    }),
    step({
      id: "ts-bp-9", type: "flag-checklist", title: "Yellow Flags",
      items: [
        { id: "ti-bp-9-1", label: "Previous Episodes of Back Pain" },
        { id: "ti-bp-9-2", label: "Previous Back Pain Treatments" },
        { id: "ti-bp-9-3", label: "Osteoporosis / Trauma" },
        { id: "ti-bp-9-4", label: "Scoliosis" },
        { id: "ti-bp-9-5", label: "Malignancy" },
        { id: "ti-bp-9-6", label: "Recent Infections / Immunosuppression" },
        { id: "ti-bp-9-7", label: "Cardiovascular Disease" },
        { id: "ti-bp-9-8", label: "Depression" },
      ],
      ifAnyYes: { type: "doctor-visit", adviceItems: [] },
      ifAllNo: {
        type: "advice",
        adviceItems: [
          "Analgesia / benzodiazepines for back pain",
          "Corticosteroid use (clarify length of treatment)",
          "Over the counter drugs / herbal remedies",
          "Review patient allergies before prescribing",
        ],
      },
    }),
  ],
};

const DEFAULT_ALGORITHMS: TriageAlgorithm[] = [BACK_PAIN_SEED];

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ehr-triage-algorithms";

function load(): TriageAlgorithm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TriageAlgorithm[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_ALGORITHMS;
}

function save(data: TriageAlgorithm[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTriageConfig() {
  const [algorithms, setAlgorithms] = useState<TriageAlgorithm[]>(load);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setAlgorithms(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mutate = useCallback((updater: (prev: TriageAlgorithm[]) => TriageAlgorithm[]) => {
    setAlgorithms(prev => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  return { algorithms, mutate };
}
