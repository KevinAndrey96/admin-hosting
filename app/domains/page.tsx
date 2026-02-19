'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';
import { useSettings } from '../hooks/useSettings';
import dayjs from 'dayjs';

type Domain = {
  id: string;
  userID: string;
  clientName: string;
  clientEmail: string;
  registrarName: string;
  fqdn: string;
  salePrice: number;
  /** When domain is linked to hosting, effective price of that hosting (what client pays). Use for display. */
  effectiveSalePrice?: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  nextBillingDate: string;
  paymentStatus: string;
  status?: string;
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

function getDaysUntilExpiration(expDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expDate);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export default function DomainsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const { settings } = useSettings();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteModal, setDeleteModal] = useState<Domain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renewModal, setRenewModal] = useState<Domain | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [priceInfoOpen, setPriceInfoOpen] = useState<string | null>(null);
  const [priceInfoRect, setPriceInfoRect] = useState<DOMRect | null>(null);
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
  const [transferRequests, setTransferRequests] = useState<
    Array<{
      id: string;
      fqdn: string;
      status: string;
      salePrice: number;
      currency: string;
      createdAt: string;
      user: { fullName: string; email: string; phone?: string | null };
    }>
  >([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!priceInfoOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-price-info]')) {
        setPriceInfoOpen(null);
        setPriceInfoRect(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [priceInfoOpen]);

  const getStatusBadgeColor = (statusCode: number | null): string => {
    if (statusCode === null) return '#6c757d'; // grey - error/timeout
    if (statusCode >= 200 && statusCode < 300) return '#20c997'; // green - 2xx
    if (statusCode >= 300 && statusCode < 400) return '#17a2b8'; // cyan - 3xx redirect
    if (statusCode >= 400 && statusCode < 500) return '#ffc107'; // amber - 4xx client error
    return '#dc3545'; // red - 5xx server error
  };

  /**
   * Ping desde el navegador - evita que el servidor necesite conexiones salientes.
   * cPanel y muchos shared hosts bloquean outbound HTTP desde Node.js.
   */
  const pingDomain = async (fqdn: string, id: string) => {
    setPingStatus((prev) => ({ ...prev, [id]: 'loading' }));
    const setResult = (code: number | null) =>
      setPingStatus((prev) => ({ ...prev, [id]: code }));

    if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(fqdn)) {
      setResult(null);
      return;
    }

    const fetchWithTimeout = (url: string, ms: number) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      return fetch(url, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));
    };

    try {
      await fetchWithTimeout(`https://${fqdn}/`, 8000);
      setResult(200);
    } catch {
      try {
        await fetchWithTimeout(`http://${fqdn}/`, 8000);
        setResult(200);
      } catch {
        setResult(null);
      }
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

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const fetchTransferRequests = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/domains/transfer-requests`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTransferRequests(data);
        }
      } catch {
        setTransferRequests([]);
      }
    };

    const fetchRegistrationRequests = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/domains/registration-requests`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setRegistrationRequests(data);
        }
      } catch {
        setRegistrationRequests([]);
      }
    };

    fetchTransferRequests();
    fetchRegistrationRequests();
  }, [user?.role]);

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

  const hasDomainExpiringSoon = useMemo(() => {
    return domains.some((d) => {
      if (d.paymentStatus === 'CANCELLED') return false;
      const daysLeft = getDaysUntilExpiration(new Date(d.nextBillingDate));
      return daysLeft <= 30;
    });
  }, [domains]);

  type RegistrationRequest = {
  id: string;
  fqdn: string;
  status: string;
  salePrice: number;
  currency: string;
  createdAt: string;
  withHosting: boolean;
  registrationPackageID?: string | null;
  user: {
    fullName: string;
    email: string;
  };
  hostingPackage?: {
    name: string;
  };
};

const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);

  const hasTransferDomains = useMemo(
    () => domains.some((d) => d.status === 'PENDING_PAYMENT' || d.status === 'PENDING_APPROVAL' || d.status === 'REGISTRATION_REQUESTED'),
    [domains]
  );

  const reactivationPenaltyRaw = settings?.domain_reactivation_penalty?.trim() ?? '';
  const reactivationPenalty = reactivationPenaltyRaw
    ? `$ ${Number(reactivationPenaltyRaw).toLocaleString('es-CO')}`
    : '';
  const showReactivationNotice = hasDomainExpiringSoon && reactivationPenaltyRaw;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- domainIds is the stable trigger; adding paginatedData/pingStatus would cause unwanted re-pings
  }, [domainIds]);

  const handleRenew = async () => {
    if (!renewModal) return;
    setRenewing(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/${renewModal.id}/renew`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const newDate = data.nextBillingDate ? new Date(data.nextBillingDate) : dayjs(renewModal.nextBillingDate).add(1, 'year').toDate();
        setDomains((prev) =>
          prev.map((d) =>
            d.id === renewModal.id
              ? { ...d, nextBillingDate: newDate.toISOString(), renewalDate: newDate.toISOString(), paymentStatus: 'PAID' }
              : d
          )
        );
        setRenewModal(null);
      } else {
        alert(data.error || 'Error al renovar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setRenewing(false);
    }
  };

  const handleSendReminder = async (d: Domain) => {
    setSendingReminderId(d.id);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/${d.id}/send-reminder`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Error al enviar el recordatorio');
        return;
      }
      alert(data.message || 'Recordatorio enviado');
    } catch {
      alert('Error al enviar el recordatorio');
    } finally {
      setSendingReminderId(null);
    }
  };

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

  const handleApproveRegistration = async (id: string) => {
    setApprovingId(id);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: id }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const [listRes, regRes] = await Promise.all([
          fetch(`${basePath}/api/domains`, { credentials: 'include' }),
          fetch(`${basePath}/api/domains/registration-requests`, { credentials: 'include' }),
        ]);
        if (listRes.ok) {
          const list = await listRes.json();
          setDomains(list);
        }
        if (regRes.ok) {
          const regList = await regRes.json();
          setRegistrationRequests(regList);
        }
        alert(data.message || 'Registro de dominio aprobado');
      } else {
        alert(data.message || data.error || 'Error al aprobar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveTransfer = async (id: string) => {
    setApprovingId(id);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/transfer-requests/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTransferRequests((prev) => prev.filter((r) => r.id !== id));
        const listRes = await fetch(`${basePath}/api/domains`, { credentials: 'include' });
        if (listRes.ok) {
          const list = await listRes.json();
          setDomains(list);
        }
        alert(data.message || 'Transferencia aprobada');
      } else {
        alert(data.error || 'Error al aprobar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectRegistration = async (id: string) => {
    if (!confirm('¿Rechazar esta solicitud de registro de dominio?')) return;
    setRejectingId(id);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/registration-requests/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRegistrationRequests((prev) => prev.filter((r) => r.id !== id));
        const listRes = await fetch(`${basePath}/api/domains`, { credentials: 'include' });
        if (listRes.ok) {
          const list = await listRes.json();
          setDomains(list);
        }
        alert(data.message || 'Solicitud rechazada');
      } else {
        alert(data.error || 'Error al rechazar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setRejectingId(null);
    }
  };

  const handleRejectTransfer = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud de transferencia?')) {
      return;
    }

    setRejectingId(id);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/transfer-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setTransferRequests((prev) => prev.filter((r) => r.id !== id));
        alert('Solicitud rechazada');
      } else {
        alert(data.error || 'Error al rechazar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setRejectingId(null);
    }
  };

  if (sessionLoading || !user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: 'var(--c-bkg-body)', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20">
          <div className="col-12 d-f jc-sb ai-c">
            <div>
              <h4 className="m-0 c-grey-900">Dominios</h4>
              <p className="c-grey-700 fsz-sm mT-5">
                {user?.role === 'ADMIN' ? 'Gestiona los dominios de tus clientes' : 'Mis dominios'}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="d-f gap-2">
                <Link href="/domains/transfer-in" className="btn btn-outline-primary">
                  <i className="ti-arrow-down mR-5" />
                  Transferir aquí
                </Link>
                <Link href="/domains/new" className="btn btn-primary">
                  <i className="ti-plus mR-5" />
                  Nuevo dominio
                </Link>
              </div>
            )}
          </div>
        </div>

        {user?.role === 'ADMIN' && transferRequests.length > 0 && (
          <div className="bd bgc-white bdrs-3 p-25 mB-20" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h5 className="m-0 mB-15 c-grey-900 fw-600">
              <i className="ti-arrow-down mR-8" />
              Solicitudes de transferencia pendientes
            </h5>
            <p className="m-0 mB-15 c-grey-600 fsz-sm">
              Dominios en proceso de transferencia. Los que están &quot;Pendiente de aprobación&quot; ya tienen pago y comprobante; aprueba para ejecutar la transferencia en Spaceship.
            </p>
            <div className="table-responsive">
              <table className="table table-hover m-0">
                <thead>
                  <tr>
                    <th>Dominio</th>
                    <th>Estado</th>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th className="ta-e">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transferRequests.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-600">{r.fqdn}</td>
                      <td>
                        <span
                          className="badge fsz-xs"
                          style={{
                            backgroundColor: r.status === 'PENDING_APPROVAL' ? '#17a2b8' : '#6c757d',
                            color: '#fff',
                          }}
                        >
                          {r.status === 'PENDING_APPROVAL' ? 'Pendiente de aprobación' : 'Pendiente de pago'}
                        </span>
                      </td>
                      <td>{(r as { user?: { fullName?: string; email?: string } }).user?.fullName ?? '—'}</td>
                      <td>{(r as { user?: { fullName?: string; email?: string } }).user?.email ?? '—'}</td>
                      <td>$ {Number((r as { salePrice?: number }).salePrice ?? 0).toLocaleString('es-CO')}</td>
                      <td>{dayjs(r.createdAt).format('DD/MM/YYYY')}</td>
                      <td className="ta-e">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success p-8 m-0"
                          onClick={() => handleApproveTransfer(r.id)}
                          disabled={approvingId === r.id}
                        >
                          {approvingId === r.id ? (
                            <i className="ti-reload ti-spin" />
                          ) : (
                            <i className="ti-check" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-8 m-0"
                          onClick={() => handleRejectTransfer(r.id)}
                          disabled={rejectingId === r.id}
                        >
                          {rejectingId === r.id ? (
                            <i className="ti-reload ti-spin" />
                          ) : (
                            <i className="ti-close" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {user?.role === 'ADMIN' && registrationRequests.length > 0 && (
          <div className="bd bgc-white bdrs-3 p-25 mB-20" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h5 className="m-0 mB-15 c-grey-900 fw-600">
              <i className="ti-plus mR-8" />
              Solicitudes de registro de dominio pendientes
            </h5>
            <p className="m-0 mB-15 c-grey-600 fsz-sm">
              Nuevos dominios solicitados por clientes. Aprueba para procesar el registro y activar el servicio.
            </p>
            <div className="table-responsive">
              <table className="table table-hover m-0">
                <thead>
                  <tr>
                    <th>Dominio</th>
                    <th>Estado</th>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Paquete</th>
                    <th>Fecha</th>
                    <th className="ta-e">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationRequests.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-600">{r.fqdn}</td>
                      <td>
                        <span
                          className="badge fsz-xs"
                          style={{
                            backgroundColor: '#ffc107',
                            color: '#fff',
                          }}
                        >
                          Registro solicitado
                        </span>
                      </td>
                      <td>{r.user?.fullName || 'N/A'}</td>
                      <td>{r.user?.email || 'N/A'}</td>
                      <td>
                        {r.withHosting && r.registrationPackageID ? (
                          <span className="badge fsz-xs" style={{ backgroundColor: '#17a2b8', color: '#fff' }}>
                            {r.hostingPackage?.name || 'Con Hosting'}
                          </span>
                        ) : (
                          <span className="badge fsz-xs" style={{ backgroundColor: '#6c757d', color: '#fff' }}>
                            Solo Dominio
                          </span>
                        )}
                      </td>
                      <td>{dayjs(r.createdAt).format('DD/MM/YYYY')}</td>
                      <td className="ta-e">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success p-8 m-0"
                          onClick={() => handleApproveRegistration(r.id)}
                          disabled={approvingId === r.id}
                        >
                          {approvingId === r.id ? (
                            <i className="ti-reload ti-spin" />
                          ) : (
                            <i className="ti-check" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-8 m-0"
                          onClick={() => handleRejectRegistration(r.id)}
                          disabled={rejectingId === r.id}
                        >
                          {rejectingId === r.id ? (
                            <i className="ti-reload ti-spin" />
                          ) : (
                            <i className="ti-close" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bd bgc-white bdrs-3 p-25 mB-20" style={{ boxShadow: 'var(--shadow-card)' }}>
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
                      <span className="c-grey-800 d-b mB-10 fw-600">
                        {availabilityResult.price != null && availabilityResult.price > 0 ? (
                          <>
                            Desde {availabilityResult.currency === 'COP' ? '$' : availabilityResult.currency === 'USD' ? 'US$' : availabilityResult.currency + ' '}
                            {Number(availabilityResult.price).toLocaleString('es-CO')}/año
                          </>
                        ) : (
                          'Precio a consultar'
                        )}
                      </span>
                      {availabilityResult.domain && (availabilityResult.price == null || Number(availabilityResult.price) > 0) && (
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

        <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: 'var(--shadow-card)' }}>
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
                      {hasTransferDomains && (
                        <th className="c-grey-800" style={{ minWidth: 140 }}>
                          Transferencia
                        </th>
                      )}
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
                        <td className="fw-500 c-grey-900">
                            <Link href={`/domains/${d.id}/edit`} className="td-n c-grey-900 c-hover-primary">
                              {d.fqdn}
                            </Link>
                          </td>
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
                        <td className="c-grey-800 ta-e" style={{ position: 'relative' }} data-price-info>
                          <span className="d-f ai-c jc-e gap-2">
                            $ {d.salePrice.toLocaleString('es-CO')}
                            <button
                              type="button"
                              className="btn btn-link p-0 m-0"
                              style={{ fontSize: 14, color: '#6c757d', minWidth: 'auto', lineHeight: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                if (priceInfoOpen === d.id) {
                                  setPriceInfoOpen(null);
                                  setPriceInfoRect(null);
                                } else {
                                  setPriceInfoOpen(d.id);
                                  setPriceInfoRect(rect);
                                }
                              }}
                              title="Información"
                            >
                              <i className="ti-help-alt" />
                            </button>
                          </span>
                          {priceInfoOpen === d.id && priceInfoRect && typeof document !== 'undefined' && createPortal(
                            <div
                              className="popover bs-popover-top show"
                              style={{
                                position: 'fixed',
                                right: window.innerWidth - priceInfoRect.right,
                                bottom: window.innerHeight - priceInfoRect.top + 6,
                                zIndex: 9999,
                                maxWidth: 280,
                                backgroundColor: 'var(--c-bkg-card)',
                                color: 'var(--c-text-base)',
                                border: '1px solid var(--c-border)',
                              }}
                            >
                              <div className="popover-body p-10 bdrs-3" style={{ backgroundColor: 'var(--c-bkg-card)', color: 'var(--c-text-base)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-md)' }}>
                                Este dominio ya está incluido con uno de tus paquetes de hosting contratados
                              </div>
                            </div>,
                            document.body
                          )}
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
                        {hasTransferDomains && (
                          <td>
                            {d.status === 'PENDING_PAYMENT' || d.status === 'PENDING_APPROVAL' || d.status === 'REGISTRATION_REQUESTED' ? (
                              <span
                                className="badge fsz-xs"
                                style={{
                                  backgroundColor: d.status === 'PENDING_APPROVAL' ? '#17a2b8' : d.status === 'REGISTRATION_REQUESTED' ? '#ffc107' : '#6c757d',
                                  color: '#fff',
                                }}
                              >
                                {d.status === 'PENDING_APPROVAL' ? 'Pendiente de aprobación' : d.status === 'REGISTRATION_REQUESTED' ? 'Registro solicitado' : 'Pendiente de pago'}
                              </span>
                            ) : (
                              <span className="c-grey-500">—</span>
                            )}
                          </td>
                        )}
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
                              href={`/domains/${d.id}/edit`}
                              className="btn btn-sm btn-primary"
                              style={{ color: '#fff' }}
                              title="Editar"
                            >
                              <i className="ti-pencil" />
                            </Link>
                            <a
                              href={`https://dnschecker.org/#A/${encodeURIComponent(d.fqdn)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-info d-f ai-c jc-c"
                              style={{ color: '#fff' }}
                              title="Ver propagación DNS"
                            >
                              <i className="ti-world" />
                            </a>
                            {user?.role === 'ADMIN' && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary p-8 m-0"
                                  onClick={() => handleSendReminder(d)}
                                  disabled={!!sendingReminderId}
                                  title="Enviar recordatorio de vencimiento"
                                >
                                  {sendingReminderId === d.id ? (
                                    <i className="ti-reload ti-spin" style={{ fontSize: 18 }} />
                                  ) : (
                                    <i className="ti-bell" style={{ fontSize: 18 }} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success p-8 m-0"
                                  onClick={() => setRenewModal(d)}
                                  title="Renovar servicio"
                                >
                                  <i className="ti-plus" style={{ fontSize: 18 }} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setDeleteModal(d)}
                                  title="Eliminar"
                                >
                                  <i className="ti-trash" />
                                </button>
                              </>
                            )}
                            {d.salePrice > 0 && (
                              <Link
                                href={`/pago?tipo=renovar-dominio&domainId=${encodeURIComponent(d.id)}`}
                                className="btn btn-sm btn-success d-f ai-c jc-c"
                                style={{ color: '#fff' }}
                                title="Renovar ahora"
                              >
                                <i className="ti-wallet" />
                              </Link>
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
              {showReactivationNotice && (
                <p className="fsz-sm c-grey-600 mT-15 mB-0 p-12 bd bdrs-3" style={{ backgroundColor: 'color-mix(in srgb, var(--c-warning) 15%, transparent)', borderColor: 'var(--c-warning)' }}>
                  <i className="ti-info-alt mR-8" />
                  Los dominios vencidos tienen un costo adicional de reactivación:{' '}
                  <strong>{reactivationPenalty}</strong>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {renewModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#20c997', color: '#fff' }}>
                <h5 className="modal-title m-0">
                  <i className="ti-plus mR-8" />
                  Renovar dominio
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Cerrar"
                  onClick={() => !renewing && setRenewModal(null)}
                  disabled={renewing}
                />
              </div>
              <div className="modal-body">
                <p className="c-grey-800 mB-15">
                  ¿Extender la vigencia de este dominio por un año adicional? El dominio{' '}
                  <strong>{renewModal.fqdn}</strong> de <strong>{renewModal.clientName}</strong> se mantendrá activo sin interrupciones.
                </p>
                <div className="p-15 bdrs-3 mB-0" style={{ backgroundColor: 'var(--c-bkg-hover)', border: '1px solid var(--c-border)' }}>
                  <p className="m-0 fsz-sm c-grey-700 mB-5">
                    Fecha actual de vencimiento: <strong>{dayjs(renewModal.nextBillingDate).format('DD/MM/YYYY')}</strong>
                  </p>
                  <p className="m-0 fsz-sm c-grey-700">
                    Nueva fecha de vencimiento: <strong>{dayjs(renewModal.nextBillingDate).add(1, 'year').format('DD/MM/YYYY')}</strong>
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRenewModal(null)}
                  disabled={renewing}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{ color: '#fff' }}
                  onClick={handleRenew}
                  disabled={renewing}
                >
                  {renewing ? 'Renovando...' : 'Confirmar renovación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
