import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg, setProfMsg]   = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setEmail(user.email);
    setPhone(user.phoneNumber ?? '');
  }, [user]);

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfMsg(null); setProfSaving(true);
    try {
      await api.put('/auth/me', {
        username, email,
        phoneNumber: phone.trim() || null,
      });
      await refreshUser();
      setProfMsg({ type: 'ok', text: 'Dane zostały zapisane.' });
    } catch {
      setProfMsg({ type: 'err', text: 'Nie udało się zapisać danych.' });
    } finally { setProfSaving(false); }
  };

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'err', text: 'Nowe hasło i potwierdzenie są różne.' });
      return;
    }
    setPwSaving(true);
    try {
      await api.patch('/auth/me/password', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg({ type: 'ok', text: 'Hasło zostało zmienione.' });
    } catch {
      setPwMsg({ type: 'err', text: 'Nieprawidłowe obecne hasło lub błąd serwera.' });
    } finally { setPwSaving(false); }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Profil</h1>
        <p className="page-subtitle">Zarządzaj swoim kontem i bezpieczeństwem.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        <form onSubmit={saveProfile} className="card">
          <div className="card-header">
            <div>
              <p className="card-header-title">Dane konta</p>
              <p className="card-header-desc">Te informacje będą widoczne w systemie.</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label className="field-label">Nazwa użytkownika</label>
              <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Numer telefonu</label>
              <input className="input-field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            {profMsg && (
              <div className={profMsg.type === 'ok' ? 'alert alert-success' : 'alert alert-error'}>
                {profMsg.text}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: 16,
                borderTop: '1px solid var(--border-muted)',
              }}
            >
              <button type="submit" disabled={profSaving} className="btn-primary">
                {profSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </div>
          </div>
        </form>

        <form onSubmit={changePassword} className="card">
          <div className="card-header">
            <div>
              <p className="card-header-title">Zmiana hasła</p>
              <p className="card-header-desc">Hasło musi mieć co najmniej 6 znaków.</p>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label className="field-label">Obecne hasło</label>
              <input className="input-field" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Nowe hasło</label>
              <input className="input-field" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="field-label">Potwierdź nowe hasło</label>
              <input className="input-field" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
            </div>

            {pwMsg && (
              <div className={pwMsg.type === 'ok' ? 'alert alert-success' : 'alert alert-error'}>
                {pwMsg.text}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: 16,
                borderTop: '1px solid var(--border-muted)',
              }}
            >
              <button type="submit" disabled={pwSaving} className="btn-secondary">
                {pwSaving ? 'Zmienianie...' : 'Zmień hasło'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
