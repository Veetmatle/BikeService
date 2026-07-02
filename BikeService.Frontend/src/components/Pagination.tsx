interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Paginacja">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Poprzednia strona"
        className="flex items-center gap-1 px-3 h-8 rounded-md text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          color: 'var(--text-2)',
          background: 'transparent',
          border: '1px solid var(--border-muted)',
        }}
        onMouseEnter={e => {
          if (page > 1) {
            (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-muted)';
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.275.326.75.75 0 0 1-.215.734L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
        </svg>
        Poprzednia
      </button>

      <div className="flex items-center gap-1 mx-1">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1.5 text-[13px]" style={{ color: 'var(--text-subtle)' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className="min-w-[32px] h-8 px-2 flex items-center justify-center rounded-md text-[13px] transition-colors"
              style={
                p === page
                  ? {
                      background: 'var(--accent)',
                      color: '#fff',
                      fontWeight: 600,
                      border: '1px solid var(--accent)',
                    }
                  : {
                      color: 'var(--text-2)',
                      border: '1px solid transparent',
                    }
              }
              onMouseEnter={e => {
                if (p !== page) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-muted)';
                }
              }}
              onMouseLeave={e => {
                if (p !== page) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                }
              }}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Następna strona"
        className="flex items-center gap-1 px-3 h-8 rounded-md text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          color: 'var(--text-2)',
          background: 'transparent',
          border: '1px solid var(--border-muted)',
        }}
        onMouseEnter={e => {
          if (page < totalPages) {
            (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-muted)';
        }}
      >
        Następna
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.275-.326.75.75 0 0 1 .215-.734L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </nav>
  );
}
