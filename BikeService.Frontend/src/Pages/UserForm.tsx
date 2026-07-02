import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import type { UserResponse } from '../types';

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [role, setRole]         = useState('MECHANIC');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!isEdit) return;
    api.get<UserResponse>(`/users/${id}`)
      .then((r) => {
        setUsername(r.data.username);
        setEmail(r.data.email);
        setPhone(r.data.phoneNumber ?? '');
        setRole(r.data.role);
        setIsActive(r.data.isActive);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/users/${id}`, {
          username, email,
          phoneNumber: phone.trim() || null,
          role, isActive,
        });
        setSuccess('Zapisano zmiany.');
      } else {
        await api.post('/users', {
          username, email, password,
          ...(phone.trim() ? { phoneNumber: phone.trim() } : {}),
          role,
        });
        navigate('/users');
      }
    } catch {
      setError('Nie udało się zapisać. Sprawdź dane i spróbuj ponownie.');
    } finally { setSaving(false); }
  };

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwStatus('saving');
    try {
      await api.patch(`/users/${id}/password`, { newPassword });
      setNewPassword('');
      setPwStatus('done');
    } catch {
      setPwStatus('error');
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="loading-state">Ładowanie...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="btn-link"
          style={{ marginBottom: 16 }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.275.326.75.75 0 0 1-.215.734L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
          </svg>
          Wróć do użytkowników
        </button>
        <h1 className="page-title">{isEdit ? `Edycja: ${username}` : 'Nowy użytkownik'}</h1>
        <p className="page-subtitle">
          {isEdit ? 'Zaktualizuj dane konta lub zresetuj hasło.' : 'Utwórz nowe konto dostępu do systemu.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        <form onSubmit={handleSubmit} className="card">
          <div className="card-header">
            <div>
              <p className="card-header-title">Dane konta</p>
              <p className="card-header-desc">Podstawowe informacje o użytkowniku.</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label className="field-label">Nazwa użytkownika *</label>
              <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
            </div>
            <div>
              <label className="field-label">Email *</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {!isEdit && (
              <div>
                <label className="field-label">Hasło *</label>
                <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <span className="field-hint">Minimum 6 znaków.</span>
              </div>
            )}
            <div>
              <label className="field-label">Numer telefonu</label>
              <input className="input-field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Rola *</label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="MECHANIC">Mechanik</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            {isEdit && (
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Konto aktywne</span>
              </label>
            )}

            {error   && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                paddingTop: 16,
                borderTop: '1px solid var(--border-muted)',
              }}
            >
              <button type="button" onClick={() => navigate('/users')} className="btn-ghost">Anuluj</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Utwórz konto'}
              </button>
            </div>
          </div>
        </form>

        {isEdit && (
          <form onSubmit={resetPassword} className="card">
            <div className="card-header">
              <div>
                <p className="card-header-title">Reset hasła</p>
                <p className="card-header-desc">Ustaw nowe hasło dla użytkownika.</p>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="field-label">Nowe hasło *</label>
                <input
                  className="input-field"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <span className="field-hint">Minimum 6 znaków.</span>
              </div>
              {pwStatus === 'done'  && <div className="alert alert-success">Hasło zostało zmienione.</div>}
              {pwStatus === 'error' && <div className="alert alert-error">Nie udało się zmienić hasła.</div>}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: 16,
                  borderTop: '1px solid var(--border-muted)',
                }}
              >
                <button type="submit" disabled={pwStatus === 'saving'} className="btn-secondary">
                  {pwStatus === 'saving' ? 'Zmiana...' : 'Resetuj hasło'}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
