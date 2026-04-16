import { Package } from "lucide-react";

export function PackagesModule() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-slate-400">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#4982CF]/8 mb-4">
        <Package className="h-10 w-10 text-[#4982CF] opacity-60" />
      </div>
      <p className="text-xl font-bold text-slate-600">Packages & Bundles</p>
      <p className="mt-2 text-sm max-w-xs text-center">
        Bundle multiple services into packages with combined pricing. This module is coming soon.
      </p>
    </div>
  );
}
