import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import type { ServiceOrderSummary, PagedResult } from '../types';

const STAT_CARDS = [
  { status: 'InProgress',     label: 'Realizacja', accent: '#d29922', soft: 'rgba(210,153,34,0.12)' },
  { status: 'ReadyForPickup', label: 'Do odbioru', accent: '#56d364', soft: 'rgba(86,211,100,0.12)' },
  { status: 'PickedUp',       label: 'Odebrane',   accent: '#a371f7', soft: 'rgba(163,113,247,0.12)' },
];

const fmt = (d: string) => new Date(d).toLocaleDateString('pl-PL');

export default function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<ServiceOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      Promise.all(
        STAT_CARDS.map(({ status }) =>
          api
            .get<PagedResult<ServiceOrderSummary>>(`/orders?status=${status}&page=1&pageSize=1`)
            .then((r) => ({ status, count: r.data.totalCount }))
        )
      ),
      api.get<PagedResult<ServiceOrderSummary>>('/orders?page=1&pageSize=20'),
    ])
      .then(([countResults, recentResult]) => {
        const map: Record<string, number> = {};
        countResults.forEach(({ status, count }) => { map[status] = count; });
        setCounts(map);

        const filtered = recentResult.data.items
          .filter(o => o.status !== 'Cancelled')
          .slice(0, 5);
        setRecent(filtered);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalActive = (counts['InProgress'] ?? 0) + (counts['ReadyForPickup'] ?? 0);

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="loading-state">Ładowanie panelu...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {totalActive > 0
              ? `${totalActive} ${totalActive === 1 ? 'aktywne zlecenie' : 'aktywnych zleceń'} w serwisie`
              : 'Brak aktywnych zleceń'}
          </p>
        </div>
        <button onClick={() => navigate('/orders/new')} className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
          Nowe zlecenie
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {STAT_CARDS.map(({ status, label, accent, soft }) => (
          <button
            key={status}
            onClick={() => navigate(`/orders?status=${status}`)}
            className="card card-hover"
            style={{
              background: 'var(--surface)',
              padding: '20px 22px',
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid var(--border-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: soft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, display: 'block' }} />
              </span>
            </div>
            <p style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              {counts[status] ?? 0}
            </p>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="card-header-title">Ostatnie zlecenia</p>
            <p className="card-header-desc">Pięć najnowszych aktywnych zgłoszeń</p>
          </div>
          <button onClick={() => navigate('/orders')} className="btn-link">
            Zobacz wszystkie
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.275-.326.75.75 0 0 1 .215-.734L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>#</th>
              <th>Klient</th>
              <th>Rower</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Przyjęte</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">Brak aktywnych zleceń</td>
              </tr>
            ) : (
              recent.map((order) => (
                <tr
                  key={order.id}
                  className="clickable"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="muted">#{order.id}</td>
                  <td className="primary">{order.clientFirstName} {order.clientLastName}</td>
                  <td>{[order.bikeBrand, order.bikeModel].filter(Boolean).join(' ') || '—'}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td style={{ textAlign: 'right' }} className="muted">{fmt(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
