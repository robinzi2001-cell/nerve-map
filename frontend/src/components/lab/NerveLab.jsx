import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Zap } from "lucide-react";
import { toast } from "sonner";
import { api, errText } from "@/lib/api";
import { EvidenceBadge } from "@/components/EvidenceBadge";

const COLORS = ["#2F6FB0", "#839E8C", "#D9822B", "#C8483B"];

const Propagation = ({ res }) => {
  const [t, setT] = useState(0);
  const raf = useRef();
  const maxT = Math.max(...res.nodes.map((n) => n.arrival_ms || 0)) + 0.3;
  const replay = () => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const tick = (now) => {
      const ms = ((now - start) / 2500) * maxT;
      setT(ms);
      if (ms < maxT) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => { replay(); return () => cancelAnimationFrame(raf.current); /* eslint-disable-next-line */ }, [res]);
  return (
    <div className="space-y-2" data-testid="propagation-view">
      <div className="flex items-center justify-between">
        <span className="label-caps">Ausbreitung entlang {res.length_mm} mm Nerv (Zeitlupe)</span>
        <button onClick={replay} data-testid="replay-propagation-btn" className="text-[11px] font-semibold text-[#D96C50] hover:underline">Erneut abspielen</button>
      </div>
      <div className="relative flex h-10 items-center rounded-full bg-[#F0F0ED] px-3">
        <div className="absolute left-3 right-3 h-1.5 rounded-full bg-[#E3DCCD]" />
        <div className="relative flex w-full justify-between">
          {res.nodes.map((n) => {
            const fired = n.arrival_ms !== null && t >= n.arrival_ms;
            const fresh = fired && t - n.arrival_ms < 0.15;
            return <span key={n.i} className="h-3 w-3 rounded-full border-2 border-white transition-transform" style={{ background: n.arrival_ms === null ? "#C8483B44" : fired ? (fresh ? "#F2A900" : "#2F6FB0") : "#9BA8B2", transform: fresh ? "scale(1.6)" : "none" }} />;
          })}
        </div>
      </div>
      <div className="flex justify-between font-mono text-[10px] text-[#9BA8B2]"><span>Reiz</span><span>t = {t.toFixed(2)} ms</span><span>distal</span></div>
    </div>
  );
};

const Stat = ({ label, value, unit, testid }) => (
  <div className="rounded-xl border border-[#E5E5E0] bg-white p-4">
    <span className="label-caps">{label}</span>
    <div className="mt-1 font-display text-3xl font-light" data-testid={testid}>{value ?? "–"}<span className="ml-1 text-sm text-[#9BA8B2]">{value != null ? unit : ""}</span></div>
  </div>
);

export const NerveLab = () => {
  const [conds, setConds] = useState([]);
  const [cond, setCond] = useState("gesund");
  const [temp, setTemp] = useState(33);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (c = cond, tp = temp) => {
    setBusy(true);
    try { setRes((await api.post("/sim/axon", { condition: c, temperature: tp })).data); }
    catch (e) { toast.error(errText(e)); }
    finally { setBusy(false); }
  };
  useEffect(() => { api.get("/sim/conditions").then((r) => setConds(r.data)); run("gesund", 33); /* eslint-disable-next-line */ }, []);

  const data = res ? res.traces.t.map((t, i) => Object.fromEntries([["t", t], ...res.recorded_nodes.map((n) => [n.key, res.traces[n.key][i]])])) : [];
  const healthy = 69;

  return (
    <div className="grid gap-6 lg:grid-cols-12" data-testid="nerve-lab">
      <div className="space-y-4 lg:col-span-4">
        <span className="label-caps">Zustand des Nervs</span>
        <div className="space-y-1.5">
          {conds.map((c) => (
            <button key={c.key} data-testid={`sim-condition-${c.key}`} onClick={() => { setCond(c.key); run(c.key, temp); }}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${cond === c.key ? "border-[#2A3B47] bg-[#2A3B47] text-white" : "border-[#E5E5E0] bg-white hover:border-[#2A3B47]"}`}>
              <div className="text-sm font-semibold">{c.label}</div>
              <div className={`mt-0.5 text-[11px] leading-snug ${cond === c.key ? "text-white/70" : "text-[#5C6B75]"}`}>{c.desc}</div>
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-[#E5E5E0] bg-white p-4">
          <div className="mb-2 flex justify-between text-xs"><span className="font-medium">Gewebetemperatur</span><span className="font-mono">{temp} °C</span></div>
          <Slider data-testid="sim-temperature-slider" min={24} max={38} step={1} value={[temp]} onValueChange={(v) => setTemp(v[0])} />
          <p className="mt-2 text-[10px] text-[#9BA8B2]">Kälte verlangsamt die Leitung – relevant z. B. bei Kryotherapie.</p>
          <Button data-testid="sim-run-btn" onClick={() => run()} disabled={busy} className="mt-3 w-full rounded-full bg-[#D96C50] hover:bg-[#C45A40]">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Simulieren
          </Button>
        </div>
      </div>
      <div className="space-y-5 lg:col-span-8">
        {res && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Gesamt" value={res.velocity_total} unit="m/s" testid="sim-velocity-total" />
              <Stat label="Proximal" value={res.velocity_proximal} unit="m/s" testid="sim-velocity-proximal" />
              <Stat label="Distal" value={res.velocity_distal} unit="m/s" testid="sim-velocity-distal" />
              <div className="rounded-xl border border-[#E5E5E0] bg-white p-4">
                <span className="label-caps">Status</span>
                <div data-testid="sim-status" className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white ${res.blocked ? "bg-[#C8483B]" : "bg-[#3E8E4A]"}`}>
                  <Zap className="h-3.5 w-3.5" /> {res.blocked ? "Leitungsblock" : "Leitet"}
                </div>
              </div>
            </div>
            {res.velocity_total && <p className="text-xs text-[#5C6B75]" data-testid="sim-comparison">≈ {Math.round((res.velocity_total / healthy) * 100)} % der gesunden Leitgeschwindigkeit. Klinische Norm (motorisch, Arm): ca. 50–65 m/s.</p>}
            <Propagation res={res} />
            <div className="h-72 rounded-xl border border-[#E5E5E0] bg-white p-3" data-testid="sim-trace-chart">
              <ResponsiveContainer>
                <LineChart data={data}>
                  <CartesianGrid stroke="#F0F0ED" />
                  <XAxis dataKey="t" type="number" domain={[0, 4]} tick={{ fontSize: 10 }} unit=" ms" allowDataOverflow />
                  <YAxis domain={[-90, 50]} tick={{ fontSize: 10 }} unit=" mV" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {res.recorded_nodes.map((n, i) => <Line key={n.key} dataKey={n.key} name={`${n.pos_mm} mm`} stroke={COLORS[i]} dot={false} strokeWidth={1.8} isAnimationActive={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-[#F0F0ED] p-4 text-xs leading-relaxed text-[#3A4852]">
              <EvidenceBadge level={res.evidence} testid="sim-evidence" />
              <span>Modell: Ranvier-Schnürringe mit Hodgkin-Huxley-Kinetik, myelinisierte Internodien als passives Kabel (NEURON). Lernmodell – Werte sind qualitativ, nicht für Diagnosen.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
