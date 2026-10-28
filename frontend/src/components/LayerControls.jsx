import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { LAYERS } from "@/lib/api";
import { VIEWS } from "@/components/body/BodyScene";
import { Layers, RotateCw } from "lucide-react";

export const LayerControls = ({ layers, setLayers, skinOpacity, setSkinOpacity, counts, view, setView, autoRotate, setAutoRotate }) => (
  <div className="space-y-5" data-testid="layer-controls">
    <div className="flex items-center gap-2">
      <Layers className="h-4 w-4 text-[#D96C50]" />
      <span className="label-caps">Ebenen</span>
    </div>
    <div className="space-y-1">
      {LAYERS.map((l, i) => (
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
