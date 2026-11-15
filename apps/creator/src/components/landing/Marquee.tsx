const ITEMS = [
  "PLAN MODE",
  "IMPLEMENT MODE",
  "TOKEN LEDGER",
  "HIGGSFIELD",
  "KENARI AI",
  "CLOUDFLARE R2",
  "HOLD & REFUND",
  "DRIVE WORKSPACE",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-b border-white/10 bg-ink py-2.5 text-canvas">
      <div className="marquee-track items-center gap-8">
        {row.map((item, index) => (
          <span key={`${item}-${index}`} className="flex shrink-0 items-center gap-8">
            <span className="mono-label text-[10px] text-canvas/70">{item}</span>
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
