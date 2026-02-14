'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';
import dayjs from 'dayjs';

type Domain = {
  id: string;
  userID: string;
  clientName: string;
  clientEmail: string;
  registrarName: string;
  fqdn: string;
  salePrice: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  nextBillingDate: string;
  paymentStatus: string;
  transferLock: boolean;
  healthStatus: string;
  createdAt: string;
};

type SortKey = 'fqdn' | 'clientName' | 'registrarName' | 'salePrice' | 'paymentStatus' | 'nextBillingDate' | '';
type SortDir = 'asc' | 'desc';

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};

export default function DomainsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteModal, setDeleteModal] = useState<Domain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pingStatus, setPingStatus] = useState<Record<string, 'loading' | number | null>>({});
  const [domainCheck, setDomainCheck] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState<{
    available?: boolean;
    domain?: string;
    price?: number;
    currency?: string;
    error?: string;
  } | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const getStatusBadgeColor = (statusCode: number | null): string => {
    if (statusCode === null) return '#6c757d'; // grey - error/timeout
    if (statusCode >= 200 && statusCode < 300) return '#20c997'; // green - 2xx
    if (statusCode >= 300 && statusCode < 400) return '#17a2b8'; // cyan - 3xx redirect
    if (statusCode >= 400 && statusCode < 500) return '#ffc107'; // amber - 4xx client error
    return '#dc3545'; // red - 5xx server error
  };

  const pingDomain = async (fqdn: string, id: string) => {
    setPingStatus((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/ping?fqdn=${encodeURIComponent(fqdn)}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      const statusCode = typeof data.statusCode === 'number' ? data.statusCode : null;
      setPingStatus((prev) => ({ ...prev, [id]: statusCode }));
    } catch {
      setPingStatus((prev) => ({ ...prev, [id]: null }));
    }
  };

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/signin');
    }
  }, [router, sessionLoading, user]);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/domains`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDomains(data);
        }
      } catch {
        setDomains([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDomains();
    }
  }, [user]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return domains;
    const q = search.toLowerCase();
    return domains.filter(
      (d) =>
        d.fqdn.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.clientEmail.toLowerCase().includes(q) ||
        d.registrarName.toLowerCase().includes(q) ||
        (PAYMENT_LABELS[d.paymentStatus]?.toLowerCase().includes(q))
    );
  }, [domains, search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else if (typeof aVal === 'string' && typeof bVal === 'string' && /^\d{4}/.test(aVal) && /^\d{4}/.test(bVal)) {
        cmp = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      } else {
        cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize]
  );

  const domainIds = useMemo(() => paginatedData.map((d) => d.id).sort().join(','), [paginatedData]);
  useEffect(() => {
    paginatedData.forEach((d) => {
      if (pingStatus[d.id] === undefined) {
        pingDomain(d.fqdn, d.id);
      }
    });
  }, [domainIds]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/${deleteModal.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== deleteModal.id));
        setDeleteModal(null);
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ms-1">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
    ) : (
      <span className="ms-1 c-grey-500" style={{ opacity: 0.5 }}>⇅</span>
    );

  if (sessionLoading || !user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: '#fff', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20">
          <div className="col-12 d-f jc-sb ai-c">
            <div>
              <h4 className="m-0 c-grey-900">Dominios</h4>
              <p className="c-grey-700 fsz-sm mT-5">
                {user?.role === 'ADMIN' ? 'Gestiona los dominios de tus clientes' : 'Mis dominios'}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <Link href="/domains/new" className="btn btn-primary">
                <i className="ti-plus mR-5" />
                Nuevo dominio
              </Link>
            )}
          </div>
        </div>

        <div className="bd bgc-white bdrs-3 p-25 mB-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)' }}>
          <div className="d-f fxd-c ai-c ta-c">
            <h5 className="m-0 mB-10 c-grey-900 fw-600">
              Dominios a precio de costo, sin sorpresas
            </h5>
            <p className="m-0 mB-20 c-grey-600 fsz-sm">
              Registra tu dominio con transparencia total. Sin cargos ocultos ni letra pequeña.
            </p>
            <div className="d-f fxd-c ai-c gap-2 w-100" style={{ maxWidth: 420 }}>
              <div className="d-f ai-c gap-2 w-100">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Buscar disponibilidad (ej: midominio.com)"
                  value={domainCheck}
                  onChange={(e) => { setDomainCheck(e.target.value); setAvailabilityResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && (document.querySelector('[data-domain-verify]') as HTMLButtonElement)?.click()}
                />
                <button
                  type="button"
                  data-domain-verify
                  className="btn btn-primary btn-lg"
                  style={{ color: '#fff', whiteSpace: 'nowrap' }}
                  disabled={availabilityLoading || !domainCheck.trim()}
                  onClick={async () => {
                    const q = domainCheck.trim().toLowerCase();
                    if (!q) return;
                    setAvailabilityLoading(true);
                    setAvailabilityResult(null);
                    try {
                      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
                      const res = await fetch(`${basePath}/api/domains/check-availability?domain=${encodeURIComponent(q)}`, {
                        credentials: 'include',
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setAvailabilityResult({ error: data.error || 'Error al verificar' });
                        return;
                      }
                      setAvailabilityResult({
                        available: data.available,
                        domain: data.domain,
                        price: data.price,
                        currency: data.currency,
                      });
                    } catch {
                      setAvailabilityResult({ error: 'Error de conexión' });
                    } finally {
                      setAvailabilityLoading(false);
                    }
                  }}
                >
                  {availabilityLoading ? (
                    <i className="ti-reload ti-spin mR-5" />
                  ) : (
                    <i className="ti-search mR-5" />
                  )}
                  {availabilityLoading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
              {availabilityResult && (
                <div
                  className={`p-3 bdrs-3 w-100 ta-c fsz-sm ${availabilityResult.error ? 'bgc-danger-50' : availabilityResult.available ? 'bgc-success-50' : 'bgc-warning-50'}`}
                  style={{
                    backgroundColor: availabilityResult.error ? 'rgba(220,53,69,0.1)' : availabilityResult.available ? 'rgba(32,201,151,0.15)' : 'rgba(255,193,7,0.2)',
                    border: `1px solid ${availabilityResult.error ? '#dc3545' : availabilityResult.available ? '#20c997' : '#ffc107'}`,
                  }}
                >
                  {availabilityResult.error ? (
                    <span className="c-danger">{availabilityResult.error}</span>
                  ) : availabilityResult.available ? (
                    <>
                      <strong className="c-success d-b mB-5">
                        <i className="ti-check mR-5" />
                        {availabilityResult.domain} está disponible
                      </strong>
                      {availabilityResult.price != null && (
                        <span className="c-grey-700 d-b mB-10">
                          Desde {availabilityResult.currency} {availabilityResult.price.toFixed(2)}/año
                        </span>
                      )}
                      {availabilityResult.domain && (
                        <Link
                          href={`/pago?tipo=contratar-dominio&dominio=${encodeURIComponent(availabilityResult.domain)}`}
                          className="btn btn-sm btn-success"
                          style={{ color: '#fff' }}
                        >
                          <i className="ti-wallet mR-5" />
                          Ir a pago
                        </Link>
                      )}
                    </>
                  ) : (
                    <span className="c-grey-800">
                      <i className="ti-close mR-5" />
                      {availabilityResult.domain} no está disponible
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {loading ? (
            <div className="p-20 ta-c c-grey-700">Cargando...</div>
          ) : domains.length === 0 ? (
            <div className="p-40 ta-c c-grey-700">
              <p className="mB-10">
                {user?.role === 'ADMIN' ? 'No hay dominios registrados.' : 'No tienes dominios registrados.'}
              </p>
              {user?.role === 'ADMIN' && (
                <Link href="/domains/new" className="btn btn-primary">
                  Crear primer dominio
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="d-f fxw-w jc-sb ai-c mB-20 gap-3">
                <div className="d-f ai-c gap-2">
                  <label className="c-grey-700 fsz-sm m-0">Mostrar</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="c-grey-600 fsz-sm">registros</span>
                </div>
                <div className="d-f ai-c gap-2">
                  <label className="c-grey-700 fsz-sm m-0">Buscar:</label>
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    style={{ width: 220 }}
                    placeholder="Filtrar..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered">
                  <thead>
                    <tr>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 160 }}
                        onClick={() => handleSort('fqdn')}
                      >
                        Dominio
                        <SortIcon col="fqdn" />
                      </th>
                      {user?.role === 'ADMIN' && (
                        <th
                          className="c-grey-800 cur-p"
                          style={{ minWidth: 140 }}
                          onClick={() => handleSort('clientName')}
                        >
                          Cliente
                          <SortIcon col="clientName" />
                        </th>
                      )}
                      {user?.role === 'ADMIN' && (
                        <th
                          className="c-grey-800 cur-p"
                          style={{ minWidth: 120 }}
                          onClick={() => handleSort('registrarName')}
                        >
                          Registrador
                          <SortIcon col="registrarName" />
                        </th>
                      )}
                      <th
                        className="c-grey-800 cur-p ta-e"
                        style={{ minWidth: 90 }}
                        onClick={() => handleSort('salePrice')}
                      >
                        Precio
                        <SortIcon col="salePrice" />
                      </th>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 100 }}
                        onClick={() => handleSort('nextBillingDate')}
                      >
                        Fecha de vencimiento
                        <SortIcon col="nextBillingDate" />
                      </th>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 100 }}
                        onClick={() => handleSort('paymentStatus')}
                      >
                        Pago
                        <SortIcon col="paymentStatus" />
                      </th>
                      <th className="c-grey-800" style={{ minWidth: 100 }}>
                        Estado
                      </th>
                      <th className="ta-e c-grey-800" style={{ minWidth: 90 }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((d) => (
                      <tr key={d.id}>
                        <td className="fw-500 c-grey-900">{d.fqdn}</td>
                        {user?.role === 'ADMIN' && (
                          <td className="c-grey-800">
                            <Link href={`/clients/${d.userID}/edit`} className="td-n c-grey-800">
                              {d.clientName}
                            </Link>
                          </td>
                        )}
                        {user?.role === 'ADMIN' && (
                          <td className="c-grey-800">{d.registrarName}</td>
                        )}
                        <td className="c-grey-800 ta-e">
                          {d.currency} {d.salePrice.toLocaleString()}
                        </td>
                        <td className="c-grey-800">
                          {dayjs(d.nextBillingDate).format('DD/MM/YYYY')}
                        </td>
                        <td>
                          <span
                            className="badge rounded-pill fsz-xs"
                            style={{
                              backgroundColor:
                                d.paymentStatus === 'PAID'
                                  ? '#20c997'
                                  : d.paymentStatus === 'OVERDUE'
                                    ? '#dc3545'
                                    : d.paymentStatus === 'CANCELLED'
                                      ? '#6c757d'
                                      : '#ffc107',
                              color: d.paymentStatus === 'PENDING' ? '#000' : '#fff',
                            }}
                          >
                            {PAYMENT_LABELS[d.paymentStatus] ?? d.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className="d-f ai-c gap-2">
                            {pingStatus[d.id] === 'loading' ? (
                              <>
                                <i className="ti-reload ti-spin c-grey-500" />
                                <span className="c-grey-500 fsz-sm">Verificando...</span>
                              </>
                            ) : pingStatus[d.id] !== undefined ? (
                              (() => {
                                const code = pingStatus[d.id] as number | null;
                                const bg = getStatusBadgeColor(code);
                                const textColor = typeof code === 'number' && code >= 400 && code < 500 ? '#000' : '#fff';
                                return (
                                  <>
                                    <span
                                      className="badge rounded-pill fsz-xs"
                                      style={{ backgroundColor: bg, color: textColor }}
                                    >
                                      {code === null ? 'Error' : code}
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link p-0 m-0"
                                      onClick={() => pingDomain(d.fqdn, d.id)}
                                      title="Verificar de nuevo"
                                    >
                                      <i className="ti-reload c-grey-500" />
                                    </button>
                                  </>
                                );
                              })()
                            ) : null}
                          </span>
                        </td>
                        <td className="ta-e">
                          <div className="d-f gap-2 jc-e">
                            <Link
                              href={`/pago?tipo=renovar-dominio&domainId=${encodeURIComponent(d.id)}`}
                              className="btn btn-sm btn-success d-f ai-c gap-1"
                              style={{ color: '#fff' }}
                              title="Renovar ahora"
                            >
                              <i className="ti-wallet" />
                              Renovar ahora
                            </Link>
                            <Link
                              href={`/domains/${d.id}/edit`}
                              className="btn btn-sm btn-primary"
                              style={{ color: '#fff' }}
                              title="Editar"
                            >
                              <i className="ti-pencil" />
                            </Link>
                            {user?.role === 'ADMIN' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setDeleteModal(d)}
                                title="Eliminar"
                              >
                                <i className="ti-trash" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-f fxw-w jc-sb ai-c mT-20 pt-3 bdT">
                <div className="c-grey-600 fsz-sm">
                  Mostrando{' '}
                  {sortedData.length === 0
                    ? 0
                    : (page - 1) * pageSize + 1}{' '}
                  a {Math.min(page * pageSize, sortedData.length)} de {sortedData.length} registros
                </div>
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {deleteModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar eliminación</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => !deleting && setDeleteModal(null)}
                  disabled={deleting}
                />
              </div>
              <div className="modal-body">
                <p className="m-0">
                  ¿Estás seguro de que deseas eliminar el dominio <strong>{deleteModal.fqdn}</strong>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
