import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { NerveLab } from "@/components/lab/NerveLab";
import { VagusLab } from "@/components/lab/VagusLab";

const TABS = [["neuron", "Nervenleitung & Heilung", "NEURON"], ["hrv", "Vagus-Messung (HRV)", "NeuroKit2"]];

export default function Labor() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "hrv" ? "hrv" : "neuron";
  return (
    <div className="min-h-screen bg-[#FCFCFA] px-6 py-8 lg:px-12">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-[#5C6B75] hover:text-[#1A2025]" data-testid="labor-back-link"><ArrowLeft className="h-3.5 w-3.5" /> Zum Atlas</Link>
      <div className="mb-8 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-caps">Nerven-Labor</span>
          <h1 className="font-display text-4xl font-light tracking-tight">Was passiert im Nerv?</h1>
        </div>
        <div className="flex gap-1 rounded-full border border-[#E5E5E0] bg-white p-1">
          {TABS.map(([k, l, s]) => (
            <button key={k} data-testid={`labor-tab-${k}`} onClick={() => setParams({ tab: k })}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${tab === k ? "bg-[#2A3B47] text-white" : "text-[#5C6B75] hover:text-[#1A2025]"}`}>
              {l} <span className="ml-1 font-mono text-[10px] opacity-60">{s}</span>
            </button>
          ))}
        </div>
      </div>
      {tab === "neuron" ? <NerveLab /> : <VagusLab />}
    </div>
  );
}
