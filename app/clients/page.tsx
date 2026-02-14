'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';

type Client = {
  id: string;
  userID?: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  address: string | null;
  zipCode: string | null;
  status: string;
  domainsCount: number;
  hostingCount: number;
  createdAt: string;
};

type SortKey = 'fullName' | 'companyName' | 'email' | 'phone' | 'role' | 'domainsCount' | 'hostingCount' | 'status' | '';
type SortDir = 'asc' | 'desc';

export default function ClientsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteModal, setDeleteModal] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  const handleStatusToggle = async (client: Client) => {
    if (client.id === user?.id) return;
    const newStatus = client.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    setTogglingStatusId(client.id);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === client.id ? { ...c, status: newStatus } : c))
        );
      }
    } catch {
      // Silently fail or could show toast
    } finally {
      setTogglingStatusId(null);
    }
  };

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/clients`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setClients(data.filter((c: Client) => c.role === 'CLIENT'));
        }
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN') {
      fetchClients();
    }
  }, [user?.role]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.zipCode && c.zipCode.includes(q)) ||
        c.role.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal ?? '').localeCompare(String(bVal ?? ''));
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
      const res = await fetch(`${basePath}/api/clients/${deleteModal.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== deleteModal.id));
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

  if (sessionLoading || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: '#fff', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20">
          <div className="col-12 d-f jc-sb ai-c">
            <div>
              <h4 className="m-0 c-grey-900">Clientes</h4>
              <p className="c-grey-700 fsz-sm mT-5">Gestiona los usuarios de tu negocio</p>
            </div>
            <Link href="/clients/new" className="btn btn-primary">
              <i className="ti-plus mR-5" />
              Nuevo cliente
            </Link>
          </div>
        </div>

        <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {loading ? (
            <div className="p-20 ta-c c-grey-700">Cargando...</div>
          ) : clients.length === 0 ? (
            <div className="p-40 ta-c c-grey-700">
              <p className="mB-10">No hay usuarios registrados.</p>
              <Link href="/clients/new" className="btn btn-primary">
                Crear primer cliente
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
                <table className="table table-striped table-hover table-bordered" id="clientsDataTable">
                  <thead>
                    <tr>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 140 }}
                        onClick={() => handleSort('fullName')}
                      >
                        Nombre
                        <SortIcon col="fullName" />
                      </th>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 140 }}
                        onClick={() => handleSort('companyName')}
                      >
                        Razón social
                        <SortIcon col="companyName" />
                      </th>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 180 }}
                        onClick={() => handleSort('email')}
                      >
                        Correo
                        <SortIcon col="email" />
                      </th>
                      <th
                        className="c-grey-800 cur-p"
                        style={{ minWidth: 110 }}
                        onClick={() => handleSort('phone')}
                      >
                        Teléfono
                        <SortIcon col="phone" />
                      </th>
                      <th className="c-grey-800 cur-p" style={{ minWidth: 90 }} onClick={() => handleSort('role')}>
                        Rol
                        <SortIcon col="role" />
                      </th>
                      <th
                        className="c-grey-800 cur-p ta-c"
                        style={{ minWidth: 80 }}
                        onClick={() => handleSort('domainsCount')}
                      >
                        Dominios
                        <SortIcon col="domainsCount" />
                      </th>
                      <th
                        className="c-grey-800 cur-p ta-c"
                        style={{ minWidth: 80 }}
                        onClick={() => handleSort('hostingCount')}
                      >
                        Hosting
                        <SortIcon col="hostingCount" />
                      </th>
                      <th className="c-grey-800 cur-p" style={{ minWidth: 100 }} onClick={() => handleSort('status')}>
                        Estado
                        <SortIcon col="status" />
                      </th>
                      <th className="ta-e c-grey-800" style={{ minWidth: 90 }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-500 c-grey-900">{c.fullName}</td>
                        <td className="c-grey-800">{c.companyName || '—'}</td>
                        <td className="c-grey-800">{c.email}</td>
                        <td className="c-grey-800">{c.phone || '—'}</td>
                        <td>
                          <span
                            className="badge rounded-pill fsz-xs"
                            style={{
                              backgroundColor: c.role === 'ADMIN' ? '#dc3545' : '#20c997',
                              color: '#fff',
                            }}
                          >
                            {c.role === 'ADMIN' ? 'Admin' : 'Cliente'}
                          </span>
                        </td>
                        <td className="c-grey-800 ta-c">{c.domainsCount}</td>
                        <td className="c-grey-800 ta-c">{c.hostingCount}</td>
                        <td>
                          <div
                            className="form-check form-switch d-f ai-c gap-2"
                            style={{ margin: 0, minHeight: 24 }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`status-${c.id}`}
                              checked={c.status === 'ENABLED'}
                              onChange={() => handleStatusToggle(c)}
                              disabled={
                                togglingStatusId === c.id || c.userID === user?.id
                              }
                              title={
                                c.userID === user?.id
                                  ? 'No puedes cambiar tu propio estado'
                                  : c.status === 'ENABLED'
                                    ? 'Deshabilitar'
                                    : 'Habilitar'
                              }
                            />
                            <label
                              className="form-check-label fsz-sm c-grey-700 m-0"
                              htmlFor={`status-${c.id}`}
                            >
                              {togglingStatusId === c.id
                                ? 'Actualizando...'
                                : c.status === 'ENABLED'
                                  ? 'Habilitado'
                                  : 'Deshabilitado'}
                            </label>
                          </div>
                        </td>
                        <td className="ta-e">
                          <div className="d-f gap-2 jc-e">
                            <Link
                              href={`/clients/${c.id}/edit`}
                              className="btn btn-sm btn-primary"
                              style={{ color: '#fff' }}
                              title="Editar"
                            >
                              <i className="ti-pencil" />
                            </Link>
                            {c.userID !== user?.id && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setDeleteModal(c)}
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
                  ¿Estás seguro de que deseas eliminar a <strong>{deleteModal.fullName}</strong> ({deleteModal.email})?
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
