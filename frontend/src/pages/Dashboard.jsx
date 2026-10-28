import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Activity, ShieldCheck, LogIn } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BodyScene from "@/components/body/BodyScene";
import { LayerControls } from "@/components/LayerControls";
import { EntryList } from "@/components/EntryList";
import { DetailPanel } from "@/components/DetailPanel";
import { DentalChart } from "@/components/DentalChart";
import { PubMedPanel } from "@/components/PubMedPanel";
import { useAuth } from "@/context/AuthContext";
import { api, errText } from "@/lib/api";

const INIT_LAYERS = { haut: true, muskeln: false, skelett: true, nerven: true, druckpunkte: true, meridiane: false, zaehne: true, ketten: false };

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [layers, setLayers] = useState(INIT_LAYERS);
  const [skinOpacity, setSkinOpacity] = useState(0.22);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("vorne");
  const [viewTick, setViewTick] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [center, setCenter] = useState("3d");
  const [right, setRight] = useState("details");
  const [pmQuery, setPmQuery] = useState("");
  const [missingTeeth, setMissingTeeth] = useState(["13"]);

  useEffect(() => {
    api.get("/entries").then((r) => setEntries(r.data)).catch((e) => toast.error(errText(e)));
  }, []);

  const byCode = useMemo(() => Object.fromEntries(entries.map((e) => [e.code, e])), [entries]);
  const entry = selected ? byCode[selected] : null;
  const related = entry?.related || [];
  const counts = useMemo(() => entries.reduce((a, e) => ({ ...a, [e.layer]: (a[e.layer] || 0) + 1 }), {}), [entries]);

  const select = (code) => {
    setSelected(code);
    if (!code) return;
    setRight("details");
    const e = byCode[code];
    if (e && !layers[e.layer]) setLayers((l) => ({ ...l, [e.layer]: true }));
  };
  const changeView = (v) => { setView(v); setViewTick((t) => t + 1); };
  const replace = (upd) => setEntries((list) => list.map((e) => (e.code === upd.code ? upd : e)));
  const removeStudy = async (idx) => {
    try { replace((await api.delete(`/entries/${entry.code}/studies/${idx}`)).data); toast.success("Studie entfernt"); }
    catch (e) { toast.error(errText(e)); }
  };
  const showChain = () => {
    setLayers((l) => ({ ...l, ketten: true, muskeln: true }));
    setCenter("3d");
    select("kette-zahn13-becken");
    changeView("seite");
  };

  return (
    <div className="flex h-screen flex-col bg-[#FCFCFA]">
      <header className="flex items-center justify-between border-b border-[#E5E5E0] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2A3B47]"><Activity className="h-5 w-5 text-[#E3DCCD]" /></div>
          <div>
            <h1 className="font-display text-lg font-extrabold leading-none tracking-tight">NervenPfad</h1>
            <span className="text-[11px] text-[#9BA8B2]">Interaktiver Atlas · Nerven, Druckpunkte & Zähne mit Evidenz</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-[#9BA8B2] md:block" data-testid="header-stats">{entries.length} Einträge · {entries.reduce((a, e) => a + (e.studies?.length || 0), 0)} Studien</span>
          <Link to="/admin" data-testid="admin-link" className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E0] px-4 py-1.5 text-xs font-semibold transition-colors hover:border-[#2A3B47]">
            {isAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-[#839E8C]" /> : <LogIn className="h-3.5 w-3.5" />} {isAdmin ? "Admin" : "Admin-Login"}
          </Link>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-12">
        <aside className="thin-scroll min-h-0 space-y-8 overflow-y-auto rounded-xl border border-[#E5E5E0] bg-white p-4 lg:col-span-3">
          <LayerControls layers={layers} setLayers={setLayers} skinOpacity={skinOpacity} setSkinOpacity={setSkinOpacity} counts={counts}
            view={view} setView={changeView} autoRotate={autoRotate} setAutoRotate={setAutoRotate} />
          <EntryList entries={entries} selected={selected} onSelect={select} />
        </aside>

        <section className="grain relative min-h-[480px] overflow-hidden rounded-xl border border-[#E5E5E0] bg-[#F4F2EC] lg:col-span-6">
          <div className="absolute left-4 top-4 z-10 flex gap-1 rounded-full border border-[#E5E5E0] bg-white/90 p-1 shadow-sm">
            {[["3d", "3D-Körper"], ["zaehne", "Gebiss-Schema"]].map(([k, l]) => (
              <button key={k} data-testid={`center-tab-${k}`} onClick={() => setCenter(k)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${center === k ? "bg-[#2A3B47] text-white" : "text-[#5C6B75] hover:text-[#1A2025]"}`}>{l}</button>
            ))}
          </div>
          {center === "3d" ? (
            <>
              <BodyScene entries={entries} layers={layers} skinOpacity={skinOpacity} selected={selected} related={related} onSelect={select}
                view={view} viewTick={viewTick} missingTeeth={missingTeeth} autoRotate={autoRotate} />
              <div className="pointer-events-none absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.2em] text-[#9BA8B2]">Ziehen = drehen · Scrollen = zoomen · Rechtsklick = verschieben</div>
            </>
          ) : (
            <div className="relative h-full bg-[#FCFCFA] pt-12">
              <DentalChart selectedFdi={entry?.fdi} missingTeeth={missingTeeth} setMissingTeeth={setMissingTeeth} onSelectTooth={(f) => select(`zahn-${f}`)} onShowChain={showChain} />
            </div>
          )}
        </section>

        <aside className="thin-scroll min-h-0 overflow-y-auto rounded-xl border border-[#E5E5E0] bg-white p-5 lg:col-span-3">
          <Tabs value={right} onValueChange={setRight}>
            <TabsList className="mb-5 grid w-full grid-cols-2">
              <TabsTrigger value="details" data-testid="right-tab-details">Details</TabsTrigger>
              <TabsTrigger value="pubmed" data-testid="right-tab-pubmed">PubMed live</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <DetailPanel entry={entry} all={entries} onSelect={select} isAdmin={isAdmin} onRemoveStudy={removeStudy}
                missing={entry?.fdi && missingTeeth.includes(entry.fdi)} onPubmed={(q) => { setPmQuery(q); setRight("pubmed"); }} />
            </TabsContent>
            <TabsContent value="pubmed">
              <PubMedPanel initialQuery={pmQuery} entry={entry} isAdmin={isAdmin} onAdded={replace} />
            </TabsContent>
          </Tabs>
        </aside>
      </main>
      <footer className="px-6 pb-3 text-[10px] text-[#9BA8B2]">Lern- und Recherchewerkzeug, kein Ersatz für ärztliche oder zahnärztliche Diagnose. Traditionelle Zuordnungen (TCM, Ayurveda, Reflexzonen, Voll-Schema) sind als solche gekennzeichnet.</footer>
    </div>
  );
}
