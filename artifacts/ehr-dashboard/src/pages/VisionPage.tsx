import {
  Blocks,
  CircleDollarSign,
  Database,
  Globe2,
  HeartPulse,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { QueueAppHeader } from "@/pages/QueuePageLayout";

type VisionPrinciple = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
};

const VISION_PRINCIPLES: VisionPrinciple[] = [
  {
    title: "Not Local But Global",
    description: "Healthcare technology designed to scale across communities, regions, and borders.",
    icon: Globe2,
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
  },
  {
    title: "User Led Design",
    description: "Built around the real needs and experiences of patients, clinicians, and care teams.",
    icon: UsersRound,
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
  },
  {
    title: "Modular Integrated",
    description: "Flexible modules working together as one connected healthcare ecosystem.",
    icon: Blocks,
    iconColor: "#0891b2",
    iconBg: "#cffafe",
  },
  {
    title: "Patient Centric",
    description: "Every workflow and decision keeps the patient at the center of care.",
    icon: HeartPulse,
    iconColor: "#db2777",
    iconBg: "#fce7f3",
  },
  {
    title: "Robust DB Design for Longitudinal Care & Research & Innovation",
    description: "A dependable data foundation supporting lifelong records, meaningful research, and continuous innovation.",
    icon: Database,
    iconColor: "#059669",
    iconBg: "#d1fae5",
  },
  {
    title: "Cost Effective",
    description: "Practical digital healthcare that delivers sustainable value without compromising quality.",
    icon: CircleDollarSign,
    iconColor: "#d97706",
    iconBg: "#fef3c7",
  },
];

export function VisionPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <QueueAppHeader />

      <section className="relative flex-none overflow-hidden bg-gradient-to-br from-[#0f2544] via-[#1a3460] to-[#2d5fa8] px-5 py-7 sm:px-8">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
            <span className="text-xs font-semibold tracking-wide text-emerald-400">The Future We Are Building</span>
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            Our Vision for Healthcare
          </h1>
          <p className="mt-2 w-full text-sm leading-5 text-blue-100/75">
            A globally relevant, integrated healthcare platform shaped by its users and centered on every patient.
          </p>
        </div>
      </section>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VISION_PRINCIPLES.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <article
                key={principle.title}
                className="group relative min-h-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#4982CF]/50 hover:shadow-xl"
              >
                <span className="absolute right-5 top-4 text-xs font-bold text-slate-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div
                  className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: principle.iconBg }}
                >
                  <Icon className="h-7 w-7" style={{ color: principle.iconColor }} strokeWidth={1.8} />
                </div>
                <h2 className="max-w-[90%] text-base font-bold leading-snug text-slate-800">{principle.title}</h2>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500">{principle.description}</p>
                <div className="mt-5 h-0.5 w-10 rounded-full bg-[#4982CF]/20 transition-all duration-200 group-hover:w-16 group-hover:bg-[#4982CF]" />
              </article>
            );
          })}
        </div>
      </main>

      <footer className="flex flex-none items-center justify-between border-t border-slate-200 bg-white px-5 py-3 sm:px-8">
        <p className="text-xs text-slate-400">NovaDoc EHR · Designing the future of connected care</p>
        <p className="text-xs text-slate-400">v1.0.0</p>
      </footer>
    </div>
  );
}