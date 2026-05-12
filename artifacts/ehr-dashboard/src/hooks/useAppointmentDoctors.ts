import { useState, useEffect } from "react";
import { INITIAL_DOCTORS, type Doctor } from "@/pages/DoctorsModule";

const STORAGE_KEY = "ehr-doctors-v1";

function loadDoctors(): Doctor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Doctor[];
  } catch {}
  return INITIAL_DOCTORS;
}

export function useAppointmentDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>(loadDoctors);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors)); } catch {}
  }, [doctors]);

  const appointmentDoctors = doctors.filter(
    d => d.doctorType === "appointment" && d.status === "active"
  );

  return { doctors, appointmentDoctors, setDoctors };
}
