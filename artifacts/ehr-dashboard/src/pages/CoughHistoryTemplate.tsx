import { useState } from "react";
import { Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoughState {
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

const EMPTY: CoughState = {
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

// ─── Cough History Template ────────────────────────────────────────────────────

export function CoughHistoryTemplate() {
  const [s, setS] = useState<CoughState>(EMPTY);

  function setRadio<K extends keyof CoughState>(key: K, val: string) {
    setS(prev => ({ ...prev, [key]: prev[key] === val ? "" : val }));
  }

  function toggle<K extends keyof CoughState>(key: K, val: string) {
    setS(prev => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
      };
    });
  }

  return (
    <div className="space-y-4 text-sm">

      {/* ── 1. Duration ────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Duration:</SectionLabel>
        <OptionGrid>
          {["Acute (< 2 weeks)", "Subacute (3-8 weeks)", "Chronic (>8 weeks)"].map(opt => (
            <RadioOption key={opt} label={opt} selected={s.duration === opt} onClick={() => setRadio("duration", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 2. Character ────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Character:</SectionLabel>
        <OptionGrid>
          {["Dry", "Productive", "Constant", "Early Morning", "Worse at night", "Only in Daytime", "All Day"].map(opt => (
            <CheckOption key={opt} label={opt} selected={s.character.includes(opt)} onClick={() => toggle("character", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 3. Cough Origin ─────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Cough Origin:</SectionLabel>
        <OptionGrid>
          {["Due to Throat Irritation", "PostNasal", "From the Chest", "Associated with Wheezing"].map(opt => (
            <CheckOption key={opt} label={opt} selected={s.origin.includes(opt)} onClick={() => toggle("origin", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 4. Sputum ────────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Sputum:</SectionLabel>

        <SubLabel>Amount:</SubLabel>
        <OptionGrid>
          {["Scanty", "Copious", "Chronic (>8 weeks)"].map(opt => (
            <RadioOption key={opt} label={opt} selected={s.sputumAmount === opt} onClick={() => setRadio("sputumAmount", opt)} />
          ))}
        </OptionGrid>

        <SubLabel>Color:</SubLabel>
        <OptionGrid>
          {["Clear", "White", "Yellow", "Green", "Rusty", "Tinged", "Associated with Blood"].map(opt => (
            <CheckOption key={opt} label={opt} selected={s.sputumColor.includes(opt)} onClick={() => toggle("sputumColor", opt)} />
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
            <CheckOption key={opt} label={opt} selected={s.assocSymptoms.includes(opt)} onClick={() => toggle("assocSymptoms", opt)} />
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
            <CheckOption key={opt} label={opt} selected={s.childSymptoms.includes(opt)} onClick={() => toggle("childSymptoms", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 7. Triggered By ──────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Triggered By:</SectionLabel>
        <OptionGrid>
          {["Dust", "Allergens", "Cold Air", "Wood Burning Stove"].map(opt => (
            <CheckOption key={opt} label={opt} selected={s.triggers.includes(opt)} onClick={() => toggle("triggers", opt)} />
          ))}
        </OptionGrid>
        <SubLabel>Other Trigger:</SubLabel>
        <input
          value={s.otherTrigger}
          onChange={e => setS(prev => ({ ...prev, otherTrigger: e.target.value }))}
          placeholder="Enter Text Here"
          className="w-full text-xs text-slate-700 placeholder-slate-300 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 focus:border-[#4982CF]"
        />
      </Block>

      {/* ── 8. Hx of Contact ────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Hx of Contact:</SectionLabel>
        <OptionGrid>
          {["Person with Respiratory Infection", "Tuberculosis"].map(opt => (
            <CheckOption key={opt} label={opt} selected={s.hxContact.includes(opt)} onClick={() => toggle("hxContact", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* ── 9. Other ────────────────────────────────────────────────────────── */}
      <Block>
        <SectionLabel>Other:</SectionLabel>
        <input
          value={s.other}
          onChange={e => setS(prev => ({ ...prev, other: e.target.value }))}
          placeholder="Enter Text Here"
          className="w-full text-xs text-slate-700 placeholder-slate-300 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 focus:border-[#4982CF]"
        />
      </Block>

    </div>
  );
}
