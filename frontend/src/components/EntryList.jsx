import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { EVIDENCE, LAYERS } from "@/lib/api";

const QUICK = ["Zahnschmerz", "Kopfschmerz", "Ischias", "CMD", "Übelkeit", "Becken", "Nacken", "Kribbeln"];

export const EntryList = ({ entries, selected, onSelect }) => {
  const [q, setQ] = useState("");
  const [ev, setEv] = useState(null);
  const ql = q.toLowerCase();
  const list = entries.filter((e) => {
    if (ev && e.evidence !== ev) return false;
    if (!ql) return true;
    return [e.name, e.latin, e.description, ...(e.symptoms || []), ...(e.conditions || [])].join(" ").toLowerCase().includes(ql);
  });
  const layerLabel = (k) => LAYERS.find((l) => l.key === k)?.label;

  return (
    <div className="space-y-3">
      <span className="label-caps">Symptom / Struktur suchen</span>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9BA8B2]" />
        <Input data-testid="symptom-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="z. B. Zahnschmerz, Ischias…" className="pl-9 bg-white" />
      </div>
      <div className="flex flex-wrap gap-1">
        {QUICK.map((s) => (
          <button key={s} data-testid={`quick-symptom-${s}`} onClick={() => setQ(s === q ? "" : s)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors ${q === s ? "bg-[#D96C50] text-white" : "bg-[#F0F0ED] text-[#5C6B75] hover:bg-[#E3DCCD]"}`}>{s}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {Object.entries(EVIDENCE).map(([k, v]) => (
          <button key={k} data-testid={`evidence-filter-${k}`} onClick={() => setEv(ev === k ? null : k)}
            className="rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors"
            style={ev === k ? { background: v.color, color: "#fff", borderColor: v.color } : { color: v.color, borderColor: v.color + "66" }}>{v.label}</button>
        ))}
      </div>
      <div className="text-[11px] text-[#9BA8B2]" data-testid="entry-list-count">{list.length} Treffer</div>
      <div className="space-y-0.5">
        {list.map((e) => (
          <button key={e.code} data-testid={`entry-item-${e.code}`} onClick={() => onSelect(e.code)}
            className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${selected === e.code ? "bg-[#2A3B47] text-white" : "hover:bg-[#F0F0ED]"}`}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" style={{ background: e.color }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{e.name}</span>
              <span className={`block text-[10px] ${selected === e.code ? "text-white/60" : "text-[#9BA8B2]"}`}>{layerLabel(e.layer)} · {e.tradition}</span>
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EVIDENCE[e.evidence]?.color }} />
          </button>
        ))}
      </div>
    </div>
  );
};
