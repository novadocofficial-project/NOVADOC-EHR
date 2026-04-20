import { Check } from "lucide-react";

// ─── Types (exported so parent can manage state) ───────────────────────────────

export interface CoughState {
  duration:      string;
  character:     string[];
  origin:        string[];
  sputumAmount:  string;
  sputumColor:   string[];
  assocSymptoms: string[];
  childSymptoms: string[];
  triggers:      string[];
  otherTrigger:  string;
  hxContact:     string[];
  other:         string;
}

export const COUGH_EMPTY: CoughState = {
  duration: "", character: [], origin: [],
  sputumAmount: "", sputumColor: [],
  assocSymptoms: [], childSymptoms: [],
  triggers: [], otherTrigger: "",
  hxContact: [], other: "",
};

// ─── Primitives ────────────────────────────────────────────────────────────────

function RadioOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 transition-colors">
      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected ? "border-[#4982CF]" : "border-slate-300 hover:border-slate-400"
      }`}>
        {selected && <div className="h-2 w-2 rounded-full bg-[#4982CF]" />}
      </div>
      <span>{label}</span>
    </button>
  );
}

function CheckOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 transition-colors">
      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected ? "border-[#4982CF] bg-[#4982CF]" : "border-slate-300 hover:border-slate-400"
      }`}>
        {selected && <Check className="h-2 w-2 text-white" strokeWidth={3.5} />}
      </div>
      <span>{label}</span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-black text-slate-800 mb-2">{children}</p>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-[#4982CF] mt-3 mb-1.5">{children}</p>;
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-x-5 gap-y-2">{children}</div>;
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="pb-4 border-b border-slate-100 last:border-0">{children}</div>;
}

// ─── Controlled Cough History Template ─────────────────────────────────────────

interface CoughHistoryTemplateProps {
  state: CoughState;
  onChange: (state: CoughState) => void;
}

export function CoughHistoryTemplate({ state, onChange }: CoughHistoryTemplateProps) {
  function setRadio<K extends keyof CoughState>(key: K, val: string) {
    onChange({ ...state, [key]: (state[key] as string) === val ? "" : val });
  }

  function toggle<K extends keyof CoughState>(key: K, val: string) {
    const arr = state[key] as string[];
    onChange({ ...state, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] });
  }

  return (
    <div className="space-y-4 text-sm">

      {/* ── 1. Duration ────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Duration:</SectionLabel>
        <OptionGrid>
          {["Acute (< 2 weeks)", "Subacute (3-8 weeks)", "Chronic (>8 weeks)"].map(opt => (
            <RadioOption key={opt} label={opt} selected={state.duration === opt} onClick={() => setRadio("duration", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 2. Character ────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Character:</SectionLabel>
        <OptionGrid>
          {["Dry", "Productive", "Constant", "Early Morning", "Worse at night", "Only in Daytime", "All Day"].map(opt => (
            <CheckOption key={opt} label={opt} selected={state.character.includes(opt)} onClick={() => toggle("character", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 3. Cough Origin ─────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Cough Origin:</SectionLabel>
        <OptionGrid>
          {["Due to Throat Irritation", "PostNasal", "From the Chest", "Associated with Wheezing"].map(opt => (
            <CheckOption key={opt} label={opt} selected={state.origin.includes(opt)} onClick={() => toggle("origin", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 4. Sputum ────────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Sputum:</SectionLabel>
        <SubLabel>Amount:</SubLabel>
        <OptionGrid>
          {["Scanty", "Copious", "Chronic (>8 weeks)"].map(opt => (
            <RadioOption key={opt} label={opt} selected={state.sputumAmount === opt} onClick={() => setRadio("sputumAmount", opt)} />
          ))}
        </OptionGrid>
        <SubLabel>Color:</SubLabel>
        <OptionGrid>
          {["Clear", "White", "Yellow", "Green", "Rusty", "Tinged", "Associated with Blood"].map(opt => (
            <CheckOption key={opt} label={opt} selected={state.sputumColor.includes(opt)} onClick={() => toggle("sputumColor", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 5. Associated Symptoms ───────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Associated Symptoms:</SectionLabel>
        <OptionGrid>
          {[
            "Wheezing", "SOB when lying flat", "Acid Reflux", "Wake up at Night due to SOB",
            "Ankle / Leg Edema", "Regurgitation", "Weight Loss", "Fever",
          ].map(opt => (
            <CheckOption key={opt} label={opt} selected={state.assocSymptoms.includes(opt)} onClick={() => toggle("assocSymptoms", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 6. Symptoms in Children ─────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Symptoms in Children:</SectionLabel>
        <OptionGrid>
          {[
            "Lethargic", "Irritable", "Refusal to Eat", "Stridor", "Very Rapid Breathing", "Spitting Up after Feedings",
          ].map(opt => (
            <CheckOption key={opt} label={opt} selected={state.childSymptoms.includes(opt)} onClick={() => toggle("childSymptoms", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 7. Triggered By ──────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Triggered By:</SectionLabel>
        <OptionGrid>
          {["Dust", "Allergens", "Cold Air", "Wood Burning Stove"].map(opt => (
            <CheckOption key={opt} label={opt} selected={state.triggers.includes(opt)} onClick={() => toggle("triggers", opt)} />
          ))}
        </OptionGrid>
        <SubLabel>Other Trigger:</SubLabel>
        <input
          value={state.otherTrigger}
          onChange={e => onChange({ ...state, otherTrigger: e.target.value })}
          placeholder="Enter Text Here"
          className="w-full text-xs text-slate-700 placeholder-slate-300 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 focus:border-[#4982CF]"
        />
      </Block>

      {/* ── 8. Hx of Contact ────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Hx of Contact:</SectionLabel>
        <OptionGrid>
          {["Person with Respiratory Infection", "Tuberculosis"].map(opt => (
            <CheckOption key={opt} label={opt} selected={state.hxContact.includes(opt)} onClick={() => toggle("hxContact", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 9. Other ────────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Other:</SectionLabel>
        <input
          value={state.other}
          onChange={e => onChange({ ...state, other: e.target.value })}
          placeholder="Enter Text Here"
          className="w-full text-xs text-slate-700 placeholder-slate-300 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 focus:border-[#4982CF]"
        />
      </Block>

    </div>
  );
}

// ─── Summary card shown in HPI section after Mark Done ───────────────────────

const SUMMARY_GROUPS: { label: string; key: keyof CoughState }[] = [
  { label: "Duration",       key: "duration"      },
  { label: "Character",      key: "character"     },
  { label: "Cough Origin",   key: "origin"        },
  { label: "Sputum Amount",  key: "sputumAmount"  },
  { label: "Sputum Color",   key: "sputumColor"   },
  { label: "Assoc. Symptoms",key: "assocSymptoms" },
  { label: "Child Symptoms", key: "childSymptoms" },
  { label: "Triggers",       key: "triggers"      },
  { label: "Hx of Contact",  key: "hxContact"     },
];

export function CoughSummary({ state }: { state: CoughState }) {
  const groups = SUMMARY_GROUPS.map(g => {
    const raw = state[g.key];
    const items: string[] = typeof raw === "string" ? (raw ? [raw] : []) : raw;
    return { label: g.label, items };
  }).filter(g => g.items.length > 0);

  const extras: string[] = [
    ...(state.otherTrigger ? [`Other Trigger: ${state.otherTrigger}`] : []),
    ...(state.other ? [`Other: ${state.other}`] : []),
  ];

  if (groups.length === 0 && extras.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl border border-purple-100 bg-purple-50/50 px-3 py-2.5 space-y-1.5">
      {groups.map(g => (
        <div key={g.label} className="flex flex-wrap items-center gap-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 w-full">{g.label}</span>
          {g.items.map(item => (
            <span
              key={item}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-purple-200 text-purple-700">
              {item}
            </span>
          ))}
        </div>
      ))}
      {extras.map(e => (
        <p key={e} className="text-[10px] italic text-purple-500">{e}</p>
      ))}
    </div>
  );
}
