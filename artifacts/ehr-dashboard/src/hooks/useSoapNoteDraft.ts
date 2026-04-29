import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";
import type { SignedRecord } from "@/pages/SoapNotePage";
import type { LabOrder as DrawerLabOrder } from "@/pages/LabDrawer";

const LS_PREFIX = "soap_draft_";
const SIGNED_PREFIX = "soap_signed_";
const ACTIVE_LAB_PREFIX = "ehr_active_lab_order_";
const DEBOUNCE_MS = 800;

function draftKey(entryId: string) {
  return `${LS_PREFIX}${entryId}`;
}

function readDraft(key: string): NoteState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as NoteState) : null;
  } catch {
    return null;
  }
}

/** Standalone utility — call from outside a component (e.g. on consultation complete). */
export function clearSoapDraft(entryId: string) {
  try {
    localStorage.removeItem(draftKey(entryId));
  } catch {
    // ignore
  }
}

/** Synchronously check whether a persisted SOAP draft exists for this entry. */
export function hasSoapDraft(entryId: string): boolean {
  try {
    return localStorage.getItem(draftKey(entryId)) !== null;
  } catch {
    return false;
  }
}

/** Synchronously read and parse the full SOAP draft for this entry. Returns null on miss or parse error. */
export function readSoapDraft(entryId: string): NoteState | null {
  return readDraft(draftKey(entryId));
}

// ─── Routing snapshot persistence ─────────────────────────────────────────────
// Saved at sign time (before draft is cleared) so completion routing can read
// the correct flags even after the draft has been wiped from localStorage.

const ROUTING_PREFIX = "soap_routing_";

export interface RoutingSnapshot {
  hasUnsentLabOrders: boolean;
  hasPrescription: boolean;
}

/** Persist routing flags derived from the note at sign time. */
export function saveRoutingSnapshot(entryId: string, flags: RoutingSnapshot): void {
  try {
    localStorage.setItem(`${ROUTING_PREFIX}${entryId}`, JSON.stringify(flags));
  } catch {
    // storage quota — silently ignore
  }
}

/** Read the persisted routing snapshot for this entry. Returns null if not set. */
export function readRoutingSnapshot(entryId: string): RoutingSnapshot | null {
  try {
    const raw = localStorage.getItem(`${ROUTING_PREFIX}${entryId}`);
    return raw ? (JSON.parse(raw) as RoutingSnapshot) : null;
  } catch {
    return null;
  }
}

/** Remove the routing snapshot (call after consultation is completed). */
export function clearRoutingSnapshot(entryId: string): void {
  try {
    localStorage.removeItem(`${ROUTING_PREFIX}${entryId}`);
  } catch {
    // ignore
  }
}

// ─── Signed-record persistence ────────────────────────────────────────────────

function signedKey(entryId: string) {
  return `${SIGNED_PREFIX}${entryId}`;
}

/** Read persisted signed records for an entry (returns [] on miss or parse error). */
export function readSignedRecords(entryId: string): SignedRecord[] {
  try {
    const raw = localStorage.getItem(signedKey(entryId));
    return raw ? (JSON.parse(raw) as SignedRecord[]) : [];
  } catch {
    return [];
  }
}

/** Persist signed records for an entry. */
export function saveSignedRecords(entryId: string, records: SignedRecord[]): void {
  try {
    localStorage.setItem(signedKey(entryId), JSON.stringify(records));
  } catch {
    // storage quota — silently ignore
  }
}

/** Remove persisted signed records for an entry (call on consultation complete / skip). */
export function clearSignedRecords(entryId: string): void {
  try {
    localStorage.removeItem(signedKey(entryId));
  } catch {
    // ignore
  }
}

// ─── Active lab order persistence ─────────────────────────────────────────────

function activeLabKey(entryId: string) {
  return `${ACTIVE_LAB_PREFIX}${entryId}`;
}

/** Persist the raw lab order dispatched by the doctor for this entry. */
export function saveActiveLabOrder(entryId: string, order: DrawerLabOrder): void {
  try {
    localStorage.setItem(activeLabKey(entryId), JSON.stringify(order));
  } catch {
    // storage quota — silently ignore
  }
}

/** Read the active dispatched lab order for this entry. Returns null if none. */
export function readActiveLabOrder(entryId: string): DrawerLabOrder | null {
  try {
    const raw = localStorage.getItem(activeLabKey(entryId));
    return raw ? (JSON.parse(raw) as DrawerLabOrder) : null;
  } catch {
    return null;
  }
}

/** Remove the active lab order (call when lab marks the patient complete). */
export function clearActiveLabOrder(entryId: string): void {
  try {
    localStorage.removeItem(activeLabKey(entryId));
  } catch {
    // ignore
  }
}

// ─── Pending lab orders persistence ───────────────────────────────────────────
// Stores ALL unsent lab orders written by the doctor before Complete Consultation
// was clicked. Allows the Lab Panel to display every order even when there is no
// single "active" dispatched order (i.e. the patient was routed via the
// hasUnsentLabOrders path rather than the Send-to-Lab button path).

const PENDING_LAB_PREFIX = "ehr_pending_lab_orders_";

function pendingLabKey(entryId: string) {
  return `${PENDING_LAB_PREFIX}${entryId}`;
}

/** Persist all unsent lab orders for this entry so the Lab Panel can read them. */
export function savePendingLabOrders(entryId: string, orders: DrawerLabOrder[]): void {
  try {
    localStorage.setItem(pendingLabKey(entryId), JSON.stringify(orders));
  } catch {
    // storage quota — silently ignore
  }
}

/** Read the persisted unsent lab orders for this entry. Returns [] if none. */
export function readPendingLabOrders(entryId: string): DrawerLabOrder[] {
  try {
    const raw = localStorage.getItem(pendingLabKey(entryId));
    return raw ? (JSON.parse(raw) as DrawerLabOrder[]) : [];
  } catch {
    return [];
  }
}

/** Remove pending lab orders (call when lab marks the patient complete). */
export function clearPendingLabOrders(entryId: string): void {
  try {
    localStorage.removeItem(pendingLabKey(entryId));
  } catch {
    // ignore
  }
}

export function useSoapNoteDraft(entryId: string) {
  const key = useMemo(() => draftKey(entryId), [entryId]);

  // Reactive draft state — updated immediately on every save so drawer
  // remounts (close → reopen) always receive the latest note content.
  const [draft, setDraft] = useState<NoteState | null>(() => readDraft(draftKey(entryId)));

  // When entryId changes (patient switch), reload draft from localStorage.
  useEffect(() => {
    setDraft(readDraft(key));
  }, [key]);

  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest pending note for unmount flush.
  const pendingRef    = useRef<NoteState | null>(null);
  const pendingKeyRef = useRef(key);
  // Guard: set to true when draft is explicitly cleared so the unmount flush
  // doesn't recreate the draft after clearDraft / clearSoapDraft was called.
  const clearedRef    = useRef(false);

  // Keep pendingKeyRef current across key changes.
  useEffect(() => { pendingKeyRef.current = key; clearedRef.current = false; }, [key]);

  const saveDraft = useCallback(
    (note: NoteState) => {
      clearedRef.current = false;
      // Update state immediately so subsequent remounts use the latest value.
      setDraft(note);
      pendingRef.current = note;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(note));
          pendingRef.current = null;
          timerRef.current = null;
        } catch {
          // storage quota — silently ignore
        }
      }, DEBOUNCE_MS);
    },
    [key]
  );

  const clearDraft = useCallback(() => {
    clearedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = null;
    timerRef.current = null;
    setDraft(null);
    clearSoapDraft(entryId);
  }, [entryId]);

  // On unmount: flush any pending debounced write immediately so no edits are
  // lost. Skipped if the draft was explicitly cleared (avoid re-creating it).
  useEffect(() => {
    return () => {
      if (!clearedRef.current && timerRef.current && pendingRef.current) {
        clearTimeout(timerRef.current);
        try {
          localStorage.setItem(pendingKeyRef.current, JSON.stringify(pendingRef.current));
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { draft, saveDraft, clearDraft };
}
