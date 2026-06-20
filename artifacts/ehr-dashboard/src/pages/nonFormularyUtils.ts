export interface NonFormularySettings {
  enabled:              boolean;
  requireJustification: boolean;
  presetReasons:        string[];
}

export const NF_SETTINGS_KEY = "ehr-nf-settings-v1";

export const DEFAULT_NF_SETTINGS: NonFormularySettings = {
  enabled:              true,
  requireJustification: false,
  presetReasons: [
    "Drug shortage",
    "No formulary equivalent",
    "Patient intolerance to formulary option",
    "Specialist recommendation",
    "Patient already on this medication",
    "Clinical necessity / urgent requirement",
  ],
};

export function loadNFSettings(): NonFormularySettings {
  try {
    const raw = localStorage.getItem(NF_SETTINGS_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<NonFormularySettings>;
      return {
        enabled:              d.enabled              ?? DEFAULT_NF_SETTINGS.enabled,
        requireJustification: d.requireJustification ?? DEFAULT_NF_SETTINGS.requireJustification,
        presetReasons:        d.presetReasons        ?? DEFAULT_NF_SETTINGS.presetReasons,
      };
    }
  } catch { /**/ }
  return { ...DEFAULT_NF_SETTINGS, presetReasons: [...DEFAULT_NF_SETTINGS.presetReasons] };
}

export function saveNFSettings(s: NonFormularySettings): void {
  try { localStorage.setItem(NF_SETTINGS_KEY, JSON.stringify(s)); } catch { /**/ }
}
