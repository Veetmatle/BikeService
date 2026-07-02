import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import type { OrderTrackingResponse } from '../types';

const fmt      = (d?: string) => (d ? new Date(d).toLocaleDateString('pl-PL') : '—');
const fmtPrice = (p?: number) => (p != null ? `${p.toFixed(2)} zł` : null);

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-muted)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{value}</p>
    </div>
  );
}

export default function OrderTrack() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder]       = useState<OrderTrackingResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get<OrderTrackingResponse>(`/orders/track/${token}`)
      .then((r) => setOrder(r.data))
      .catch((e) => { if (e.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [token]);

  const bikeLabel = order
    ? [order.bikeBrand, order.bikeModel].filter(Boolean).join(' ') || '—'
    : '—';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: 'radial-gradient(circle at 20% 0%, rgba(31,111,235,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 100%, rgba(163,113,247,0.08) 0%, transparent 50%), var(--bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 500 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(240,246,252,0.1), 0 6px 20px rgba(31,111,235,0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5.5" cy="17.5" r="3.5" />
                <circle cx="18.5" cy="17.5" r="3.5" />
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
              </svg>
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>
            BikeService
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Status Twojego zlecenia
          </p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow-lg)', padding: '28px 28px 24px' }}>
          {loading && <div className="loading-state">Ładowanie...</div>}

          {notFound && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Zlecenie nie zostało znalezione
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Sprawdź poprawność linku śledzenia.
              </p>
            </div>
          )}

          {order && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-muted)' }}>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {bikeLabel}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Twoje zlecenie</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div>
                {order.description && (
                  <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-muted)' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)', marginBottom: 6 }}>
                      Opis
                    </p>
                    <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.65, color: 'var(--text-2)' }}>
                      {order.description}
                    </p>
                  </div>
                )}

                <InfoRow label="Data przyjęcia"   value={fmt(order.createdAt)} />
                <InfoRow label="Planowany odbiór" value={fmt(order.estimatedPickupDate)} />

                {(fmtPrice(order.estimatedPrice) || fmtPrice(order.finalPrice)) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border-muted)' }}>
                    {fmtPrice(order.estimatedPrice) && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)', marginBottom: 4 }}>
                          Cena szacunkowa
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{fmtPrice(order.estimatedPrice)}</p>
                      </div>
                    )}
                    {fmtPrice(order.finalPrice) && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)', marginBottom: 4 }}>
                          Cena końcowa
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{fmtPrice(order.finalPrice)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ padding: '14px 0', borderBottom: order.photos.length > 0 ? '1px solid var(--border-muted)' : 'none' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)', marginBottom: 4 }}>
                    Ostatnia aktualizacja
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{fmt(order.updatedAt)}</p>
                </div>

                {order.photos.length > 0 && (
                  <div style={{ paddingTop: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)', marginBottom: 12 }}>
                      Zdjęcia
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {order.photos.map(photo => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: '1px solid var(--border-muted)',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          <img
                            src={photo.url}
                            alt={photo.fileName}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
