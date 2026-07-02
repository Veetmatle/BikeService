import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ADMIN = 'ADMIN';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

const iconStyle = { width: 16, height: 16 } as const;

const DashboardIcon = (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="currentColor">
    <path d="M1.75 2.5h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 1 7.75v-4.5a.75.75 0 0 1 .75-.75Zm8 0h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 7.75v-4.5a.75.75 0 0 1 .75-.75Zm-8 6h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 1 13.75v-4.5a.75.75 0 0 1 .75-.75Zm8 0h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 13.75v-4.5a.75.75 0 0 1 .75-.75Z" />
  </svg>
);

const OrdersIcon = (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2.75A.75.75 0 0 1 2.75 2h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 2.75Zm0 5A.75.75 0 0 1 2.75 7h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 7.75ZM2.75 12h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5Z" />
  </svg>
);

const BellIcon = (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.519 1.519 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947V5Z" />
  </svg>
);

const UsersIcon = (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM2 6a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.55 3.49 3.49 0 0 1 2 6Zm8.5-1c0-.278-.034-.55-.097-.807a2.5 2.5 0 1 1 1.434 4.62.75.75 0 0 1-.715-1.319A1 1 0 0 0 12 6.5a.75.75 0 0 1 0-1.5 1 1 0 0 0 0-2 .75.75 0 0 1-.5-1.317A2.49 2.49 0 0 1 13 1.5a2.5 2.5 0 0 1 2.5 2.5c0 .278-.034.55-.097.807a3.5 3.5 0 0 1-1.18 6.184.75.75 0 0 1-.222-1.483A2 2 0 0 0 13 7.5a.75.75 0 0 1 0-1.5 1 1 0 0 0 0-2c-.278 0-.55.034-.807.097A.75.75 0 0 1 10.5 5Z" />
  </svg>
);

const ProfileIcon = (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="currentColor">
    <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
  </svg>
);

const LogoutIcon = (
  <svg style={iconStyle} viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 4.5-1.97-1.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.97-1.97H6.75a.75.75 0 0 1 0-1.5Z" />
  </svg>
);

function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : parts[0].slice(0, 2);
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
        color: '#fff',
        letterSpacing: '0.04em',
      }}
    >
      {letters.toUpperCase()}
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      api.get<{ count: number }>('/notifications/unread-count')
        .then(r => setUnreadCount(r.data.count))
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 30_000);
    window.addEventListener('notif-updated', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notif-updated', refresh);
    };
  }, []);

  const navItems: NavItem[] = [
    { to: '/',               label: 'Dashboard',      icon: DashboardIcon },
    { to: '/orders',         label: 'Zlecenia',       icon: OrdersIcon },
    { to: '/notifications',  label: 'Powiadomienia',  icon: BellIcon, badge: unreadCount },
    { to: '/users',          label: 'Użytkownicy',    icon: UsersIcon, adminOnly: true },
    { to: '/profile',        label: 'Profil',         icon: ProfileIcon },
  ];

  const visible = navItems.filter(item => !item.adminOnly || user?.role === ADMIN);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: 248,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border-muted)',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '22px 20px', borderBottom: '1px solid var(--border-muted)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(240,246,252,0.1)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="18.5" cy="17.5" r="3.5" />
              <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>BikeService</p>
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>Panel serwisowy</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 8,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'background 0.12s ease, color 0.12s ease',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              background: isActive ? 'var(--surface-2)' : 'transparent',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: '0 3px 3px 0',
                      background: 'var(--accent-fg)',
                    }}
                  />
                )}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: isActive ? 'var(--accent-fg)' : 'var(--text-subtle)',
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ fontWeight: isActive ? 600 : 400, flex: 1 }}>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f85149',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '10px 10px 12px', borderTop: '1px solid var(--border-muted)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 4 }}>
          {user && <Avatar name={user.username} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>
              {user?.role === ADMIN ? 'Administrator' : 'Mechanik'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.12s ease, background 0.12s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--danger-fg)';
            (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {LogoutIcon}
          </span>
          Wyloguj się
        </button>
      </div>
    </aside>
  );
}
