import { useCallback, useEffect, useMemo, useRef } from "react";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";

const LS_PREFIX = "soap_draft_";
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

export function useSoapNoteDraft(entryId: string) {
  const key = useMemo(() => draftKey(entryId), [entryId]);

  // Read the draft from localStorage once per key (re-reads if entryId changes)
  const draft = useMemo(() => readDraft(key), [key]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(
    (note: NoteState) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(note));
        } catch {
          // storage quota — silently ignore
        }
      }, DEBOUNCE_MS);
    },
    [key]
  );

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearSoapDraft(entryId);
  }, [entryId]);

  // Cancel any pending save on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { draft, saveDraft, clearDraft };
}
