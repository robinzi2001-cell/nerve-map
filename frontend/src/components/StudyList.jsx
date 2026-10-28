import { Trash2, ExternalLink, BookOpen } from "lucide-react";

export const StudyList = ({ studies, isAdmin, onRemove, onSearch }) => (
  <div data-testid="study-list">
    <div className="mb-2 flex items-center justify-between">
      <span className="label-caps flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Studien & Quellen ({studies.length})</span>
      <button data-testid="search-pubmed-for-entry-btn" onClick={onSearch} className="text-[11px] font-semibold text-[#D96C50] hover:underline">Mehr in PubMed →</button>
    </div>
    {studies.length === 0 && <p className="text-xs text-[#9BA8B2]">Noch keine Studien verknüpft.</p>}
    <div className="space-y-2">
      {studies.map((s, i) => (
        <div key={i} data-testid={`study-item-${i}`} className="group rounded-lg border border-[#E5E5E0] bg-[#FCFCFA] p-3 transition-colors hover:border-[#D96C50]/50">
          <div className="flex items-start gap-2">
            <a href={s.url || undefined} target="_blank" rel="noreferrer" className="flex-1 text-[13px] font-medium leading-snug hover:text-[#D96C50]">
              {s.title} {s.url && <ExternalLink className="ml-0.5 inline h-3 w-3" />}
            </a>
            {isAdmin && (
              <button data-testid={`remove-study-${i}`} onClick={() => onRemove(i)} className="text-[#9BA8B2] hover:text-[#C8483B]"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#5C6B75]">{[s.authors, s.journal, s.year].filter(Boolean).join(" · ")}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded bg-[#E3DCCD] px-1.5 py-0.5 font-medium">{s.source}</span>
            {s.pmid && <span className="rounded bg-[#F0F0ED] px-1.5 py-0.5 font-mono">PMID {s.pmid}</span>}
            {s.pubtype && /Review|Meta|Randomized/i.test(s.pubtype) && <span className="rounded bg-[#839E8C]/20 px-1.5 py-0.5 text-[#4F6B58]">{s.pubtype.split(", ").filter((x) => /Review|Meta|Randomized/i.test(x)).join(", ")}</span>}
          </div>
        </div>
      ))}
    </div>
  </div>
);
