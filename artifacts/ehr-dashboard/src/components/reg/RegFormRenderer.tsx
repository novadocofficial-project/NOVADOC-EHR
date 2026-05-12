import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuickRegField } from "@/hooks/useRegConfig";

// ─── Single field control ──────────────────────────────────────────────────────

interface RegFieldControlProps {
  field: QuickRegField;
  value: string;
  onChange: (value: string) => void;
}

export function RegFieldControl({ field, value, onChange }: RegFieldControlProps) {
  const ft = field.fieldType ?? "text";
  const ph = field.placeholder ?? field.label;

  if (ft === "dropdown" && field.options?.length) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={ph} /></SelectTrigger>
        <SelectContent>
          {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (ft === "textarea") {
    return (
      <textarea
        className="w-full px-3 py-2 text-sm rounded-lg border border-input resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16"
        placeholder={ph}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  const inputType =
    field.fieldId === "phone" ? "tel"
    : ft === "date" ? "date"
    : ft === "number" ? "number"
    : "text";

  return (
    <Input
      className="h-9 text-sm"
      type={inputType}
      placeholder={ph}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ─── Multi-field panel (pairs fields into a 2-column grid) ────────────────────

interface RegFormPanelProps {
  fields: QuickRegField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

export function RegFormPanel({ fields, values, onChange }: RegFormPanelProps) {
  const visFields = fields.filter(f => f.visible);
  const rows: React.ReactNode[] = [];
  let i = 0;

  while (i < visFields.length) {
    const f = visFields[i];
    const next = visFields[i + 1];

    if (next) {
      rows.push(
        <div key={`gr-${i}`} className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              {f.label}{f.required && " *"}
            </label>
            <RegFieldControl
              field={f}
              value={values[f.fieldId] ?? ""}
              onChange={v => onChange(f.fieldId, v)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              {next.label}{next.required && " *"}
            </label>
            <RegFieldControl
              field={next}
              value={values[next.fieldId] ?? ""}
              onChange={v => onChange(next.fieldId, v)}
            />
          </div>
        </div>
      );
      i += 2;
    } else {
      rows.push(
        <div key={`sr-${i}`}>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            {f.label}{f.required && " *"}
          </label>
          <RegFieldControl
            field={f}
            value={values[f.fieldId] ?? ""}
            onChange={v => onChange(f.fieldId, v)}
          />
        </div>
      );
      i++;
    }
  }

  return <>{rows}</>;
}
