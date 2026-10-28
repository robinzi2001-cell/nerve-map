import { Fragment } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Hand, Link2, FlaskConical } from "lucide-react";
import { EvidenceBadge, TraditionBadge } from "@/components/EvidenceBadge";
import { StudyList } from "@/components/StudyList";
import { LAYERS } from "@/lib/api";

const Section = ({ title, children }) => (
  <div className="space-y-2">
    <span className="label-caps">{title}</span>
    {children}
  </div>
);

const Chips = ({ items, tone }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((s) => (
      <span key={s} className={`rounded-full px-2.5 py-0.5 text-[11px] ${tone}`}>{s}</span>
    ))}
  </div>
);

export const DetailPanel = ({ entry, all, onSelect, isAdmin, onRemoveStudy, onPubmed, missing }) => {
  if (!entry)
    return (
      <div data-testid="detail-empty" className="flex h-full flex-col justify-center gap-3 px-2 text-[#5C6B75]">
        <span className="label-caps">Detailansicht</span>
        <p className="font-display text-2xl font-light leading-tight text-[#1A2025]">Klicke auf einen Nerv, Druckpunkt, Meridian oder Zahn.</p>
        <p className="text-sm leading-relaxed">Jede Aussage ist mit einer Evidenz-Stufe markiert – von gut belegter Neuroanatomie bis zu traditionellen Lehren (TCM, Ayurveda, Reflexzonen).</p>
      </div>
    );
  const byCode = Object.fromEntries(all.map((e) => [e.code, e]));
  return (
    <div className="fade-up space-y-6" key={entry.code} data-testid="detail-panel">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-[#9BA8B2]">
          <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: entry.color }} />
          {LAYERS.find((l) => l.key === entry.layer)?.label} · <span className="font-mono">{entry.latin}</span>
        </div>
        <h2 data-testid="detail-title" className="font-display text-2xl font-bold leading-tight tracking-tight">{entry.name}</h2>
        <div className="flex flex-wrap gap-1.5">
          <EvidenceBadge level={entry.evidence} testid="detail-evidence-badge" />
          <TraditionBadge tradition={entry.tradition} />
          {missing && <span data-testid="detail-missing-badge" className="rounded-md bg-[#C8483B] px-2 py-0.5 text-[11px] font-semibold text-white">Als nicht angelegt markiert</span>}
        </div>
        <p className="text-sm leading-relaxed text-[#3A4852]">{entry.description}</p>
      </div>

      {entry.claims?.length > 0 && (
        <Section title="Aussagen & Evidenz">
          <div className="space-y-2">
            {entry.claims.map((c, i) => (
              <div key={i} data-testid={`claim-${i}`} className="rounded-lg border-l-[3px] bg-[#FCFCFA] p-3" style={{ borderColor: { gut: "#3E8E4A", maessig: "#D9822B", schwach: "#C8483B", traditionell: "#7A5A47" }[c.evidence] }}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{c.label}</span>
                  <EvidenceBadge level={c.evidence} testid={`claim-evidence-${i}`} />
                </div>
                <p className="text-[12.5px] leading-relaxed text-[#3A4852]">{c.text}</p>
                {c.tradition !== "Schulmedizin" && <div className="mt-1 text-[10px] text-[#9BA8B2]">Quelle der Lehre: {c.tradition}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {entry.agenesis && (
        <Section title="Wenn der Zahn nicht angelegt ist">
          <p data-testid="agenesis-text" className="rounded-lg bg-[#D96C50]/10 p-3 text-[12.5px] leading-relaxed">{entry.agenesis}</p>
        </Section>
      )}

      {entry.tcm && (
        <Section title="Zahn-Organ-Schema (traditionell)">
          <div className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-[#E5E5E0] p-3 text-[12px]" data-testid="tcm-table">
            {Object.entries(entry.tcm).map(([k, v]) => (<Fragment key={k}><span className="capitalize text-[#9BA8B2]">{k}</span><span>{v}</span></Fragment>))}
          </div>
        </Section>
      )}

      {entry.symptoms?.length > 0 && <Section title="Symptome"><Chips items={entry.symptoms} tone="bg-[#F0F0ED] text-[#2A3B47]" /></Section>}
      {entry.conditions?.length > 0 && <Section title="Korrelierende Beschwerden"><Chips items={entry.conditions} tone="bg-[#839E8C]/15 text-[#4F6B58]" /></Section>}

      {entry.technique && (
        <Section title="Für Masseure & Physios">
          <div className="flex gap-2.5 rounded-lg bg-[#2A3B47] p-3 text-[12.5px] leading-relaxed text-white" data-testid="technique-box">
            <Hand className="mt-0.5 h-4 w-4 shrink-0 text-[#E3DCCD]" /> {entry.technique}
          </div>
        </Section>
      )}
      {entry.contraindications && (
        <div className="flex gap-2.5 rounded-lg border border-[#C8483B]/30 bg-[#C8483B]/5 p-3 text-[12px] text-[#8A2E24]" data-testid="contraindication-box">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span><b>Vorsicht:</b> {entry.contraindications}</span>
        </div>
      )}

      {entry.layer === "nerven" && (
        <Link to={entry.code === "n-vagus" ? "/labor?tab=hrv" : "/labor?tab=neuron"} data-testid="open-lab-btn"
          className="flex items-center justify-between rounded-lg border border-[#2F6FB0]/30 bg-[#2F6FB0]/5 p-3 text-[12.5px] font-medium text-[#2F6FB0] transition-colors hover:bg-[#2F6FB0]/10">
          {entry.code === "n-vagus" ? "Vagustonus vorher/nachher messen (HRV)" : "Leitung & Heilung simulieren (NEURON)"} <FlaskConical className="h-4 w-4" />
        </Link>
      )}

      {entry.related?.length > 0 && (
        <Section title="Verknüpft mit">
          <div className="flex flex-wrap gap-1.5">
            {entry.related.filter((c) => byCode[c]).map((c) => (
              <button key={c} data-testid={`related-${c}`} onClick={() => onSelect(c)} className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E0] bg-white px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-[#D96C50] hover:text-[#D96C50]">
                <Link2 className="h-3 w-3" /> {byCode[c].name}
              </button>
            ))}
          </div>
        </Section>
      )}

      <StudyList studies={entry.studies || []} isAdmin={isAdmin} onRemove={onRemoveStudy} onSearch={() => onPubmed(entry.pubmed_query || entry.latin)} />
    </div>
  );
};
