import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookMarked } from "lucide-react";

const USED = [
  ["BodyParts3D / Anatomography 4.3", "DBCLS · CC BY-SA 2.1 JP", "Detaillierte 3D-Meshes: Haut, 304 Knochen, 323 Muskeln, 248 Nerven, 89 Gehirnstrukturen, 28 Zähne (vereinfacht/dezimiert)."],
  ["olivercase/body_parts_3d_api", "Downloader & Manifest", "Bezug der Original-Meshes nach Kategorien (Knochen, Muskeln, Nerven, Gehirn)."],
  ["NEURON (neuronsimulator/nrn)", "BSD-3", "Simulation der Nervenleitung: gesund, Neuropraxie, Remyelinisierung, Regeneration."],
  ["NeuroKit2 (neuropsychology/NeuroKit)", "MIT", "HRV-Analyse (RMSSD, HF) als Marker des Vagustonus aus eigenen EKG-/RR-/PPG-Daten."],
  ["brain-stl (codingfisch/brain-stl)", "MIT", "Nicht im Server: Du erzeugst damit aus eigenem MRT ein STL und lädst es hier in den Schädel."],
  ["NCBI PubMed E-utilities", "Öffentlich", "Live-Studiensuche."],
];
const SKIPPED = [
  ["hnn-core", "Simuliert kortikale EEG/MEG-Signale – für periphere Nerven, Druckpunkte und Zähne ohne Nutzen."],
  ["threeBrain", "R-Paket für Elektroden in Gehirn-MRTs (Epilepsie-Chirurgie) – kein Bezug zu Nervenbahnen im Körper."],
];

export const SourcesDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button data-testid="sources-btn" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#5C6B75] hover:text-[#1A2025]"><BookMarked className="h-3.5 w-3.5" /> Quellen</button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl" data-testid="sources-dialog">
      <DialogHeader><DialogTitle className="font-display">Verwendete Projekte & Lizenzen</DialogTitle></DialogHeader>
      <div className="space-y-3">
        {USED.map(([n, l, d]) => (
          <div key={n} className="rounded-lg border border-[#E5E5E0] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{n}</b><span className="font-mono text-[10px] text-[#9BA8B2]">{l}</span></div>
            <p className="mt-1 text-xs text-[#5C6B75]">{d}</p>
          </div>
        ))}
        <span className="label-caps">Bewusst weggelassen</span>
        {SKIPPED.map(([n, d]) => <p key={n} className="text-xs text-[#5C6B75]"><b>{n}:</b> {d}</p>)}
      </div>
    </DialogContent>
  </Dialog>
);
