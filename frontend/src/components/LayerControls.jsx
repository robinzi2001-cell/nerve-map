import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { LAYERS } from "@/lib/api";
import { VIEWS } from "@/components/body/BodyScene";
import { useRef } from "react";
import { Layers, RotateCw, Upload, X } from "lucide-react";

const ModeSwitch = ({ detailed, setDetailed }) => (
  <div className="grid grid-cols-2 gap-1 rounded-full border border-[#E5E5E0] bg-[#F0F0ED] p-1" data-testid="model-mode-switch">
    {[[false, "Vereinfacht"], [true, "Detailliert"]].map(([v, l]) => (
      <button key={l} data-testid={`model-mode-${v ? "detailliert" : "vereinfacht"}`} onClick={() => setDetailed(v)}
        className={`rounded-full py-1.5 text-xs font-semibold transition-colors ${detailed === v ? "bg-[#2A3B47] text-white" : "text-[#5C6B75] hover:text-[#1A2025]"}`}>{l}</button>
    ))}
  </div>
);

const CustomStl = ({ custom, setCustom }) => {
  const ref = useRef();
  const load = async (e) => {
    const f = e.target.files[0];
    if (f) setCustom({ name: f.name, buffer: await f.arrayBuffer(), ras: true });
    e.target.value = "";
  };
  return (
    <div className="space-y-1.5 rounded-lg border border-dashed border-[#E3DCCD] p-3">
      <input ref={ref} type="file" accept=".stl" hidden onChange={load} data-testid="custom-stl-input" />
      {custom ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-medium" data-testid="custom-stl-name">{custom.name}</span>
          <button data-testid="custom-stl-remove" onClick={() => setCustom(null)} className="text-[#9BA8B2] hover:text-[#C8483B]"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button data-testid="custom-stl-btn" onClick={() => ref.current.click()} className="flex items-center gap-1.5 text-xs font-semibold text-[#2A3B47] hover:text-[#D96C50]"><Upload className="h-3.5 w-3.5" /> Eigenes Gehirn-STL laden</button>
      )}
      <p className="text-[10px] leading-snug text-[#9BA8B2]">z. B. aus eigenem MRT mit brain-stl erzeugt – wird in den Schädel eingepasst, bleibt nur im Browser.</p>
    </div>
  );
};

export const LayerControls = ({ layers, setLayers, skinOpacity, setSkinOpacity, counts, view, setView, autoRotate, setAutoRotate, detailed, setDetailed, custom, setCustom }) => (
  <div className="space-y-5" data-testid="layer-controls">
    <ModeSwitch detailed={detailed} setDetailed={setDetailed} />
    <div className="flex items-center gap-2">
      <Layers className="h-4 w-4 text-[#D96C50]" />
      <span className="label-caps">Ebenen</span>
    </div>
    <div className="space-y-1">
      {LAYERS.filter((l) => detailed || !l.detailedOnly).map((l, i) => (
        <label key={l.key} className="fade-up flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[#F0F0ED]" style={{ animationDelay: `${i * 40}ms` }}>
          <div>
            <div className="text-sm font-medium">{l.label} {l.data && counts[l.key] != null && <span className="ml-1 font-mono text-[11px] text-[#9BA8B2]">{counts[l.key]}</span>}</div>
            <div className="text-[11px] text-[#9BA8B2]">{l.hint}</div>
          </div>
          <Switch data-testid={`layer-toggle-${l.key}`} checked={layers[l.key]} onCheckedChange={(v) => setLayers({ ...layers, [l.key]: v })} />
        </label>
      ))}
    </div>
    {layers.haut && (
      <div className="px-3">
        <div className="mb-2 flex justify-between text-[11px] text-[#5C6B75]"><span>Haut-Transparenz</span><span className="font-mono">{Math.round(skinOpacity * 100)}%</span></div>
        <Slider data-testid="skin-opacity-slider" min={0.05} max={0.9} step={0.05} value={[skinOpacity]} onValueChange={(v) => setSkinOpacity(v[0])} />
      </div>
    )}
    {detailed && <CustomStl custom={custom} setCustom={setCustom} />}
    <div>
      <span className="label-caps">Ansicht</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(VIEWS).map(([k, v]) => (
          <button key={k} data-testid={`view-btn-${k}`} onClick={() => setView(k)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${view === k ? "border-[#2A3B47] bg-[#2A3B47] text-white" : "border-[#E5E5E0] bg-white hover:border-[#2A3B47]"}`}>
            {v.label}
          </button>
        ))}
        <button data-testid="auto-rotate-btn" onClick={() => setAutoRotate(!autoRotate)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${autoRotate ? "border-[#D96C50] bg-[#D96C50] text-white" : "border-[#E5E5E0] bg-white hover:border-[#D96C50]"}`}>
          <RotateCw className="h-3 w-3" /> Drehen
        </button>
      </div>
    </div>
  </div>
);
