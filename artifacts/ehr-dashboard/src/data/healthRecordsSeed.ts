import { SOAP_DUMMY } from "@/data/soapDummy";

export interface HealthRecordEntry {
  id: string;
  mrn: string;
  patientName: string;
  consultant: string;
  vitalsBy: string;
  createdAt: string;
  type: "New" | "Addendum";
  /** Index into SOAP_DUMMY — supplies the clinical content rendered into the PDF. */
  noteIndex: number;
  visitType: string;
}

export const SEED_HEALTH_RECORDS: HealthRecordEntry[] = [
  {
    id: "hr-1", mrn: "MR-40291", patientName: "Sarah Jenkins",
    consultant: "Dr. Emily Wong", vitalsBy: "Nurse Amina",
    createdAt: "10 Dec 2024, 11:20", type: "New", noteIndex: 0,
    visitType: "Normal Consultation (OPD)",
  },
  {
    id: "hr-2", mrn: "MR-39102", patientName: "Michael Chang",
    consultant: "Dr. James Wilson", vitalsBy: "Nurse Sara",
    createdAt: "10 Nov 2024, 08:45", type: "New", noteIndex: 1,
    visitType: "Normal Consultation (OPD)",
  },
  {
    id: "hr-3", mrn: "MR-38201", patientName: "Aisha Patel",
    consultant: "Dr. Sarah Connor", vitalsBy: "Nurse Lena Roy",
    createdAt: "25 Sep 2024, 05:45", type: "New", noteIndex: 2,
    visitType: "Normal Consultation (OPD)",
  },
  {
    id: "hr-4", mrn: "MR-41103", patientName: "Carlos Rivera",
    consultant: "Dr. Emily Wong", vitalsBy: "Nurse Amina",
    createdAt: "14 Dec 2024, 09:05", type: "Addendum", noteIndex: 0,
    visitType: "Urgent / Emergency",
  },
  {
    id: "hr-5", mrn: "MR-42210", patientName: "Emma Thompson",
    consultant: "Dr. James Wilson", vitalsBy: "Nurse Sara",
    createdAt: "12 Nov 2024, 14:30", type: "New", noteIndex: 1,
    visitType: "Normal Consultation (OPD)",
  },
  {
    id: "hr-6", mrn: "MR-43001", patientName: "Raj Sharma",
    consultant: "Dr. Sarah Connor", vitalsBy: "Nurse Lena Roy",
    createdAt: "28 Sep 2024, 16:10", type: "Addendum", noteIndex: 2,
    visitType: "Normal Consultation (OPD)",
  },
  {
    id: "hr-7", mrn: "MR-44120", patientName: "Fatima Al-Hassan",
    consultant: "Dr. Emily Wong", vitalsBy: "Nurse Amina",
    createdAt: "02 Jan 2025, 10:00", type: "New", noteIndex: 0,
    visitType: "Post-Op Follow-up",
  },
  {
    id: "hr-8", mrn: "MR-45000", patientName: "David Okonkwo",
    consultant: "Dr. James Wilson", vitalsBy: "Nurse Sara",
    createdAt: "05 Jan 2025, 12:40", type: "New", noteIndex: 1,
    visitType: "Normal Consultation (OPD)",
  },
];

export function getSoapDummyNote(noteIndex: number) {
  return SOAP_DUMMY[noteIndex] ?? SOAP_DUMMY[0];
}
