import { useState, useCallback } from "react";

export type ApptStatus =
  | "booked"
  | "confirmed"
  | "checked_in"
  | "cancelled"
  | "no_show"
  | "rescheduled"
  | "checked_out";

export interface Appointment {
  id: string;
  doctorId: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  type: string;
  specialty: string;
  priority: "normal" | "urgent" | "emergency";
  contagious: boolean;
  contagiousNote: string;
  repeat: boolean;
  repeatType: "daily" | "weekly" | "monthly" | "custom";
  repeatNote: string;
  comments: string;
  status: ApptStatus;
  createdAt: string;
}

const STORAGE_KEY = "ehr-appointments-v1";

function load(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Appointment[];
  } catch {}
  return [];
}

function save(appts: Appointment[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appts)); } catch {}
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(load);

  const addAppointment = useCallback((appt: Appointment) => {
    setAppointments(prev => {
      const next = [...prev, appt];
      save(next);
      return next;
    });
  }, []);

  const updateAppointment = useCallback((id: string, patch: Partial<Appointment>) => {
    setAppointments(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...patch } : a);
      save(next);
      return next;
    });
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => {
      const next = prev.filter(a => a.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { appointments, addAppointment, updateAppointment, deleteAppointment };
}
