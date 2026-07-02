import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Notification } from '../types';

const fmt = (d: string) => new Date(d).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    api.get<Notification[]>('/notifications')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    window.dispatchEvent(new Event('notif-updated'));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    window.dispatchEvent(new Event('notif-updated'));
  };

  const openOrder = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    navigate(`/orders/${n.orderId}`);
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Powiadomienia</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : 'Wszystkie przeczytane'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary">
            Oznacz wszystkie jako przeczytane
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Ładowanie powiadomień...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Brak powiadomień</p>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 6 }}>
            Pojawią się tutaj, gdy ktoś otaguje Cię w zleceniu serwisowym.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(n => (
            <button
              key={n.id}
              onClick={() => openOrder(n)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 18px',
                borderRadius: 10,
                border: `1px solid ${n.isRead ? 'var(--border-muted)' : 'rgba(31,111,235,0.3)'}`,
                background: n.isRead ? 'var(--surface)' : 'rgba(31,111,235,0.06)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.12s',
                width: '100%',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'var(--surface)' : 'rgba(31,111,235,0.06)')}
            >
              <span
                style={{
                  marginTop: 4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: n.isRead ? 'transparent' : '#1f6feb',
                  border: n.isRead ? '1.5px solid var(--border)' : 'none',
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: n.isRead ? 400 : 600, marginBottom: 4 }}>
                  <span style={{ color: 'var(--accent-fg)' }}>@{n.taggedBy}</span>
                  {' '}otagował(-a) Cię w zleceniu — {n.clientName}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{fmt(n.createdAt)}</p>
              </div>

              <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
                Otwórz →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
