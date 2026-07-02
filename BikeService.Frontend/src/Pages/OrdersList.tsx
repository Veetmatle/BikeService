import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import type { ServiceOrderSummary, PagedResult } from '../types';

const FILTERS: { key: string | null; label: string }[] = [
  { key: null,             label: 'Wszystkie' },
  { key: 'InProgress',     label: 'Realizacja' },
  { key: 'ReadyForPickup', label: 'Do odbioru' },
  { key: 'PickedUp',       label: 'Odebrane' },
  { key: 'Cancelled',      label: 'Anulowane' },
];

const fmt      = (d?: string) => (d ? new Date(d).toLocaleDateString('pl-PL') : '—');
const fmtPrice = (p?: number) => (p != null ? `${p.toFixed(2)} zł` : '—');

export default function OrdersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus]         = useState<string | null>(searchParams.get('status'));
  const [search, setSearch]         = useState(searchParams.get('search') ?? '');
  const [searchField, setSearchField] = useState(searchParams.get('searchField') ?? 'all');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage]             = useState(1);

  const [orders, setOrders]         = useState<ServiceOrderSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (searchField !== 'all') params.searchField = searchField;
    setSearchParams(params, { replace: true });
  }, [status, debouncedSearch, searchField]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) params.set('status', status);
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
      if (searchField !== 'all') params.set('searchField', searchField);
    }

    api
      .get<PagedResult<ServiceOrderSummary>>(`/orders?${params}`)
      .then((r) => {
        setOrders(r.data.items);
        setTotalPages(r.data.totalPages);
        setTotalCount(r.data.totalCount);
      })
      .finally(() => setLoading(false));
  }, [status, debouncedSearch, searchField, page]);

  const changeStatus = (s: string | null) => {
    setStatus(s);
    setPage(1);
  };

  const changeSearchField = (field: string) => {
    setSearchField(field);
    setSearch('');
    setPage(1);
  };

  const bikeLabel = (o: ServiceOrderSummary) =>
    [o.bikeBrand, o.bikeModel].filter(Boolean).join(' ') || '—';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      <div className="page-header">
        <div>
          <h1 className="page-title">Zlecenia</h1>
          <p className="page-subtitle">
            {totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'zlecenie' : 'zleceń'}` : 'Brak zleceń'}
          </p>
        </div>
        <button onClick={() => navigate('/orders/new')} className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
          Nowe zlecenie
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px',
            background: 'var(--surface)',
            border: '1px solid var(--border-muted)',
            borderRadius: 10,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {FILTERS.map((f) => {
            const active = status === f.key;
            return (
              <button
                key={f.key ?? 'all'}
                onClick={() => changeStatus(f.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease, color 0.12s ease',
                  background: active ? 'var(--surface-3)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 280 }}>
          <select
            value={searchField}
            onChange={e => changeSearchField(e.target.value)}
            className="input-field"
            style={{ height: 38, padding: '0 10px', fontSize: 13, flexShrink: 0, width: 'auto', cursor: 'pointer' }}
          >
            <option value="all">Wszystkie pola</option>
            <option value="lastname">Nazwisko</option>
            <option value="email">E-mail</option>
            <option value="phone">Telefon</option>
            <option value="id">Numer #</option>
          </select>

          <div style={{ position: 'relative', flex: 1 }}>
            <svg
              width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}
            >
              <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
            </svg>
            <input
              className="input-field"
              style={{ paddingLeft: 32, height: 38 }}
              placeholder={
                searchField === 'lastname' ? 'Szukaj po nazwisku…' :
                searchField === 'email'    ? 'Szukaj po e-mailu…' :
                searchField === 'phone'    ? 'Szukaj po telefonie…' :
                searchField === 'id'       ? 'Wpisz numer zlecenia…' :
                'Szukaj…'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-subtle)', fontSize: 16, lineHeight: 1, padding: '0 2px',
                }}
                title="Wyczyść"
              >×</button>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden', marginBottom: 8 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>#</th>
              <th>Klient</th>
              <th>Rower</th>
              <th>Status</th>
              <th>Cena szac.</th>
              <th>Przyjęte</th>
              <th>Termin</th>
              <th>Edytował</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="table-empty">Ładowanie...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="table-empty">Brak zleceń w tej kategorii</td></tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="clickable"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="muted">#{order.id}</td>
                  <td className="primary">{order.clientFirstName} {order.clientLastName}</td>
                  <td>{bikeLabel(order)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>{fmtPrice(order.estimatedPrice)}</td>
                  <td className="muted">{fmt(order.createdAt)}</td>
                  <td className="muted">{fmt(order.estimatedPickupDate)}</td>
                  <td className="muted">{order.lastEditedBy ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
