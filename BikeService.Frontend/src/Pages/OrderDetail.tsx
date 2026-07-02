import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import type { MentionableUser, ServiceOrder } from '../types';

interface FormState {
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  bikeModel: string;
  description: string;
  notes: string;
  estimatedPrice: string;
  finalPrice: string;
  estimatedPickupDate: string;
  taggedUserIds: number[];
  pendingStatus: string;
}

const STATUS_OPTIONS = [
  { value: 'InProgress',     label: 'Realizacja' },
  { value: 'ReadyForPickup', label: 'Do odbioru' },
  { value: 'PickedUp',       label: 'Odebrane' },
  { value: 'Cancelled',      label: 'Anulowane' },
];

const fmt      = (d?: string) => (d ? new Date(d).toLocaleDateString('pl-PL') : '—');
const fmtPrice = (p?: number) => (p != null ? `${p.toFixed(2)} zł` : '—');

function CardSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="card-header-title">{title}</p>
          {description && <p className="card-header-desc">{description}</p>}
        </div>
        {action}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid var(--border-muted)',
      }}
    >
      <dt style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</dt>
      <dd style={{ fontSize: 13, color: 'var(--text)', textAlign: 'right' }}>{value}</dd>
    </div>
  );
}

function TagPicker({
  taggedUserIds,
  onChange,
  allUsers,
}: {
  taggedUserIds: number[];
  onChange: (ids: number[]) => void;
  allUsers: MentionableUser[];
}) {
  const addUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = parseInt(e.target.value);
    if (!userId) return;
    if (!taggedUserIds.includes(userId)) onChange([...taggedUserIds, userId]);
    e.target.value = '';
  };

  const removeUser = (userId: number) =>
    onChange(taggedUserIds.filter(id => id !== userId));

  const available = allUsers.filter(u => !taggedUserIds.includes(u.id));

  return (
    <div>
      <label className="field-label">Otaguj pracowników</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: available.length > 0 ? 8 : 0 }}>
        {taggedUserIds.map(id => {
          const user = allUsers.find(u => u.id === id);
          if (!user) return null;
          return (
            <span
              key={id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px 3px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(31,111,235,0.12)',
                color: 'var(--accent-fg)',
                border: '1px solid rgba(31,111,235,0.25)',
              }}
            >
              @{user.username}
              <button
                type="button"
                onClick={() => removeUser(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(31,111,235,0.2)',
                  color: 'var(--accent-fg)',
                  cursor: 'pointer',
                  fontSize: 10,
                  lineHeight: 1,
                  padding: 0,
                  flexShrink: 0,
                }}
                title={`Usuń @${user.username}`}
              >
                ✕
              </button>
            </span>
          );
        })}
        {available.length > 0 && (
          <select
            onChange={addUser}
            defaultValue=""
            className="input-field"
            style={{ padding: '3px 10px', fontSize: 12, height: 28, width: 'auto', minWidth: 160 }}
          >
            <option value="" disabled>+ Dodaj pracownika…</option>
            {available.map(u => (
              <option key={u.id} value={u.id}>@{u.username}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder]     = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isEditing, setIsEditing]       = useState(false);
  const [form, setForm]                 = useState<FormState | null>(null);
  const [formSaving, setFormSaving]     = useState(false);
  const [formError, setFormError]       = useState('');
  const [conflictError, setConflictError] = useState(false);
  const [emailSent, setEmailSent]       = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError]         = useState('');

  const [mentionUsers, setMentionUsers] = useState<MentionableUser[]>([]);

  const fetchOrder = () =>
    api.get<ServiceOrder>(`/orders/${id}`)
      .then(r => { setOrder(r.data); })
      .catch(e => { if (e.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));

  useEffect(() => { fetchOrder(); }, [id]);

  useEffect(() => {
    api.get<MentionableUser[]>('/notifications/mentionable-users')
      .then(r => setMentionUsers(r.data))
      .catch(() => {});
  }, []);

  const startEditing = () => {
    if (!order) return;
    setForm({
      clientFirstName:     order.clientFirstName,
      clientLastName:      order.clientLastName,
      clientPhone:         order.clientPhone,
      clientEmail:         order.clientEmail,
      bikeModel:           [order.bikeBrand, order.bikeModel].filter(Boolean).join(' '),
      description:         order.description,
      notes:               order.notes ?? '',
      estimatedPrice:      order.estimatedPrice != null ? String(order.estimatedPrice) : '',
      finalPrice:          order.finalPrice != null ? String(order.finalPrice) : '',
      estimatedPickupDate: order.estimatedPickupDate ? order.estimatedPickupDate.slice(0, 10) : '',
      taggedUserIds:       (order.taggedUsers ?? []).map(u => u.id),
      pendingStatus:       order.status,
    });
    setIsEditing(true);
    setFormError('');
    setConflictError(false);
    setEmailSent(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setForm(null);
    setFormError('');
    setConflictError(false);
  };

  const refreshAfterConflict = async () => {
    setConflictError(false);
    setIsEditing(false);
    setForm(null);
    await fetchOrder();
  };

  const setField = (field: keyof Omit<FormState, 'taggedUserIds' | 'pendingStatus'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => prev ? { ...prev, [field]: e.target.value } : prev);

  const saveEdit = async () => {
    if (!form || !order) return;
    setFormSaving(true);
    setFormError('');
    setConflictError(false);
    setEmailSent(false);

    const statusChanged = form.pendingStatus !== order.status;

    try {
      const putRes = await api.put<ServiceOrder>(`/orders/${id}`, {
        clientFirstName:     form.clientFirstName,
        clientLastName:      form.clientLastName,
        clientPhone:         form.clientPhone,
        clientEmail:         form.clientEmail,
        bikeModel:           form.bikeModel,
        description:         form.description,
        notes:               form.notes.trim() || null,
        taggedUserIds:       form.taggedUserIds,
        estimatedPrice:      form.estimatedPrice  ? parseFloat(form.estimatedPrice)  : null,
        finalPrice:          form.finalPrice      ? parseFloat(form.finalPrice)      : null,
        estimatedPickupDate: form.estimatedPickupDate
          ? `${form.estimatedPickupDate}T00:00:00Z`
          : null,
        rowVersion: order.rowVersion,
      });

      if (statusChanged) {
        await api.patch(`/orders/${id}/status`, {
          status: form.pendingStatus,
          rowVersion: putRes.data.rowVersion,
        });
        if (form.pendingStatus === 'ReadyForPickup') setEmailSent(true);
      }

      await fetchOrder();
      setIsEditing(false);
      setForm(null);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 409) {
        setConflictError(true);
      } else {
        setFormError('Nie udało się zapisać zmian. Sprawdź dane i spróbuj ponownie.');
      }
    } finally {
      setFormSaving(false);
    }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/orders/${id}/photos`, formData);
      await fetchOrder();
    } catch {
      setPhotoError('Nie udało się przesłać zdjęcia. Dozwolone formaty: jpg, jpeg, png, webp (max 10 MB).');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm('Usunąć to zdjęcie?')) return;
    await api.delete(`/orders/${id}/photos/${photoId}`);
    fetchOrder();
  };

  if (loading) return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="loading-state">Ładowanie zlecenia...</div>
    </div>
  );

  if (notFound) return (
    <div style={{ maxWidth: 440, margin: '80px auto 0', textAlign: 'center' }}>
      <div className="card" style={{ padding: '40px 32px' }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Zlecenie nie istnieje</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          Sprawdź adres URL lub wróć do listy zleceń.
        </p>
        <button onClick={() => navigate('/orders')} className="btn-secondary">← Wróć do listy</button>
      </div>
    </div>
  );

  if (!order) return null;

  const taggedUsers = order.taggedUsers ?? [];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <button onClick={() => navigate('/orders')} className="btn-link" style={{ marginBottom: 16 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.275.326.75.75 0 0 1-.215.734L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
          </svg>
          Wróć do zleceń
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="page-title">
              Zlecenie <span style={{ color: 'var(--text-muted)' }}>#{order.id}</span>
            </h1>

            {isEditing && form ? (
              <select
                value={form.pendingStatus}
                onChange={e => setForm(prev => prev ? { ...prev, pendingStatus: e.target.value } : prev)}
                className="input-field"
                style={{ padding: '5px 10px', fontSize: 13, height: 32 }}
                disabled={formSaving}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            ) : (
              <StatusBadge status={order.status} />
            )}

            {emailSent && (
              <span style={{ fontSize: 12, color: 'var(--success-fg, #3fb950)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                Email wysłany do klienta
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
              {order.createdBy} · {fmt(order.createdAt)}
              {order.lastEditedBy && ` · edytował: ${order.lastEditedBy}`}
            </p>

            {isEditing ? (
              <>
                <button
                  onClick={cancelEditing}
                  disabled={formSaving}
                  className="btn-ghost"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveEdit}
                  disabled={formSaving}
                  className="btn-primary"
                >
                  {formSaving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                </button>
              </>
            ) : (
              <button onClick={startEditing} className="btn-secondary">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 6 }}>
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81 3.23 11.33c-.03.03-.052.067-.063.107l-.652 2.278 2.278-.651a.196.196 0 0 0 .108-.063L11.19 6.25Z" />
                </svg>
                Edytuj
              </button>
            )}
          </div>
        </div>

        <p className="page-subtitle">
          Klient: <span style={{ color: 'var(--text-2)' }}>{order.clientFirstName} {order.clientLastName}</span>
        </p>

        {formError && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>{formError}</div>
        )}

        {conflictError && (
          <div
            className="alert alert-error"
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
              </svg>
              Ktoś inny zapisał zmiany w tym zleceniu. Twoje zmiany nie zostały zapisane.
            </span>
            <button
              onClick={refreshAfterConflict}
              className="btn-secondary"
              style={{ fontSize: 12, padding: '4px 12px', flexShrink: 0 }}
            >
              Odśwież dane
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

          <CardSection title="Dane klienta">
            {isEditing && form ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="field-label">Imię *</label>
                    <input className="input-field" value={form.clientFirstName} onChange={setField('clientFirstName')} required />
                  </div>
                  <div>
                    <label className="field-label">Nazwisko *</label>
                    <input className="input-field" value={form.clientLastName} onChange={setField('clientLastName')} required />
                  </div>
                </div>
                <div>
                  <label className="field-label">Telefon *</label>
                  <input className="input-field" type="tel" value={form.clientPhone} onChange={setField('clientPhone')} required />
                </div>
                <div>
                  <label className="field-label">Email *</label>
                  <input className="input-field" type="email" value={form.clientEmail} onChange={setField('clientEmail')} required />
                </div>
              </div>
            ) : (
              <dl>
                <DataRow label="Imię i nazwisko" value={`${order.clientFirstName} ${order.clientLastName}`} />
                <DataRow label="Telefon"         value={order.clientPhone} />
                <DataRow label="Email"           value={order.clientEmail} />
              </dl>
            )}
          </CardSection>

          <CardSection title="Dane roweru">
            {isEditing && form ? (
              <div>
                <label className="field-label">Opis roweru</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="np. Trek Marlin 7, czarny, nr ramy XYZ123…"
                  value={form.bikeModel}
                  onChange={setField('bikeModel')}
                />
              </div>
            ) : (
              <dl>
                <DataRow label="Opis roweru" value={[order.bikeBrand, order.bikeModel].filter(Boolean).join(' ')} />
                <DataRow label="Typ"         value={order.bikeType} />
                <DataRow label="Kolor"       value={order.bikeColor} />
                <DataRow label="Nr ramy"     value={order.bikeFrameNumber} />
              </dl>
            )}
          </CardSection>
        </div>

        <CardSection title="Szczegóły zlecenia" description="Opis usterki i kluczowe parametry.">
          {isEditing && form ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="field-label">Opis usterki (widoczny dla klienta) *</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={form.description}
                  onChange={setField('description')}
                  required
                />
              </div>
              <div>
                <label className="field-label">Notatki wewnętrzne (tylko dla pracowników)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Notatki widoczne tylko dla pracowników…"
                  value={form.notes}
                  onChange={setField('notes')}
                />
              </div>
              <TagPicker
                taggedUserIds={form.taggedUserIds}
                onChange={ids => setForm(prev => prev ? { ...prev, taggedUserIds: ids } : prev)}
                allUsers={mentionUsers}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                <div>
                  <label className="field-label">Cena szacunkowa (zł)</label>
                  <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00" value={form.estimatedPrice} onChange={setField('estimatedPrice')} />
                </div>
                <div>
                  <label className="field-label">Cena końcowa (zł)</label>
                  <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00" value={form.finalPrice} onChange={setField('finalPrice')} />
                </div>
                <div>
                  <label className="field-label">Planowany termin odbioru</label>
                  <input className="input-field" type="date" value={form.estimatedPickupDate} onChange={setField('estimatedPickupDate')} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Opis usterki
                </p>
                <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.65, color: 'var(--text-2)' }}>
                  {order.description}
                </p>
              </div>

              {order.notes && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Notatki wewnętrzne
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-subtle)', fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>
                      tylko dla pracowników
                    </span>
                  </p>
                  <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.65, color: 'var(--text-2)' }}>
                    {order.notes}
                  </p>
                </div>
              )}

              {taggedUsers.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Otagowani pracownicy
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {taggedUsers.map(u => (
                      <span
                        key={u.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'rgba(31,111,235,0.10)',
                          color: 'var(--accent-fg)',
                          border: '1px solid rgba(31,111,235,0.20)',
                        }}
                      >
                        @{u.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 20,
                  paddingTop: 20,
                  borderTop: '1px solid var(--border-muted)',
                }}
              >
                {[
                  { label: 'Cena szacunkowa', value: fmtPrice(order.estimatedPrice) },
                  { label: 'Cena końcowa',    value: fmtPrice(order.finalPrice) },
                  { label: 'Termin odbioru',  value: fmt(order.estimatedPickupDate) },
                  ...(order.completedAt ? [{ label: 'Ukończono', value: fmt(order.completedAt) }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-subtle)', marginBottom: 6 }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardSection>

        <CardSection
          title="Zdjęcia"
          description="Dokumentacja stanu roweru i prac."
          action={isEditing ? (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={photoUploading}
                className="btn-secondary"
              >
                {photoUploading ? 'Wysyłanie...' : '+ Dodaj zdjęcie'}
              </button>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={uploadPhoto} />
            </>
          ) : undefined}
        >
          {order.photos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Brak zdjęć</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {order.photos.map(photo => (
                <div
                  key={photo.id}
                  style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}
                  className="group"
                >
                  <a href={photo.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={photo.url}
                      alt={photo.fileName}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                  {isEditing && (
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 28, height: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 6, fontSize: 12,
                        background: 'rgba(13,17,23,0.85)', color: '#fff',
                        border: '1px solid var(--border)', cursor: 'pointer',
                      }}
                      title="Usuń zdjęcie"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {photoError && <p style={{ fontSize: 12, color: 'var(--danger-fg)', marginTop: 8 }}>{photoError}</p>}
        </CardSection>

      </div>
    </div>
  );
}
