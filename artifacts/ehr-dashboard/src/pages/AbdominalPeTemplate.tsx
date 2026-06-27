import { CheckSquare, Square } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AbdominalPeState {
  normalFlat:           boolean;
  normalSoft:           boolean;
  normalBowelSounds:    boolean;
  distension:           boolean;
  mass:                 boolean;
  tenderness:           boolean;
  tendernessLocations:  string[];
  hernia:               boolean;
  guarding:             boolean;
  rebound:              boolean;
  rightCva:             boolean;
  leftCva:              boolean;
  comments:             string;
}

export const ABDOMINAL_PE_EMPTY: AbdominalPeState = {
  normalFlat:          false,
  normalSoft:          false,
  normalBowelSounds:   false,
  distension:          false,
  mass:                false,
  tenderness:          false,
  tendernessLocations: [],
  hernia:              false,
  guarding:            false,
  rebound:             false,
  rightCva:            false,
  leftCva:             false,
  comments:            "",
};

export const ABDOMINAL_PE_ALL_NORMAL: AbdominalPeState = {
  normalFlat:          true,
  normalSoft:          true,
  normalBowelSounds:   true,
  distension:          false,
  mass:                false,
  tenderness:          false,
  tendernessLocations: [],
  hernia:              false,
  guarding:            false,
  rebound:             false,
  rightCva:            false,
  leftCva:             false,
  comments:            "",
};

// Serialise / deserialise using the existing Record<string, string> store

const KEY_PREFIX = "__abd__";

export function serializeAbdominalPe(s: AbdominalPeState): Record<string, string> {
  return {
    [`${KEY_PREFIX}normalFlat`]:          s.normalFlat          ? "1" : "",
    [`${KEY_PREFIX}normalSoft`]:          s.normalSoft          ? "1" : "",
    [`${KEY_PREFIX}normalBowelSounds`]:   s.normalBowelSounds   ? "1" : "",
    [`${KEY_PREFIX}distension`]:          s.distension          ? "1" : "",
    [`${KEY_PREFIX}mass`]:                s.mass                ? "1" : "",
    [`${KEY_PREFIX}tenderness`]:          s.tenderness          ? "1" : "",
    [`${KEY_PREFIX}tendernessLocations`]: s.tendernessLocations.join(","),
    [`${KEY_PREFIX}hernia`]:              s.hernia              ? "1" : "",
    [`${KEY_PREFIX}guarding`]:            s.guarding            ? "1" : "",
    [`${KEY_PREFIX}rebound`]:             s.rebound             ? "1" : "",
    [`${KEY_PREFIX}rightCva`]:            s.rightCva            ? "1" : "",
    [`${KEY_PREFIX}leftCva`]:             s.leftCva             ? "1" : "",
    [`${KEY_PREFIX}comments`]:            s.comments,
    [`${KEY_PREFIX}__marker`]:            "1",
  };
}

export function deserializeAbdominalPe(data: Record<string, string>): AbdominalPeState {
  const g = (k: string) => data[`${KEY_PREFIX}${k}`] ?? "";
  return {
    normalFlat:          g("normalFlat")        === "1",
    normalSoft:          g("normalSoft")        === "1",
    normalBowelSounds:   g("normalBowelSounds") === "1",
    distension:          g("distension")        === "1",
    mass:                g("mass")              === "1",
    tenderness:          g("tenderness")        === "1",
    tendernessLocations: g("tendernessLocations") ? g("tendernessLocations").split(",") : [],
    hernia:              g("hernia")            === "1",
    guarding:            g("guarding")          === "1",
    rebound:             g("rebound")           === "1",
    rightCva:            g("rightCva")          === "1",
    leftCva:             g("leftCva")           === "1",
    comments:            g("comments"),
  };
}

export function isAbdominalPeData(data: Record<string, string>): boolean {
  return `${KEY_PREFIX}__marker` in data;
}

// ─── Narrative builder ────────────────────────────────────────────────────────

export function buildAbdominalPeNarrative(s: AbdominalPeState): string {
  const parts: string[] = [];

  // Appearance
  const appearance: string[] = [];
  if (s.normalFlat)   appearance.push("flat");
  if (s.normalSoft)   appearance.push("soft");
  if (s.distension)   appearance.push("distended");
  if (appearance.length) {
    parts.push(`Abdomen is ${appearance.join(" and ")}.`);
  } else {
    parts.push("Abdomen examined.");
  }

  // Bowel sounds
  if (s.normalBowelSounds) parts.push("Bowel sounds are normal.");

  // Tenderness
  if (s.tenderness) {
    if (s.tendernessLocations.length) {
      parts.push(`Tenderness noted in the ${s.tendernessLocations.join(", ")}.`);
    } else {
      parts.push("Tenderness is present.");
    }
  } else if (s.normalFlat || s.normalSoft || s.normalBowelSounds) {
    parts.push("No tenderness.");
  }

  // Guarding / rebound
  if (s.guarding && s.rebound) {
    parts.push("Guarding and rebound tenderness present.");
  } else if (s.guarding) {
    parts.push("Guarding present. No rebound tenderness.");
  } else if (s.rebound) {
    parts.push("Rebound tenderness present. No guarding.");
  } else if (s.tenderness) {
    parts.push("No guarding or rebound.");
  }

  // Other abnormals
  const others: string[] = [];
  if (s.mass)   others.push("a palpable mass");
  if (s.hernia) others.push("hernia");
  if (others.length) {
    parts.push(`${others.map(o => o.charAt(0).toUpperCase() + o.slice(1)).join(" and ")} noted.`);
  } else if (s.normalFlat || s.normalSoft) {
    if (!s.mass && !s.hernia) parts.push("No mass or hernia.");
  }

  // CVA
  if (s.rightCva && s.leftCva) {
    parts.push("CVA tenderness positive bilaterally.");
  } else if (s.rightCva) {
    parts.push("Right CVA tenderness positive. Left CVA tenderness negative.");
  } else if (s.leftCva) {
    parts.push("Left CVA tenderness positive. Right CVA tenderness negative.");
  } else if (s.normalFlat || s.normalSoft) {
    parts.push("CVA tenderness negative bilaterally.");
  }

  // Comments
  if (s.comments.trim()) parts.push(s.comments.trim());

  return parts.join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

const ACCENT = "#0ea5e9";

const TENDERNESS_LOCATIONS = [
  "RUQ", "LUQ", "Epigastric", "Periumbilical",
  "LLQ", "RLQ", "Suprapubic", "Diffuse",
];

const ABNORMAL_FINDINGS: { key: keyof AbdominalPeState; label: string }[] = [
  { key: "distension",  label: "Distension"        },
  { key: "mass",        label: "Mass"               },
  { key: "tenderness",  label: "Tenderness"         },
  { key: "hernia",      label: "Hernia"             },
  { key: "guarding",    label: "Guarding"           },
  { key: "rebound",     label: "Rebound"            },
  { key: "rightCva",    label: "Right CVA"          },
  { key: "leftCva",     label: "Left CVA"           },
];

interface Props {
  state:    AbdominalPeState;
  onChange: (s: AbdominalPeState) => void;
}

function NormalCheckbox({
  checked, label, onChange,
}: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={[
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
        checked
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/40",
      ].join(" ")}>
      {checked
        ? <CheckSquare className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
        : <Square      className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />}
      {label}
    </button>
  );
}

function AbnormalChip({
  active, label, onClick,
}: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
        active
          ? "bg-rose-50 border-rose-300 text-rose-700"
          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50/40",
      ].join(" ")}>
      {active ? "− " : "+ "}
      {label}
    </button>
  );
}

export function AbdominalPeTemplate({ state, onChange }: Props) {
  function toggle<K extends keyof AbdominalPeState>(key: K) {
    const cur = state[key] as boolean;
    const next: Partial<AbdominalPeState> = { [key]: !cur };
    if (key === "tenderness" && cur) next.tendernessLocations = [];
    onChange({ ...state, ...next });
  }

  function toggleLocation(loc: string) {
    const has = state.tendernessLocations.includes(loc);
    onChange({
      ...state,
      tendernessLocations: has
        ? state.tendernessLocations.filter(l => l !== loc)
        : [...state.tendernessLocations, loc],
    });
  }

  return (
    <div className="space-y-6">

      {/* Normal findings */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px flex-1 bg-slate-100" />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 whitespace-nowrap">
            Normal Findings
          </p>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
        <div className="flex flex-wrap gap-2">
          <NormalCheckbox checked={state.normalFlat}        label="Flat"               onChange={() => toggle("normalFlat")}        />
          <NormalCheckbox checked={state.normalSoft}        label="Soft"               onChange={() => toggle("normalSoft")}        />
          <NormalCheckbox checked={state.normalBowelSounds} label="Bowel sounds nl"    onChange={() => toggle("normalBowelSounds")} />
        </div>
      </div>

      {/* Abnormal findings */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px flex-1 bg-slate-100" />
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 whitespace-nowrap">
            Abnormal Findings
          </p>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
        <div className="flex flex-wrap gap-2">
          {ABNORMAL_FINDINGS.map(({ key, label }) => (
            <AbnormalChip
              key={key}
              active={state[key] as boolean}
              label={label}
              onClick={() => toggle(key)}
            />
          ))}
        </div>
      </div>

      {/* Tenderness location (conditional) */}
      {state.tenderness && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px flex-1 bg-slate-100" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
              Tenderness Location
            </p>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="flex flex-wrap gap-2">
            {TENDERNESS_LOCATIONS.map(loc => {
              const selected = state.tendernessLocations.includes(loc);
              return (
                <button
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className={[
                    "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
                    selected
                      ? "text-white border-transparent"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-sky-300 hover:bg-sky-50/40",
                  ].join(" ")}
                  style={selected ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}>
                  {loc}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="h-px flex-1 bg-slate-100" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
            Comments
          </p>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
        <textarea
          value={state.comments}
          onChange={e => onChange({ ...state, comments: e.target.value })}
          placeholder="Additional abdominal exam findings…"
          rows={3}
          className="w-full text-xs text-slate-700 placeholder-slate-300 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
          style={{ "--tw-ring-color": `${ACCENT}50` } as React.CSSProperties}
        />
      </div>

    </div>
  );
}
