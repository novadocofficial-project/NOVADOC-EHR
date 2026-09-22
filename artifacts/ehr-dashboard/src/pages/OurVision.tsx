import {
  Activity,
  Ambulance,
  Baby,
  Brain,
  Building2,
  Cross,
  Dna,
  HandHeart,
  HeartHandshake,
  House,
  MapPin,
  Ribbon,
  Stethoscope,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { QueueAppHeader } from "@/pages/QueuePageLayout";

type VisionArea = {
  label: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
};

const VISION_AREAS: VisionArea[] = [
  { label: "Primary Healthcare (Urban)", description: "Accessible, coordinated care for growing cities", icon: Building2, iconColor: "#2563eb", iconBg: "#dbeafe" },
  { label: "Primary Healthcare (Rural)", description: "Connected care that reaches underserved communities", icon: MapPin, iconColor: "#65a30d", iconBg: "#ecfccb" },
  { label: "Maternal Healthcare", description: "Continuous support from pregnancy through postpartum", icon: HeartHandshake, iconColor: "#db2777", iconBg: "#fce7f3" },
  { label: "Pediatric Healthcare", description: "Preventive and responsive care for every child", icon: Baby, iconColor: "#7c3aed", iconBg: "#ede9fe" },
  { label: "Urgent Care", description: "Timely treatment for immediate health concerns", icon: Cross, iconColor: "#ea580c", iconBg: "#ffedd5" },
  { label: "Emergency Care", description: "Rapid clinical response when every minute matters", icon: Ambulance, iconColor: "#dc2626", iconBg: "#fee2e2" },
  { label: "Preventive Health and Wellness (NCD)", description: "Proactive screening and long-term disease prevention", icon: Activity, iconColor: "#059669", iconBg: "#d1fae5" },
  { label: "Mental Healthcare", description: "Compassionate support for emotional wellbeing", icon: Brain, iconColor: "#9333ea", iconBg: "#f3e8ff" },
  { label: "Specialty Care", description: "Expert pathways for complex health needs", icon: Stethoscope, iconColor: "#0891b2", iconBg: "#cffafe" },
  { label: "Telemedicine and Digital Clinic", description: "Care without distance through connected clinics", icon: Video, iconColor: "#0d9488", iconBg: "#ccfbf1" },
  { label: "Community Outreach Healthcare", description: "Health services brought directly into communities", icon: Users, iconColor: "#d97706", iconBg: "#fef3c7" },
  { label: "Home Health and Palliative Care", description: "Dignified, personalized care in the comfort of home", icon: House, iconColor: "#c2410c", iconBg: "#ffedd5" },
  { label: "Genetic Disease Clinic", description: "Specialized assessment and lifelong genetic care", icon: Dna, iconColor: "#6d28d9", iconBg: "#ede9fe" },
  { label: "Social Determinants of Health", description: "Addresses the root cause of disease via community health social workers", icon: HandHeart, iconColor: "#0369a1", iconBg: "#e0f2fe" },
  { label: "Population Health", description: "Data-led programs that improve health at scale", icon: Ribbon, iconColor: "#be123c", iconBg: "#ffe4e6" },
];

export function OurVision() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <QueueAppHeader />

      <section className="relative flex-none overflow-hidden bg-gradient-to-br from-[#0f2544] via-[#1a3460] to-[#2d5fa8] px-5 py-10 sm:px-8">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-blue-300/10 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" />
            <span className="text-xs font-semibold tracking-wide text-emerald-400">Connected Care for Every Community</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            Our Vision for Healthcare
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75">
            One connected health ecosystem designed to make quality care accessible across every stage of life, every location, and every level of need.
          </p>
        </div>
      </section>

      <main className="flex-1 px-5 py-8 sm:px-8">
        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {VISION_AREAS.map((area, index) => {
              const Icon = area.icon;
              return (
                <article
                  key={area.label}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#4982CF]/50 hover:shadow-xl"
                >
                  <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: area.iconBg }}
                  >
                    <Icon className="h-6 w-6" style={{ color: area.iconColor }} strokeWidth={1.8} />
                  </div>
                  <h3 className="pr-2 text-sm font-bold leading-snug text-slate-800">{area.label}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{area.description}</p>
                  <div className="mt-4 h-0.5 w-8 rounded-full bg-[#4982CF]/20 transition-all duration-200 group-hover:w-14 group-hover:bg-[#4982CF]" />
                </article>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="flex flex-none items-center justify-between border-t border-slate-200 bg-white px-5 py-3 sm:px-8">
        <p className="text-xs text-slate-400">NovaDoc EHR · A connected vision for healthier communities</p>
        <p className="text-xs text-slate-400">v1.0.0</p>
      </footer>
    </div>
  );
}