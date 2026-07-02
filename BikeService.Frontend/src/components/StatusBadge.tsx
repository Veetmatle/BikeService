const CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  InProgress:     { label: 'Realizacja',  color: '#e3b341', bg: 'rgba(210,153,34,0.15)',  border: 'rgba(210,153,34,0.4)',  dot: '#d29922' },
  ReadyForPickup: { label: 'Do odbioru',  color: '#7ee787', bg: 'rgba(86,211,100,0.15)',  border: 'rgba(86,211,100,0.4)',  dot: '#56d364' },
  PickedUp:       { label: 'Odebrane',    color: '#c0bfd9', bg: 'rgba(163,113,247,0.15)', border: 'rgba(163,113,247,0.4)', dot: '#a371f7' },
  Cancelled:      { label: 'Anulowane',   color: '#ffa198', bg: 'rgba(248,81,73,0.15)',   border: 'rgba(248,81,73,0.4)',   dot: '#f85149' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status] ?? { label: status, color: 'var(--text-muted)', bg: 'var(--surface-2)', border: 'var(--border)', dot: 'var(--text-subtle)' };
  return (
    <span
      className="badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <span className="badge-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}
