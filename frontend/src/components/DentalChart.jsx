import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ArrowRight } from "lucide-react";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const GROUP = (n) => {
  const i = n % 10, up = Math.floor(n / 10) <= 2;
  if (i <= 2) return { c: "#3D8FB5", l: "Niere / Blase" };
  if (i === 3) return { c: "#2E8B57", l: "Leber / Galle" };
  if (i === 8) return { c: "#C8483B", l: "Herz / Dünndarm" };
  const lung = up ? i <= 5 : i >= 6;
  return lung ? { c: "#B56B3D", l: "Lunge / Dickdarm" } : { c: "#E8A33D", l: "Magen / Milz" };
};

const size = (n) => ({ 1: 30, 2: 26, 3: 28, 4: 28, 5: 28, 6: 38, 7: 36, 8: 32 }[n % 10]);

const Tooth = ({ n, upper, selected, missing, onClick }) => {
  const g = GROUP(n);
  return (
    <button data-testid={`tooth-${n}`} onClick={() => onClick(n)} title={`Zahn ${n}`}
      className={`group relative flex flex-col items-center gap-1 transition-transform hover:-translate-y-0.5 ${upper ? "" : "flex-col-reverse"}`}>
      <span className="font-mono text-[10px] text-[#5C6B75]">{n}</span>
      <span className={`flex items-center justify-center border-2 transition-colors ${upper ? "rounded-b-[40%] rounded-t-md" : "rounded-t-[40%] rounded-b-md"} ${selected ? "border-[#1A2025]" : "border-[#E3DCCD] group-hover:border-[#D96C50]"}`}
        style={{ width: size(n), height: 44, background: missing ? "repeating-linear-gradient(45deg,#fff,#fff 4px,#F6D5CF 4px,#F6D5CF 8px)" : "#FFFDF7" }}>
        {missing && <span className="text-lg font-light text-[#C8483B]">×</span>}
      </span>
      <span className="h-1 w-5 rounded-full" style={{ background: g.c }} />
    </button>
  );
};

export const DentalChart = ({ selectedFdi, missingTeeth, setMissingTeeth, onSelectTooth, onShowChain }) => {
  const [markMode, setMarkMode] = useState(false);
  const click = (n) => {
    const s = String(n);
    if (markMode) setMissingTeeth(missingTeeth.includes(s) ? missingTeeth.filter((x) => x !== s) : [...missingTeeth, s]);
    else onSelectTooth(s);
  };
  const missingCanine = missingTeeth.some((t) => t.endsWith("3"));
  const legend = [...new Map([11, 13, 14, 16, 18].map((n) => [GROUP(n).l, GROUP(n)])).values()];

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-6 thin-scroll" data-testid="dental-chart">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-caps">Gebiss-Schema · FDI</span>
          <h2 className="font-display text-2xl font-light tracking-tight">Zahn-Nerven & Nichtanlagen</h2>
          <p className="mt-1 max-w-xl text-xs text-[#5C6B75]">Blick auf den Patienten: Links im Bild ist die rechte Patientenseite (Quadrant 1 & 4).</p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-[#E5E5E0] bg-white px-4 py-2 text-xs font-medium">
          <Switch data-testid="mark-missing-toggle" checked={markMode} onCheckedChange={setMarkMode} />
          Nichtanlage markieren
        </label>
      </div>

      <div className="rounded-2xl border border-[#E5E5E0] bg-white p-6 shadow-sm">
        <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-[#9BA8B2]"><span>Rechts · Oberkiefer (V2)</span><span>Links</span></div>
        <div className="flex justify-center gap-1.5">
          {UPPER.map((n, i) => (<div key={n} className={i === 8 ? "ml-4" : ""}><Tooth n={n} upper selected={selectedFdi === String(n)} missing={missingTeeth.includes(String(n))} onClick={click} /></div>))}
        </div>
        <div className="my-4 border-t border-dashed border-[#E3DCCD]" />
        <div className="flex justify-center gap-1.5">
          {LOWER.map((n, i) => (<div key={n} className={i === 8 ? "ml-4" : ""}><Tooth n={n} selected={selectedFdi === String(n)} missing={missingTeeth.includes(String(n))} onClick={click} /></div>))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-[#9BA8B2]"><span>Rechts · Unterkiefer (V3)</span><span>Links</span></div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className="label-caps">Zahn-Organ-Schema (traditionell):</span>
        {legend.map((g) => (<span key={g.l} className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full" style={{ background: g.c }} />{g.l}</span>))}
      </div>

      {missingTeeth.length > 0 && (
        <div className="fade-up rounded-2xl bg-[#2A3B47] p-5 text-white" data-testid="missing-summary">
          <span className="label-caps !text-[#E3DCCD]">Simulation · {missingTeeth.length} Zahn/Zähne nicht angelegt</span>
          <p className="mt-2 font-mono text-sm">{missingTeeth.sort().join(", ")}</p>
          {missingCanine && (
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-relaxed text-white/85">Ein fehlender Eckzahn bedeutet fehlende Eckzahnführung. Diskutiert wird eine absteigende Kette Kiefer → HWS → Becken. Neuroanatomisch erklärbar, als Ursache für Beckenschiefstand aber schwach belegt.</p>
              <button data-testid="show-chain-btn" onClick={onShowChain} className="inline-flex items-center gap-2 rounded-full bg-[#D96C50] px-4 py-2 text-xs font-semibold transition-transform hover:translate-x-0.5">
                Kette im 3D-Modell zeigen <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
