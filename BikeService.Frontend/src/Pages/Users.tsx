import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { UserResponse } from '../types';

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className="badge"
      style={isAdmin
        ? { color: '#79c0ff', background: 'rgba(56,139,253,0.15)', borderColor: 'rgba(56,139,253,0.4)' }
        : { color: 'var(--text-2)', background: 'var(--surface-2)', borderColor: 'var(--border)' }
      }
    >
      {isAdmin ? 'Administrator' : 'Mechanik'}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className="badge"
      style={active
        ? { color: '#56d364', background: 'rgba(63,185,80,0.15)', borderColor: 'rgba(63,185,80,0.4)' }
        : { color: 'var(--text-muted)', background: 'var(--surface-2)', borderColor: 'var(--border)' }
      }
    >
      <span
        className="badge-dot"
        style={{ background: active ? '#3fb950' : '#6e7681' }}
      />
      {active ? 'Aktywny' : 'Nieaktywny'}
    </span>
  );
}

export default function Users() {
  const [users, setUsers]     = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = () => {
    api.get<UserResponse[]>('/users')
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (user: UserResponse) => {
    if (!confirm(`Usunąć użytkownika "${user.username}"?`)) return;
    await api.delete(`/users/${user.id}`);
    fetchUsers();
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Użytkownicy</h1>
          <p className="page-subtitle">
            {users.length > 0 ? `${users.length} ${users.length === 1 ? 'użytkownik' : 'użytkowników'}` : 'Brak użytkowników'}
          </p>
        </div>
        <button onClick={() => navigate('/users/new')} className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
          Nowy użytkownik
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Rola</th>
              <th>Status</th>
              <th style={{ width: 140, textAlign: 'right' }}>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table-empty">Ładowanie...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="table-empty">Brak użytkowników</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="primary">{u.username}</td>
                  <td className="muted">{u.email}</td>
                  <td className="muted">{u.phoneNumber ?? '—'}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><ActiveBadge active={u.isActive} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        onClick={() => navigate(`/users/${u.id}`)}
                        style={{
                          fontSize: 13,
                          padding: '5px 12px',
                          borderRadius: 7,
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-2)',
                          background: 'transparent',
                          transition: 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
                        }}
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        style={{
                          fontSize: 13,
                          padding: '5px 12px',
                          borderRadius: 7,
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          background: 'transparent',
                          transition: 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--danger-fg)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                        }}
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
