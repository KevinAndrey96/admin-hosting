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
  salePrice: number;
  currency: string;
  domainIDs: string[];
  domainFqdns: string[];
  username: string;
  nextBillingDate: string;
  paymentStatus: string;
  serviceStatus: string;
};

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
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteModal, setDeleteModal] = useState<Hosting | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

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

    if (user?.role === 'ADMIN') {
      fetchHostings();
    }
  }, [user?.role]);

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
        (h.planName?.toLowerCase().includes(q)) ||
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

  if (sessionLoading || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: '#fff', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20">
          <div className="col-12 d-f jc-sb ai-c">
            <div>
              <h4 className="m-0 c-grey-900">Hosting</h4>
              <p className="c-grey-700 fsz-sm mT-5">Gestiona los planes de hosting de tus clientes</p>
            </div>
            <Link href="/hosting/new" className="btn btn-primary">
              <i className="ti-plus mR-5" />
              Nuevo hosting
            </Link>
          </div>
        </div>

        <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {loading ? (
            <div className="p-20 ta-c c-grey-700">Cargando...</div>
          ) : hostings.length === 0 ? (
            <div className="p-40 ta-c c-grey-700">
              <p className="mB-10">No hay hosting registrado.</p>
              <Link href="/hosting/new" className="btn btn-primary">
                Crear primer hosting
              </Link>
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
                        style={{ minWidth: 140 }}
                        onClick={() => handleSort('clientName')}
                      >
                        Cliente
                        <SortIcon col="clientName" />
                      </th>
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
                      <th className="ta-e c-grey-800" style={{ minWidth: 90 }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((h) => (
                      <tr key={h.id}>
                        <td className="c-grey-800">
                          <Link href={`/clients/${h.userID}/edit`} className="td-n c-grey-800">
                            {h.clientName}
                          </Link>
                        </td>
                        <td className="c-grey-800">{h.packageName}</td>
                        <td className="fw-500 c-grey-900">{h.username}</td>
                        <td className="c-grey-800">
                          {h.domainFqdns?.length ? h.domainFqdns.join(', ') : '—'}
                        </td>
                        <td className="c-grey-800 ta-e">
                          {h.currency} {h.salePrice.toLocaleString()}
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
                        <td className="ta-e">
                          <div className="d-f gap-2 jc-e">
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
