import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface FormState {
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string;
  bikeModel: string;
  description: string;
  estimatedPrice: string;
  estimatedPickupDate: string;
}

const empty: FormState = {
  clientFirstName: '', clientLastName: '', clientPhone: '', clientEmail: '',
  bikeModel: '', description: '', estimatedPrice: '', estimatedPickupDate: '',
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="card-header-title">{title}</p>
          {description && <p className="card-header-desc">{description}</p>}
        </div>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

export default function OrderCreate() {
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        clientFirstName:  form.clientFirstName,
        clientLastName:   form.clientLastName,
        clientPhone:      form.clientPhone,
        clientEmail:      form.clientEmail,
        bikeModel:        form.bikeModel.trim() || undefined,
        description:      form.description.trim() || undefined,
        estimatedPrice:   form.estimatedPrice ? parseFloat(form.estimatedPrice) : undefined,
        estimatedPickupDate: form.estimatedPickupDate ? `${form.estimatedPickupDate}T00:00:00Z` : undefined,
      };
      const res = await api.post<{ id: number }>('/orders', payload);
      navigate(`/orders/${res.data.id}`);
    } catch {
      setError('Nie udało się utworzyć zlecenia. Sprawdź dane i spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 760, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="btn-link"
          style={{ marginBottom: 16 }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.275.326.75.75 0 0 1-.215.734L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
          </svg>
          Wróć do zleceń
        </button>
        <h1 className="page-title">Nowe zlecenie</h1>
        <p className="page-subtitle">Wypełnij dane klienta, aby utworzyć nowe zgłoszenie serwisowe. Dane roweru i szczegóły zlecenia możesz uzupełnić później.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        <Section title="Dane klienta" description="Dane kontaktowe właściciela roweru.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label className="field-label">Imię *</label>
              <input className="input-field" value={form.clientFirstName} onChange={set('clientFirstName')} required />
            </div>
            <div>
              <label className="field-label">Nazwisko *</label>
              <input className="input-field" value={form.clientLastName} onChange={set('clientLastName')} required />
            </div>
            <div>
              <label className="field-label">Telefon *</label>
              <input className="input-field" type="tel" value={form.clientPhone} onChange={set('clientPhone')} required />
            </div>
            <div>
              <label className="field-label">Email *</label>
              <input className="input-field" type="email" value={form.clientEmail} onChange={set('clientEmail')} required />
            </div>
          </div>
        </Section>

        <Section title="Dane roweru" description="Wpisz dowolne informacje o rowerze — markę, model, kolor, numer ramy itp.">
          <div>
            <label className="field-label">Opis roweru</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="np. Trek Marlin 7, czarny, nr ramy XYZ123…"
              value={form.bikeModel}
              onChange={set('bikeModel')}
            />
          </div>
        </Section>

        <Section title="Szczegóły zlecenia" description="Opisz usterkę i ustaw szacunkowe dane realizacji.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="field-label">Opis usterki</label>
              <textarea
                className="input-field"
                rows={4}
                value={form.description}
                onChange={set('description')}
                placeholder="Opisz problem zgłoszony przez klienta..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <label className="field-label">Cena szacunkowa (zł)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.estimatedPrice}
                  onChange={set('estimatedPrice')}
                />
              </div>
              <div>
                <label className="field-label">Planowany termin odbioru</label>
                <input
                  className="input-field"
                  type="date"
                  value={form.estimatedPickupDate}
                  onChange={set('estimatedPickupDate')}
                />
              </div>
            </div>
          </div>
        </Section>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={() => navigate('/orders')} className="btn-ghost">
            Anuluj
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Tworzenie...' : 'Utwórz zlecenie'}
          </button>
        </div>

      </div>
    </form>
  );
}
