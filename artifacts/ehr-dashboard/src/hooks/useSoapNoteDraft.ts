import { useCallback, useEffect, useRef } from "react";
import type { NoteState } from "@/pages/ClinicalNoteDrawer";

const LS_PREFIX = "soap_draft_";
const DEBOUNCE_MS = 800;

function readDraft(key: string): NoteState | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as NoteState) : null;
  } catch {
    return null;
  }
}

export function useSoapNoteDraft(entryId: string) {
  const key = `${LS_PREFIX}${entryId}`;

  // Read the draft only once — captured at first render
  const draftRef = useRef<NoteState | null>(undefined as unknown as NoteState | null);
  if (draftRef.current === (undefined as unknown as NoteState | null)) {
    draftRef.current = readDraft(key);
  }

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
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  // Cancel any pending save on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { draft: draftRef.current, saveDraft, clearDraft };
}
