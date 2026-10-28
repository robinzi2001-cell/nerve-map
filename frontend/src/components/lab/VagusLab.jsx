import { useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { api, errText } from "@/lib/api";

const METRICS = [["hr_mean", "Puls", "bpm"], ["rmssd", "RMSSD", "ms"], ["sdnn", "SDNN", "ms"], ["pnn50", "pNN50", "%"], ["hf", "HF-Power", "ms²"], ["lfhf", "LF/HF", ""]];

const Measurement = ({ slot, value, onChange }) => {
  const ref = useRef();
  const [kind, setKind] = useState("rr");
  const [sr, setSr] = useState(1000);
  const [busy, setBusy] = useState(false);
  const upload = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f); fd.append("kind", kind); fd.append("sampling_rate", sr);
    setBusy(true);
    try { onChange({ ...(await api.post("/hrv/analyze", fd)).data, source: f.name }); } catch (err) { toast.error(errText(err)); } finally { setBusy(false); }
  };
  const demo = async () => {
    setBusy(true);
    const p = slot === "vorher" ? { heart_rate: 78, variability: 2 } : { heart_rate: 68, variability: 5 };
    try { onChange({ ...(await api.get("/hrv/demo", { params: p })).data, source: "Simuliertes EKG (Demo)" }); } catch (err) { toast.error(errText(err)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3 rounded-xl border border-[#E5E5E0] bg-white p-4" data-testid={`hrv-slot-${slot}`}>
      <div className="flex items-center justify-between"><span className="label-caps">{slot === "vorher" ? "Vor der Behandlung" : "Nach der Behandlung"}</span>{busy && <Loader2 className="h-4 w-4 animate-spin" />}</div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger data-testid={`hrv-kind-${slot}`}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="rr">RR-Intervalle (ms)</SelectItem><SelectItem value="ecg">Roh-EKG</SelectItem><SelectItem value="ppg">Roh-PPG</SelectItem></SelectContent>
        </Select>
        <Input data-testid={`hrv-rate-${slot}`} type="number" disabled={kind === "rr"} value={sr} onChange={(e) => setSr(e.target.value)} title="Abtastrate (Hz)" />
      </div>
      <input ref={ref} type="file" accept=".csv,.txt" hidden onChange={upload} data-testid={`hrv-file-${slot}`} />
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-full" onClick={() => ref.current.click()} data-testid={`hrv-upload-${slot}`}><Upload className="mr-1.5 h-4 w-4" /> CSV laden</Button>
        <Button variant="ghost" className="rounded-full text-xs" onClick={demo} data-testid={`hrv-demo-${slot}`}>Demo</Button>
      </div>
      {value && <p className="truncate text-[11px] text-[#9BA8B2]" data-testid={`hrv-source-${slot}`}>{value.source} · {value.beats} Schläge · {value.duration_s} s</p>}
    </div>
  );
};

const diff = (a, b) => (a == null || b == null ? null : Math.round(((b - a) / a) * 100));

export const VagusLab = () => {
  const [m, setM] = useState({ vorher: null, nachher: null });
  const series = [...(m.vorher?.rr_series || []).map((p) => ({ t: p.t, vorher: p.rr })), ...(m.nachher?.rr_series || []).map((p) => ({ t: p.t, nachher: p.rr }))].sort((a, b) => a.t - b.t);
  const rm = diff(m.vorher?.rmssd, m.nachher?.rmssd);
  return (
    <div className="grid gap-6 lg:grid-cols-12" data-testid="vagus-lab">
      <div className="space-y-4 lg:col-span-4">
        <p className="text-sm leading-relaxed text-[#3A4852]">Miss die Herzratenvariabilität vor und nach einer Behandlung (z. B. Druckpunkt, Atemübung, Massage). RMSSD und HF-Power spiegeln vor allem die Aktivität des <b>Vagusnervs</b> wider.</p>
        <Measurement slot="vorher" value={m.vorher} onChange={(v) => setM({ ...m, vorher: v })} />
        <Measurement slot="nachher" value={m.nachher} onChange={(v) => setM({ ...m, nachher: v })} />
        <p className="text-[10px] leading-snug text-[#9BA8B2]">CSV: eine Zahlenspalte. RR-Export z. B. aus Brustgurt-Apps (Polar, Elite HRV). Für Frequenzwerte mind. 2 Minuten. „Demo“ nutzt simulierte EKGs aus NeuroKit2.</p>
      </div>
      <div className="space-y-5 lg:col-span-8">
        <div className="overflow-hidden rounded-xl border border-[#E5E5E0] bg-white">
          <div className="grid grid-cols-4 border-b border-[#F0F0ED] bg-[#FCFCFA] px-4 py-2 text-[11px] font-semibold text-[#5C6B75]"><span>Kennwert</span><span>Vorher</span><span>Nachher</span><span>Änderung</span></div>
          {METRICS.map(([k, l, u]) => {
            const d = diff(m.vorher?.[k], m.nachher?.[k]);
            return (
              <div key={k} className="grid grid-cols-4 border-b border-[#F0F0ED] px-4 py-2.5 text-sm last:border-0" data-testid={`hrv-row-${k}`}>
                <span className="font-medium">{l} <span className="text-[10px] text-[#9BA8B2]">{u}</span></span>
                <span className="font-mono">{m.vorher?.[k] ?? "–"}</span>
                <span className="font-mono">{m.nachher?.[k] ?? "–"}</span>
                <span className={`font-mono ${d > 0 ? "text-[#3E8E4A]" : d < 0 ? "text-[#C8483B]" : ""}`}>{d == null ? "–" : `${d > 0 ? "+" : ""}${d} %`}</span>
              </div>
            );
          })}
        </div>
        {rm != null && (
          <div className="flex gap-3 rounded-xl bg-[#2A3B47] p-4 text-sm text-white" data-testid="hrv-interpretation">
            <HeartPulse className="h-5 w-5 shrink-0 text-[#E3DCCD]" />
            <span>{rm >= 10 ? "RMSSD gestiegen – Hinweis auf mehr vagale (parasympathische) Aktivität." : rm <= -10 ? "RMSSD gesunken – eher sympathische Aktivierung (Stress, Bewegung, Schmerz)." : "Kaum Veränderung des Vagustonus."} Einzelmessungen schwanken stark (Atmung, Haltung, Tageszeit) – für Aussagen mehrere Messungen unter gleichen Bedingungen.</span>
          </div>
        )}
        <div className="h-64 rounded-xl border border-[#E5E5E0] bg-white p-3" data-testid="hrv-chart">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid stroke="#F0F0ED" />
              <XAxis dataKey="t" type="number" tick={{ fontSize: 10 }} unit=" s" />
              <YAxis tick={{ fontSize: 10 }} unit=" ms" domain={["auto", "auto"]} />
              <Tooltip />
              <Line dataKey="vorher" stroke="#9BA8B2" dot={false} connectNulls isAnimationActive={false} />
              <Line dataKey="nachher" stroke="#D96C50" dot={false} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
