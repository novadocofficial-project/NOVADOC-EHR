/** Vital measurement recorded at a single signed consultation. */
export interface VitalEntry {
  date:         string;
  visitKey?:    string;
  bpSystolic?:  number;
  bpDiastolic?: number;
  pulse?:       number;
  spo2?:        number;
  temp?:        number;
}
