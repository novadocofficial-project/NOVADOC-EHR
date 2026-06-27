import { Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AbdominalPainState {
  quality:        string[];
  painScore:      string;
  location:       string[];
  radiationType:  string;
  radiationTo:    string[];
  onsetNumber:    string;
  onsetUnit:      string;
  course:         string;
  aggravating:    string[];
  alleviating:    string[];
  assocSymptoms:  string[];
  deniedSymptoms: string[];
}

export const ABDOMINAL_PAIN_EMPTY: AbdominalPainState = {
  quality: [], painScore: "", location: [],
  radiationType: "", radiationTo: [],
  onsetNumber: "", onsetUnit: "Days",
  course: "",
  aggravating: [], alleviating: [],
  assocSymptoms: [], deniedSymptoms: [],
};

// ─── Narrative generator ──────────────────────────────────────────────────────

export function buildAbdominalPainNarrative(s: AbdominalPainState): string {
  const sentences: string[] = ["Patient complains of abdominal pain."];

  if (s.quality.length)
    sentences.push(`The pain is described as ${s.quality.join(", ")}.`);

  if (s.painScore)
    sentences.push(`Pain intensity is ${s.painScore}/10.`);

  if (s.location.length) {
    const loc = s.location.join(", ");
    if (s.radiationType === "Without radiation")
      sentences.push(`Pain is located in the ${loc}, without radiation.`);
    else if (s.radiationType === "With radiation" && s.radiationTo.length)
      sentences.push(`Pain is located in the ${loc}, radiating to ${s.radiationTo.join(", ")}.`);
    else
      sentences.push(`Pain is located in the ${loc}.`);
  } else if (s.radiationType === "Without radiation") {
    sentences.push("Pain occurs without radiation.");
  } else if (s.radiationType === "With radiation" && s.radiationTo.length) {
    sentences.push(`Pain radiates to ${s.radiationTo.join(", ")}.`);
  }

  if (s.onsetNumber && s.onsetUnit)
    sentences.push(`Onset was ${s.onsetNumber} ${s.onsetUnit.toLowerCase()} ago.`);

  if (s.course)
    sentences.push(`Symptoms have been ${s.course.toLowerCase()} since onset.`);

  if (s.aggravating.length)
    sentences.push(`Aggravating factors: ${s.aggravating.join(", ")}.`);

  if (s.alleviating.length)
    sentences.push(`Alleviating factors: ${s.alleviating.join(", ")}.`);

  if (s.assocSymptoms.length)
    sentences.push(`Associated symptoms: ${s.assocSymptoms.join(", ")}.`);

  if (s.deniedSymptoms.length)
    sentences.push(`The patient denies: ${s.deniedSymptoms.join(", ")}.`);

  return sentences.join(" ");
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function RadioOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 transition-colors">
      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "border-[#4982CF]" : "border-slate-300 hover:border-slate-400"}`}>
        {selected && <div className="h-2 w-2 rounded-full bg-[#4982CF]" />}
      </div>
      <span>{label}</span>
    </button>
  );
}

function CheckOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 transition-colors">
      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "border-[#4982CF] bg-[#4982CF]" : "border-slate-300 hover:border-slate-400"}`}>
        {selected && <Check className="h-2 w-2 text-white" strokeWidth={3.5} />}
      </div>
      <span>{label}</span>
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-black text-slate-800 mb-2">{children}</p>;
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-x-5 gap-y-2">{children}</div>;
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="pb-4 border-b border-slate-100 last:border-0">{children}</div>;
}

// ─── Pain score colours ───────────────────────────────────────────────────────

function scoreCls(n: number, selected: boolean): string {
  if (selected) return "bg-[#4982CF] text-white shadow-md border-transparent";
  if (n <= 3)   return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
  if (n <= 6)   return "bg-amber-50   text-amber-700   border-amber-200   hover:bg-amber-100";
  return              "bg-red-50      text-red-700      border-red-200      hover:bg-red-100";
}

// ─── Field constants ──────────────────────────────────────────────────────────

const QUALITY = [
  "None","Aching","Burning","Colicky","Cramping","Dull",
  "Hot","Pressure-like","Sharp","Shooting","Stabbing","Tingling",
];
const LOCATION = [
  "RUQ","LUQ","Epigastric","Periumbilical","LLQ","RLQ","Suprapubic","Diffusively","CVA",
];
const RADIATION_TO = [
  "Back","Chest","Left back","Left groin","Left hip",
  "Perineum","Rectum","Right back","Right groin","Right hip","Scrotum",
];
const COURSE = [
  "Stable","Unchanged","Gradually worsening","Rapidly worsening",
  "Gradually improving","Rapidly improving","Completely resolved","Controlled",
];
const AGGRAVATING = [
  "None","Activity","Alcohol","Aspirin","Bowel movement","Coffee","Cold liquids",
  "Dairy products","Eating","Fatty foods","Hot liquids","Movement","NSAIDs",
  "Odors","Pressure","Recumbency","Sitting up","Spicy foods",
];
const ALLEVIATING = [
  "None","Acetaminophen","Activity","Antacids","Aspirin","Belching","Bowel movements",
  "Eating","Flatus","H2 blockers","Liquids","Movement","NSAIDs","Pressure",
  "Proton pump inhibitors","Recumbency","Sitting up","Standing","Urination",
];
const ASSOC_SYMPTOMS = [
  "Nausea","Vomiting","Fever","Diarrhea","Constipation","Bloating",
  "Loss of appetite","Weight loss","Jaundice","Blood in stool","Heartburn","Flatulence",
];
const DENIED_SYMPTOMS = [
  "Nausea","Vomiting","Fever","Diarrhea","Constipation",
  "Bloating","Loss of appetite","Weight loss","Jaundice","Blood in stool",
];

// ─── Main component ───────────────────────────────────────────────────────────

export function AbdominalPainTemplate({
  state, onChange,
}: {
  state: AbdominalPainState;
  onChange: (s: AbdominalPainState) => void;
}) {
  function toggleQuality(val: string) {
    if (val === "None") {
      onChange({ ...state, quality: state.quality.includes("None") ? [] : ["None"] });
    } else {
      const next = state.quality.filter(v => v !== "None");
      onChange({ ...state, quality: next.includes(val) ? next.filter(v => v !== val) : [...next, val] });
    }
  }

  function toggle<K extends keyof AbdominalPainState>(key: K, val: string) {
    const arr = state[key] as string[];
    onChange({ ...state, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] });
  }

  function setRadio<K extends keyof AbdominalPainState>(key: K, val: string) {
    onChange({ ...state, [key]: (state[key] as string) === val ? "" : val });
  }

  return (
    <div className="space-y-4 text-sm">

      {/* 1. Quality */}
      <Block>
        <SectionLabel>Quality:</SectionLabel>
        <OptionGrid>
          {QUALITY.map(opt => (
            <CheckOption key={opt} label={opt} selected={state.quality.includes(opt)} onClick={() => toggleQuality(opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* 2. Pain Score */}
      <Block>
        <SectionLabel>Pain Score (0–10):</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => String(i)).map(n => (
            <button
              key={n}
              onClick={() => onChange({ ...state, painScore: state.painScore === n ? "" : n })}
              className={`h-8 w-8 rounded-lg text-xs font-black transition-all border ${scoreCls(parseInt(n), state.painScore === n)}`}>
              {n}
            </button>
          ))}
        </div>
      </Block>

      {/* 3. Location */}
      <Block>
        <SectionLabel>Location (Abdomen):</SectionLabel>
        <OptionGrid>
          {LOCATION.map(opt => (
            <CheckOption key={opt} label={opt} selected={state.location.includes(opt)} onClick={() => toggle("location", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* 4. Radiation */}
      <Block>
        <SectionLabel>Pain Radiation:</SectionLabel>
        <div className="space-y-2">
          <RadioOption
            label="Without radiation"
            selected={state.radiationType === "Without radiation"}
            onClick={() => onChange({ ...state, radiationType: state.radiationType === "Without radiation" ? "" : "Without radiation", radiationTo: [] })}
          />
          <RadioOption
            label="With radiation to:"
            selected={state.radiationType === "With radiation"}
            onClick={() => onChange({ ...state, radiationType: state.radiationType === "With radiation" ? "" : "With radiation" })}
          />
          {state.radiationType === "With radiation" && (
            <div className="ml-6 mt-2 pt-2 border-l-2 border-[#4982CF]/20 pl-3">
              <OptionGrid>
                {RADIATION_TO.map(opt => (
                  <CheckOption key={opt} label={opt} selected={state.radiationTo.includes(opt)} onClick={() => toggle("radiationTo", opt)} />
                ))}
              </OptionGrid>
            </div>
          )}
        </div>
      </Block>

      {/* 5. Onset */}
      <Block>
        <SectionLabel>Onset:</SectionLabel>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            min="0"
            max="999"
            value={state.onsetNumber}
            onChange={e => onChange({ ...state, onsetNumber: e.target.value })}
            placeholder="0"
            className="w-20 text-xs text-slate-700 placeholder-slate-300 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4982CF]/30 focus:border-[#4982CF] text-center"
          />
          <span className="text-xs text-slate-400 font-medium">ago</span>
          <div className="flex flex-wrap gap-4">
            {["Hours", "Days", "Weeks", "Months"].map(unit => (
              <RadioOption key={unit} label={unit} selected={state.onsetUnit === unit} onClick={() => onChange({ ...state, onsetUnit: unit })} />
            ))}
          </div>
        </div>
      </Block>

      {/* 6. Course */}
      <Block>
        <SectionLabel>Course:</SectionLabel>
        <OptionGrid>
          {COURSE.map(opt => (
            <RadioOption key={opt} label={opt} selected={state.course === opt} onClick={() => setRadio("course", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* 7. Aggravating Factors */}
      <Block>
        <SectionLabel>Aggravating Factors:</SectionLabel>
        <OptionGrid>
          {AGGRAVATING.map(opt => (
            <CheckOption key={opt} label={opt} selected={state.aggravating.includes(opt)} onClick={() => toggle("aggravating", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* 8. Alleviating Factors */}
      <Block>
        <SectionLabel>Alleviating Factors:</SectionLabel>
        <OptionGrid>
          {ALLEVIATING.map(opt => (
            <CheckOption key={opt} label={opt} selected={state.alleviating.includes(opt)} onClick={() => toggle("alleviating", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* 9. Associated Symptoms */}
      <Block>
        <SectionLabel>Associated Symptoms:</SectionLabel>
        <OptionGrid>
          {ASSOC_SYMPTOMS.map(opt => (
            <CheckOption key={opt} label={opt} selected={state.assocSymptoms.includes(opt)} onClick={() => toggle("assocSymptoms", opt)} />
          ))}
        </OptionGrid>
      </Block>

      {/* 10. Patient Denies */}
      <Block>
        <SectionLabel>Patient Denies:</SectionLabel>
        <OptionGrid>
          {DENIED_SYMPTOMS.map(opt => (
            <CheckOption key={opt} label={opt} selected={state.deniedSymptoms.includes(opt)} onClick={() => toggle("deniedSymptoms", opt)} />
          ))}
        </OptionGrid>
      </Block>

    </div>
  );
}
