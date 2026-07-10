// ─── Messaging seed data ──────────────────────────────────────────────────
// Reuses existing seeded staff (doctors + nurses) as the internal directory.

export type StaffRole = "Doctor" | "Nurse" | "Front Desk" | "Lab" | "Admin";

export interface StaffContact {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  color: string;
  initials: string;
  online: boolean;
}

export const STAFF_DIRECTORY: StaffContact[] = [
  { id: "doc-1",  name: "Dr. Emily Wong",   role: "Doctor",     department: "Cardiology",       color: "#4982CF", initials: "EW", online: true },
  { id: "doc-2",  name: "Dr. James Wilson", role: "Doctor",     department: "Orthopedics",      color: "#10b981", initials: "JW", online: false },
  { id: "doc-3",  name: "Dr. Sarah Connor", role: "Doctor",     department: "Pediatrics",       color: "#f59e0b", initials: "SC", online: true },
  { id: "nurse-amina", name: "Nurse Amina",      role: "Nurse",      department: "Cardiology",  color: "#ec4899", initials: "NA", online: true },
  { id: "nurse-sara",  name: "Nurse Sara",       role: "Nurse",      department: "Orthopedics", color: "#8b5cf6", initials: "NS", online: true },
  { id: "nurse-lena",  name: "Nurse Lena Roy",   role: "Nurse",      department: "Pediatrics",  color: "#06b6d4", initials: "LR", online: false },
  { id: "frontdesk-1", name: "Priya Nair",       role: "Front Desk", department: "Reception",   color: "#84cc16", initials: "PN", online: true },
  { id: "lab-1",       name: "Ahmed Khalid",     role: "Lab",        department: "Laboratory",  color: "#ef4444", initials: "AK", online: false },
];

export interface ChatMessage {
  id: string;
  contactId: string;
  sender: "me" | "them";
  text: string;
  timestamp: string;
}

export const SEED_MESSAGES: ChatMessage[] = [
  { id: "m1", contactId: "doc-1", sender: "them", text: "Can you check on the vitals for bed 4 when you get a chance?", timestamp: "2026-07-10T08:12:00" },
  { id: "m2", contactId: "doc-1", sender: "me",   text: "On it, will update the chart in 10 mins.", timestamp: "2026-07-10T08:14:00" },
  { id: "m3", contactId: "doc-1", sender: "them", text: "Thank you! Let me know if the BP is still elevated.", timestamp: "2026-07-10T08:15:00" },

  { id: "m4", contactId: "nurse-amina", sender: "them", text: "Patient in Room A is asking about discharge time.", timestamp: "2026-07-10T09:02:00" },
  { id: "m5", contactId: "nurse-amina", sender: "me",   text: "Tell them Dr. Wong will round by 11am.", timestamp: "2026-07-10T09:05:00" },

  { id: "m6", contactId: "frontdesk-1", sender: "them", text: "Front desk is holding 3 walk-ins for the cardiology queue.", timestamp: "2026-07-10T09:20:00" },
  { id: "m7", contactId: "frontdesk-1", sender: "me",   text: "Send the first two through, one bed is opening up.", timestamp: "2026-07-10T09:22:00" },
  { id: "m8", contactId: "frontdesk-1", sender: "them", text: "Got it, sending them now.", timestamp: "2026-07-10T09:23:00" },

  { id: "m9", contactId: "lab-1", sender: "them", text: "Lab results for MR-40291 are ready for review.", timestamp: "2026-07-09T16:40:00" },

  { id: "m10", contactId: "doc-2", sender: "me", text: "Following up on the ortho consult from yesterday.", timestamp: "2026-07-09T14:00:00" },
  { id: "m11", contactId: "doc-2", sender: "them", text: "Patient is scheduled for a follow-up X-ray next week.", timestamp: "2026-07-09T14:05:00" },
];
