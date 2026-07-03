import { useMemo } from "react";
import { readPatientClinicalSnapshot } from "@/hooks/useSoapNoteDraft";
import type { AllergyEntry } from "@/pages/AllergySelector";
import type { MedicineEntry } from "@/pages/FormularySection";
import type { LabOrder } from "@/pages/LabDrawer";
import type { ImagingOrder } from "@/pages/ImagingSection";
import type { DiagnosisEntry } from "@/pages/DiagnosisDrawer";
import type { SurgicalEntry, FamilyRow } from "@/pages/MedicalHistorySection";
import type { PocTestResult } from "@/pages/PocLabsSection";
import type { VitalEntry } from "@/types/vitals";

const APPT_HISTORY_RECORDS_KEY = "appt-history-records";

export interface NursingHistoryRecord {
  recordId:     string;
  templateId:   string;
  templateName: string;
  patientRef:   string | null;
  patientName:  string | null;
  sections:     { name: string; lines: string[] }[];
  completedAt:  number;
}

export interface PatientSoapRepo {
  chiefComplaints: string[];
  hpi:             string;
  allergies:       AllergyEntry[];
  pmhActive:       string[];
  pmhResolved:     string[];
  surgicalRows:    SurgicalEntry[];
  fhRows:          FamilyRow[];
  ros:             Record<string, string[]>;
  peSystems:       string[];
  pocTests:        PocTestResult[];
  diagnoses:       DiagnosisEntry[];
  labOrders:       LabOrder[];
  imagingOrders:   ImagingOrder[];
  medicines:       MedicineEntry[];
  carePlan:        unknown | null;
  referrals:       unknown | null;
  procedureOrders: unknown | null;
  patientGoals:    unknown | null;
  healthEd:        unknown | null;
  vitals:          VitalEntry[];
  nursingHistory:  NursingHistoryRecord[];
}

export const EMPTY_SOAP_REPO: PatientSoapRepo = {
  chiefComplaints: [], hpi: "", allergies: [],
  pmhActive: [], pmhResolved: [], surgicalRows: [], fhRows: [],
  ros: {}, peSystems: [], pocTests: [], diagnoses: [],
  labOrders: [], imagingOrders: [], medicines: [],
  carePlan: null, referrals: null, procedureOrders: null,
  patientGoals: null, healthEd: null,
  vitals: [], nursingHistory: [],
};

export function usePatientSoapRepo(mrn: string): PatientSoapRepo {
  return useMemo(() => {
    if (!mrn) return EMPTY_SOAP_REPO;

    const snapshot = readPatientClinicalSnapshot(mrn);

    let nursingHistory: NursingHistoryRecord[] = [];
    try {
      const raw = localStorage.getItem(APPT_HISTORY_RECORDS_KEY);
      if (raw) {
        const all = JSON.parse(raw) as NursingHistoryRecord[];
        nursingHistory = all
          .filter(r => r.patientRef === mrn)
          .sort((a, b) => b.completedAt - a.completedAt);
      }
    } catch { /**/ }

    return {
      chiefComplaints: snapshot?.chiefComplaints ?? [],
      hpi:             snapshot?.hpi ?? "",
      allergies:       (snapshot?.allergies ?? []) as AllergyEntry[],
      pmhActive:       snapshot?.pmhActive ?? [],
      pmhResolved:     snapshot?.pmhResolved ?? [],
      surgicalRows:    (snapshot?.surgicalRows ?? []) as SurgicalEntry[],
      fhRows:          (snapshot?.fhRows ?? []) as FamilyRow[],
      ros:             snapshot?.ros ?? {},
      peSystems:       snapshot?.peSystems ?? [],
      pocTests:        (snapshot?.pocTests ?? []) as PocTestResult[],
      diagnoses:       (snapshot?.diagnoses ?? []) as DiagnosisEntry[],
      labOrders:       (snapshot?.labOrders ?? []) as LabOrder[],
      imagingOrders:   (snapshot?.imagingOrders ?? []) as ImagingOrder[],
      medicines:       (snapshot?.medicines ?? []) as MedicineEntry[],
      carePlan:        snapshot?.carePlan ?? null,
      referrals:       snapshot?.referrals ?? null,
      procedureOrders: snapshot?.procedureOrders ?? null,
      patientGoals:    snapshot?.patientGoals ?? null,
      healthEd:        snapshot?.healthEd ?? null,
      vitals:          snapshot?.vitals ?? [],
      nursingHistory,
    };
  }, [mrn]);
}
