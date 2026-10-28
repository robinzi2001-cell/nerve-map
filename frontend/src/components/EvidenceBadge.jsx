import { EVIDENCE, tradColor } from "@/lib/api";

export const EvidenceBadge = ({ level, testid }) => {
  const e = EVIDENCE[level] || EVIDENCE.schwach;
  return (
    <span data-testid={testid || `evidence-badge-${level}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: e.color }}>
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {e.label}
    </span>
  );
};

export const TraditionBadge = ({ tradition }) => (
  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium" style={{ color: tradColor(tradition), borderColor: tradColor(tradition) + "55" }}>
    {tradition}
  </span>
);
