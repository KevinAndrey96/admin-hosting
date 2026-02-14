'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';
import dayjs from 'dayjs';

type Hosting = {
  id: string;
  userID: string;
  clientName: string;
  clientEmail: string;
  packageID: string;
  packageName: string;
  packageColorHex?: string | null;
  diskSpaceQuotaMb?: number | null;
  salePrice: number;
  currency: string;
  domainIDs: string[];
  domainFqdns: string[];
  username: string;
  nextBillingDate: string;
  paymentStatus: string;
  serviceStatus: string;
};

type Package = {
  id: string;
  name: string;
  colorHex: string | null;
  salePrice: number;
  currency: string;
  diskSpaceQuotaMb: number | null;
  bandwidthLimitMb: number | null;
  maxEmailAccounts: number | null;
  maxParkedDomains: number | null;
  maxAddonDomains: number | null;
  includedDomains: number;
  hostingCount?: number;
};

function fmtMb(mb: number | null): string {
  if (mb == null) return 'Ilimitado';
  return `${mb.toLocaleString()} MB`;
}

function fmtLimit(v: number | null | undefined): string {
  return v != null ? v.toLocaleString() : 'Ilimitado';
}

type SortKey = 'clientName' | 'packageName' | 'username' | 'domainFqdns' | 'salePrice' | 'paymentStatus' | 'serviceStatus' | 'nextBillingDate' | '';
type SortDir = 'asc' | 'desc';

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};

const SERVICE_LABELS: Record<string, string> = {
  ENABLED: 'Activo',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
};

export default function HostingPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteModal, setDeleteModal] = useState<Hosting | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [contractModal, setContractModal] = useState<Package | null>(null);
  const [requiresMigrationHelp, setRequiresMigrationHelp] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [contractSubmitting, setContractSubmitting] = useState(false);
  const [redirectModal, setRedirectModal] = useState<{ hosting: Hosting; url: string; title: string } | null>(null);
  const [renewModal, setRenewModal] = useState<Hosting | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/signin');
    }
  }, [router, sessionLoading, user]);

  useEffect(() => {
    const fetchHostings = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/hosting`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setHostings(data);
        }
      } catch {
        setHostings([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHostings();
    }
  }, [user]);

  useEffect(() => {
    if (!redirectModal) return;
    const t = setTimeout(() => {
      window.open(redirectModal.url, '_blank');
      setRedirectModal(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [redirectModal]);

  useEffect(() => {
    if (!user || user?.role === 'ADMIN') return;
    const fetchPackages = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/packages`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
        }
      } catch {
        setPackages([]);
      }
    };
    fetchPackages();
  }, [user]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return hostings;
    const q = search.toLowerCase();
    return hostings.filter(
      (h) =>
        h.clientName.toLowerCase().includes(q) ||
        h.clientEmail.toLowerCase().includes(q) ||
        h.packageName?.toLowerCase().includes(q) ||
        h.username.toLowerCase().includes(q) ||
        (h.domainFqdns?.some((f) => f.toLowerCase().includes(q))) ||
        (PAYMENT_LABELS[h.paymentStatus]?.toLowerCase().includes(q)) ||
        (SERVICE_LABELS[h.serviceStatus]?.toLowerCase().includes(q))
    );
  }, [hostings, search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortKey as keyof Hosting];
      let bVal = b[sortKey as keyof Hosting];
      if (sortKey === 'domainFqdns') {
        aVal = Array.isArray(aVal) ? (aVal as string[]).join(', ') : '';
        bVal = Array.isArray(bVal) ? (bVal as string[]).join(', ') : '';
      }
      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else if (typeof aVal === 'string' && typeof bVal === 'string' && /^\d{4}/.test(aVal) && /^\d{4}/.test(bVal)) {
        cmp = new Date(aVal).getTime() - new Date(bVal).getTime();
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

  const handleRenew = async () => {
    if (!renewModal) return;
    setRenewing(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/hosting/${renewModal.id}/renew`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const newDate = data.nextBillingDate ? new Date(data.nextBillingDate) : dayjs(renewModal.nextBillingDate).add(1, 'year').toDate();
        setHostings((prev) =>
          prev.map((h) =>
            h.id === renewModal.id
              ? { ...h, nextBillingDate: newDate.toISOString(), paymentStatus: 'PAID' }
              : h
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

  const handleSendReminder = async (h: Hosting) => {
    setSendingReminderId(h.id);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/hosting/${h.id}/send-reminder`, {
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
      const res = await fetch(`${basePath}/api/hosting/${deleteModal.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHostings((prev) => prev.filter((h) => h.id !== deleteModal.id));
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

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey === col ? (
      <span className="ms-1">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
    ) : (
      <span className="ms-1 c-grey-500" style={{ opacity: 0.5 }}>⇅</span>
    )
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
              <h4 className="m-0 c-grey-900">Hosting</h4>
              <p className="c-grey-700 fsz-sm mT-5">
                {user?.role === 'ADMIN' ? 'Gestiona los planes de hosting de tus clientes' : 'Mis servidores'}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <Link href="/hosting/new" className="btn btn-primary">
                <i className="ti-plus mR-5" />
                Nuevo hosting
              </Link>
            )}
          </div>
        </div>

        {user?.role !== 'ADMIN' && (
        <div className="mB-20">
          <h5 className="m-0 mB-10 c-grey-900 fw-600">
            Planes de hosting disponibles
          </h5>
          <p className="m-0 mB-20 c-grey-600 fsz-sm">
            Almacenamiento, ancho de banda y correos incluidos. Elige el plan que mejor se adapte a tu proyecto.
          </p>
          {packages.length === 0 ? (
            <div className="p-20 ta-c c-grey-600 fsz-sm bd bgc-white bdrs-3">Cargando planes...</div>
          ) : (
            <div className="d-f fxw-w gap-3">
              {[...packages].sort((a, b) => a.salePrice - b.salePrice).map((p) => (
                <div
                  key={p.id}
                  className="bd bgc-white bdrs-3 ov-h"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', minWidth: 220, flex: '1 1 220px', maxWidth: 320 }}
                >
                  <div
                    className="ta-c p-20"
                    style={{ backgroundColor: p.colorHex || '#6c757d' }}
                  >
                    <h3 className="m-0 c-white fw-500 fsz-md">{p.name}</h3>
                  </div>
                  <div className="p-20">
                    <ul className="m-0 p-0" style={{ listStyle: 'none' }}>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-wallet c-grey-600" style={{ fontSize: 14 }} />
                        $ {p.salePrice.toLocaleString('es-CO')}/año
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-harddrive c-grey-600" style={{ fontSize: 14 }} />
                        {fmtMb(p.diskSpaceQuotaMb)} disco
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-pulse c-grey-600" style={{ fontSize: 14 }} />
                        {fmtMb(p.bandwidthLimitMb)} de banda
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-email c-grey-600" style={{ fontSize: 14 }} />
                        {fmtLimit(p.maxEmailAccounts)} cuentas email
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-world c-grey-600" style={{ fontSize: 14 }} />
                        {p.maxAddonDomains != null ? `${p.maxAddonDomains.toLocaleString()} dominios adicionales` : 'Dominios ilimitados'}
                      </li>
                      <li className={`c-grey-700 fsz-sm p-10 d-f ai-c gap-2 ${p.includedDomains === 1 ? 'fw-600' : ''}`} style={p.includedDomains === 1 ? { backgroundColor: 'rgba(255,193,7,0.12)', borderRadius: 4 } : undefined}>
                        {p.includedDomains === 1 ? (
                          <i className="ti-star c-amber-500" style={{ fontSize: 14 }} />
                        ) : (
                          <i className="ti-gift c-grey-600" style={{ fontSize: 14 }} />
                        )}
                        {p.includedDomains} dominio{p.includedDomains !== 1 ? 's' : ''} incluido{p.includedDomains !== 1 ? 's' : ''}
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-pencil c-grey-600" style={{ fontSize: 14 }} />
                        Gestor de WordPress incluido
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-package c-grey-600" style={{ fontSize: 14 }} />
                        PHP, Node.js, Python y Ruby
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-bar-chart c-grey-600" style={{ fontSize: 14 }} />
                        Métricas de visitantes incluidas
                      </li>
                      <li className="c-grey-700 fsz-sm bdB p-10 d-f ai-c gap-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <i className="ti-shield c-grey-600" style={{ fontSize: 14 }} />
                        Antivirus y protección
                      </li>
                      <li className="c-grey-700 fsz-sm p-10 d-f ai-c gap-2">
                        <i className="ti-arrow-right c-grey-600" style={{ fontSize: 14 }} />
                        Migración gratuita incluida
                      </li>
                    </ul>
                    <div className="d-f gap-2 mT-15 fxw-w">
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ color: '#fff', flex: '1 1 140px', padding: '10px 16px' }}
                        onClick={() => {
                          setContractModal(p);
                          setRequiresMigrationHelp(false);
                          setTermsAccepted(false);
                        }}
                      >
                        Lo quiero
                      </button>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Link href={`/packages/${p.id}`} className="btn btn-sm btn-outline-secondary" style={{ flex: 1 }}>
                            <i className="ti-eye mR-5" />
                            Ver
                          </Link>
                          <Link href={`/packages/${p.id}/edit`} className="btn btn-sm btn-outline-secondary" style={{ flex: 1 }}>
                            <i className="ti-pencil mR-5" />
                            Editar
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {loading ? (
            <div className="p-20 ta-c c-grey-700">Cargando...</div>
          ) : hostings.length === 0 ? (
            <div className="p-40 ta-c c-grey-700">
              <p className="mB-10">
                {user?.role === 'ADMIN' ? 'No hay hosting registrado.' : 'No tienes servidores de hosting.'}
              </p>
              {user?.role === 'ADMIN' && (
                <Link href="/hosting/new" className="btn btn-primary">
                  Crear primer hosting
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
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 100 }}
                        onClick={() => handleSort('packageName')}
                      >
                        Paquete
                        <SortIcon col="packageName" />
                      </th>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 100 }}
                        onClick={() => handleSort('username')}
                      >
                        Usuario
                        <SortIcon col="username" />
                      </th>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 140 }}
                        onClick={() => handleSort('domainFqdns')}
                      >
                        Dominios
                        <SortIcon col="domainFqdns" />
                      </th>
                      <th className="c-grey-800 ta-e" style={{ minWidth: 90 }}>
                        Disco
                      </th>
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
                        Próx. facturación
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
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 90 }}
                        onClick={() => handleSort('serviceStatus')}
                      >
                        Servicio
                        <SortIcon col="serviceStatus" />
                      </th>
                      <th className="ta-c c-grey-800" style={{ minWidth: 120 }}>
                        Acceso
                      </th>
                      {user?.role === 'ADMIN' && (
                        <th className="ta-e c-grey-800" style={{ minWidth: 90 }}>
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((h) => (
                      <tr key={h.id}>
                        {user?.role === 'ADMIN' && (
                          <td className="c-grey-800">
                            <Link href={`/clients/${h.userID}/edit`} className="td-n c-grey-800">
                              {h.clientName}
                            </Link>
                          </td>
                        )}
                        <td className="c-grey-800">
                          <span
                            className="d-ib p-5 bdrs-3 fsz-sm fw-500"
                            style={{
                              backgroundColor: (h.packageColorHex || '#6c757d') + '22',
                              color: h.packageColorHex || '#495057',
                              borderLeft: `3px solid ${h.packageColorHex || '#6c757d'}`,
                            }}
                          >
                            {h.packageName}
                          </span>
                        </td>
                        <td className="fw-500 c-grey-900">{h.username}</td>
                        <td className="c-grey-800">
                          {h.domainFqdns?.length ? (
                            <>
                              {h.domainFqdns.map((fqdn, i) => (
                                <span key={fqdn}>
                                  {i > 0 && ', '}
                                  <a
                                    href={`https://${fqdn}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="c-primary td-n fsz-sm"
                                  >
                                    {fqdn}
                                  </a>
                                </span>
                              ))}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="c-grey-800 ta-e">
                          {fmtMb(h.diskSpaceQuotaMb ?? null)}
                        </td>
                        <td className="c-grey-800 ta-e">
                          $ {h.salePrice.toLocaleString('es-CO')}
                        </td>
                        <td className="c-grey-800">
                          {dayjs(h.nextBillingDate).format('DD/MM/YYYY')}
                        </td>
                        <td>
                          <span
                            className="badge rounded-pill fsz-xs"
                            style={{
                              backgroundColor:
                                h.paymentStatus === 'PAID'
                                  ? '#20c997'
                                  : h.paymentStatus === 'OVERDUE'
                                    ? '#dc3545'
                                    : h.paymentStatus === 'CANCELLED'
                                      ? '#6c757d'
                                      : '#ffc107',
                              color: h.paymentStatus === 'PENDING' ? '#000' : '#fff',
                            }}
                          >
                            {PAYMENT_LABELS[h.paymentStatus] ?? h.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge rounded-pill fsz-xs"
                            style={{
                              backgroundColor:
                                h.serviceStatus === 'ENABLED'
                                  ? '#20c997'
                                  : h.serviceStatus === 'SUSPENDED'
                                    ? '#fd7e14'
                                    : '#6c757d',
                              color: '#fff',
                            }}
                          >
                            {SERVICE_LABELS[h.serviceStatus] ?? h.serviceStatus}
                          </span>
                        </td>
                        <td className="ta-c">
                          <div className="d-f gap-2 jc-c fxw-w">
                            {user?.role !== 'ADMIN' && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary p-8 m-0"
                                  onClick={() => setRedirectModal({ hosting: h, url: 'https://instanceshape.com/cpanel', title: 'cPanel' })}
                                  title="Acceder a cPanel"
                                >
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/static/images/cpanel.png`} alt="cPanel" width={20} height={20} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary p-8 m-0"
                                  onClick={() => setRedirectModal({ hosting: h, url: 'https://instanceshape.com/webmail', title: 'Webmail' })}
                                  title="Acceder a Webmail"
                                >
                                  <i className="ti-email" style={{ fontSize: 18 }} />
                                </button>
                              </>
                            )}
                            {h.salePrice > 0 && (
                              <Link
                                href={`/pago?tipo=renovar-hosting&hostingId=${encodeURIComponent(h.id)}`}
                                className="btn btn-sm btn-success p-8 m-0"
                                style={{ color: '#fff' }}
                                title="Renovar ahora"
                              >
                                <i className="ti-wallet" style={{ fontSize: 18 }} />
                              </Link>
                            )}
                          </div>
                        </td>
                        {user?.role === 'ADMIN' && (
                          <td className="ta-e">
                            <div className="d-f gap-2 jc-e">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary p-8 m-0"
                                onClick={() => handleSendReminder(h)}
                                disabled={!!sendingReminderId}
                                title="Enviar recordatorio de vencimiento"
                              >
                                {sendingReminderId === h.id ? (
                                  <i className="ti-reload ti-spin" style={{ fontSize: 18 }} />
                                ) : (
                                  <i className="ti-bell" style={{ fontSize: 18 }} />
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success p-8 m-0"
                                onClick={() => setRenewModal(h)}
                                title="Renovar servicio"
                              >
                                <i className="ti-plus" style={{ fontSize: 18 }} />
                              </button>
                              <Link
                                href={`/hosting/${h.id}/edit`}
                                className="btn btn-sm btn-primary"
                                style={{ color: '#fff' }}
                                title="Editar"
                              >
                                <i className="ti-pencil" />
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setDeleteModal(h)}
                                title="Eliminar"
                              >
                                <i className="ti-trash" />
                              </button>
                            </div>
                          </td>
                        )}
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

      {contractModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: contractModal.colorHex || '#6c757d', color: '#fff' }}>
                <h5 className="modal-title">Contratar plan {contractModal.name}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Cerrar"
                  onClick={() => !contractSubmitting && setContractModal(null)}
                  disabled={contractSubmitting}
                />
              </div>
              <div className="modal-body">
                <h6 className="fw-600 mB-10">Resumen del plan</h6>
                <ul className="fsz-sm c-grey-700 mB-15" style={{ listStyle: 'disc', paddingLeft: 20 }}>
                  <li>$ {contractModal.salePrice.toLocaleString('es-CO')}/año</li>
                  <li>{fmtMb(contractModal.diskSpaceQuotaMb)} disco · {fmtMb(contractModal.bandwidthLimitMb)} de banda</li>
                  <li>{fmtLimit(contractModal.maxEmailAccounts)} cuentas email</li>
                  <li>{contractModal.maxAddonDomains != null ? `${contractModal.maxAddonDomains.toLocaleString()} dominios adicionales` : 'Dominios ilimitados'}</li>
                  <li>{contractModal.includedDomains} dominio{contractModal.includedDomains !== 1 ? 's' : ''} incluido{contractModal.includedDomains !== 1 ? 's' : ''}</li>
                  <li>Gestor WordPress · PHP, Node.js, Python, Ruby</li>
                  <li>Métricas de visitantes · Antivirus · Migración gratuita</li>
                </ul>
                <p className="fsz-sm c-grey-700 mB-15">
                  Este plan incluye <strong>{fmtMb(contractModal.diskSpaceQuotaMb)} de capacidad</strong>. Te recomendamos tener un estimado del peso actual de tu web para asegurarte de que el plan cubre tus necesidades.
                </p>
                <div className="form-check mB-15">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="migrationHelp"
                    checked={requiresMigrationHelp}
                    onChange={(e) => setRequiresMigrationHelp(e.target.checked)}
                    disabled={contractSubmitting}
                  />
                  <label className="form-check-label fsz-sm" htmlFor="migrationHelp">
                    ¿Requiere asistencia durante la migración?
                  </label>
                </div>
                <div className="form-check mB-15">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="termsAccepted"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    disabled={contractSubmitting}
                  />
                  <label className="form-check-label fsz-sm" htmlFor="termsAccepted">
                    He leído los{' '}
                    <Link href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="c-primary td-u">
                      términos y condiciones
                    </Link>
                  </label>
                </div>
                <p className="fsz-sm c-grey-700 mB-10">
                  Precio: <strong>$ {contractModal.salePrice.toLocaleString('es-CO')}/año</strong>. Al confirmar, serás redirigido a la pasarela de pago.
                </p>
                <div className="p-15 bdrs-3 mB-15" style={{ backgroundColor: 'rgba(32,201,151,0.12)', border: '1px solid rgba(32,201,151,0.3)' }}>
                  <p className="m-0 fsz-sm c-grey-800">
                    <i className="ti-info-alt mR-5" />
                    No te preocupes: puedes subir la categoría de tu servidor cuando quieras y solo pagas la diferencia.
                  </p>
                </div>
              </div>
              <div className="modal-footer d-f gap-2 fxw-w">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setContractModal(null)}
                  disabled={contractSubmitting}
                >
                  Cancelar
                </button>
                {contractModal.salePrice > 0 && (
                  <Link
                    href={`/pago?tipo=contratar-hosting&packageId=${encodeURIComponent(contractModal.id)}`}
                    className="btn btn-success d-f ai-c gap-2"
                    style={{ color: '#fff' }}
                    onClick={() => setContractModal(null)}
                  >
                    <i className="ti-wallet" />
                    Pagar ahora
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ color: '#fff' }}
                  disabled={!termsAccepted || contractSubmitting}
                  onClick={async () => {
                    if (!termsAccepted || !contractModal) return;
                    setContractSubmitting(true);
                    try {
                      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
                      const planSummary = [
                        `$ ${contractModal.salePrice.toLocaleString('es-CO')}/año`,
                        `${fmtMb(contractModal.diskSpaceQuotaMb)} disco`,
                        `${fmtMb(contractModal.bandwidthLimitMb)} de banda`,
                        `${fmtLimit(contractModal.maxEmailAccounts)} cuentas email`,
                        contractModal.maxAddonDomains != null ? `${contractModal.maxAddonDomains.toLocaleString()} dominios adicionales` : 'Dominios ilimitados',
                        `${contractModal.includedDomains} dominio(s) incluido(s)`,
                        'Gestor WordPress, PHP, Node.js, Python, Ruby',
                        'Métricas, antivirus, migración gratuita',
                      ].join(' · ');
                      const res = await fetch(`${basePath}/api/hosting/request-service`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          packageID: contractModal.id,
                          packageName: contractModal.name,
                          salePrice: contractModal.salePrice,
                          currency: contractModal.currency,
                          requiresMigrationHelp,
                          planSummary,
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        alert(data.error || 'Error al enviar la solicitud');
                        return;
                      }
                      alert(data.message || 'Solicitud enviada correctamente.');
                      setContractModal(null);
                    } catch {
                      alert('Error de conexión');
                    } finally {
                      setContractSubmitting(false);
                    }
                  }}
                >
                  {contractSubmitting ? 'Enviando...' : 'Contratar servicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {redirectModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div
                className="modal-header d-f ai-c gap-2"
                style={{
                  backgroundColor: redirectModal.title === 'cPanel' ? '#ff6c2c' : '#0d6efd',
                  color: '#fff',
                }}
              >
                {redirectModal.title === 'cPanel' ? (
                  <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/static/images/cpanel.png`} alt="cPanel" width={28} height={28} />
                ) : (
                  <i className="ti-email" style={{ fontSize: 24 }} />
                )}
                <h5 className="modal-title m-0">Acceso a {redirectModal.title}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  aria-label="Cerrar"
                  onClick={() => setRedirectModal(null)}
                />
              </div>
              <div className="modal-body ta-c p-30">
                <p className="c-grey-800 fsz-md mB-15">
                  A continuación será redirigido al inicio de sesión de {redirectModal.title}.
                </p>
                {redirectModal.title === 'cPanel' && (
                  <div className="ta-l mB-20 p-15 bdrs-3" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                    <p className="c-grey-800 fsz-sm m-0">
                      Usuario: <strong className="c-grey-900">{redirectModal.hosting.username}</strong>
                    </p>
                  </div>
                )}
                <div className="d-f jc-c ai-c gap-2">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <span className="c-grey-600 fsz-sm">Redirigiendo en 5 segundos...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  Renovar servicio
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
                  ¿Extender la vigencia de este hosting por un año adicional? El servicio de{' '}
                  <strong>{renewModal.clientName}</strong> ({renewModal.username}) se mantendrá activo sin interrupciones.
                </p>
                <div className="p-15 bdrs-3 mB-0" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
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
                  ¿Estás seguro de que deseas eliminar el hosting <strong>{deleteModal.username}</strong> de{' '}
                  <strong>{deleteModal.clientName}</strong>? Esta acción no se puede deshacer.
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
