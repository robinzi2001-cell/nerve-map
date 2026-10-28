import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { api, errText } from "@/lib/api";

export const PubMedPanel = ({ initialQuery, entry, isAdmin, onAdded }) => {
  const [q, setQ] = useState(initialQuery || "");
  const [res, setRes] = useState([]);
  const [loading, setLoading] = useState(false);

  const run = async (query = q) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get("/pubmed/search", { params: { q: query, limit: 12 } });
      setRes(data);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) { setQ(initialQuery); run(initialQuery); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const add = async (s) => {
    try {
      const { data } = await api.post(`/entries/${entry.code}/studies`, s);
      toast.success("Studie verknüpft");
      onAdded(data);
    } catch (e) {
      toast.error(errText(e));
    }
  };

  return (
    <div className="space-y-4" data-testid="pubmed-panel">
      <div>
        <span className="label-caps">Live-Suche · PubMed (NCBI)</span>
        <p className="mt-1 text-[11px] text-[#9BA8B2]">Englische Suchbegriffe liefern die besten Treffer.</p>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <Input data-testid="search-pubmed-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="z. B. canine agenesis posture" className="bg-white" />
        <Button data-testid="search-pubmed-btn" type="submit" className="rounded-full bg-[#2A3B47] hover:bg-[#1A2025]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>
      {isAdmin && entry && <p className="text-[11px] text-[#5C6B75]">Treffer können mit <b>+</b> an „{entry.name}“ angehängt werden.</p>}
      <div className="space-y-2">
        {res.map((s) => (
          <div key={s.pmid} data-testid={`pubmed-result-${s.pmid}`} className="rounded-lg border border-[#E5E5E0] bg-white p-3">
            <div className="flex items-start gap-2">
              <a href={s.url} target="_blank" rel="noreferrer" className="flex-1 text-[13px] font-medium leading-snug hover:text-[#D96C50]">{s.title} <ExternalLink className="inline h-3 w-3" /></a>
              {isAdmin && entry && (
                <button data-testid={`pubmed-add-${s.pmid}`} onClick={() => add(s)} className="rounded-full bg-[#D96C50] p-1 text-white transition-transform hover:scale-110"><Plus className="h-3.5 w-3.5" /></button>
              )}
            </div>
            <div className="mt-1 text-[11px] text-[#5C6B75]">{[s.authors, s.journal, s.year].filter(Boolean).join(" · ")}</div>
            <div className="mt-1 font-mono text-[10px] text-[#9BA8B2]">PMID {s.pmid} {s.pubtype && `· ${s.pubtype}`}</div>
          </div>
        ))}
        {!loading && res.length === 0 && <p className="text-xs text-[#9BA8B2]" data-testid="pubmed-empty">Noch keine Ergebnisse.</p>}
      </div>
    </div>
  );
};
