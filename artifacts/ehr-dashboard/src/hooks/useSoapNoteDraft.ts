import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

  // Reactive draft state — updated immediately on every save so drawer
  // remounts (close → reopen) always receive the latest note content.
  const [draft, setDraft] = useState<NoteState | null>(() => readDraft(draftKey(entryId)));

  // When entryId changes (patient switch), reload draft from localStorage.
  useEffect(() => {
    setDraft(readDraft(key));
  }, [key]);

  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest note so we can flush on unmount without stale closures.
  const pendingRef   = useRef<NoteState | null>(null);
  const pendingKeyRef = useRef(key);

  // Keep pendingKeyRef in sync so the unmount flush uses the right key.
  useEffect(() => { pendingKeyRef.current = key; }, [key]);

  const saveDraft = useCallback(
    (note: NoteState) => {
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
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = null;
    timerRef.current = null;
    setDraft(null);
    clearSoapDraft(entryId);
  }, [entryId]);

  // On unmount: flush any pending debounced write immediately so no edits are lost.
  useEffect(() => {
    return () => {
      if (timerRef.current && pendingRef.current) {
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
