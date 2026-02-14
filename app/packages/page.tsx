'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';

type Package = {
  id: string;
  name: string;
  colorHex?: string | null;
  salePrice: number;
  currency: string;
  diskSpaceQuotaMb: number | null;
  bandwidthLimitMb: number | null;
  maxEmailAccounts: number | null;
  maxParkedDomains: number | null;
  maxAddonDomains: number | null;
  includedDomains: number;
  hostingCount: number;
};

function fmtLimit(v: number | null): string {
  return v != null ? v.toLocaleString() : 'Ilimitado';
}

function fmtMb(mb: number | null): string {
  if (mb == null) return 'Ilimitado';
  return `${mb.toLocaleString()} MB`;
}

export default function PackagesPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'salePrice' | 'diskSpaceQuotaMb' | 'hostingCount' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [deleteModal, setDeleteModal] = useState<Package | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN') {
      fetchPackages();
    }
  }, [user?.role]);

  const filteredData = useMemo(() => {
    let list = packages;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.salePrice).includes(q)
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        if (sortKey === 'name') {
          const sa = String(a.name).toLowerCase();
          const sb = String(b.name).toLowerCase();
          return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
        }
        const va = a[sortKey as keyof Package] as number | null;
        const vb = b[sortKey as keyof Package] as number | null;
        const na = va == null ? Infinity : va;
        const nb = vb == null ? Infinity : vb;
        const cmp = na < nb ? -1 : na > nb ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [packages, search, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/packages/${deleteModal.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPackages((prev) => prev.filter((p) => p.id !== deleteModal.id));
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

  if (sessionLoading || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: '#fff', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20">
          <div className="col-12 d-f jc-sb ai-c">
            <div>
              <h4 className="m-0 c-grey-900">Paquetes</h4>
              <p className="c-grey-700 fsz-sm mT-5">Planes de hosting (recursos y precios)</p>
            </div>
            <Link href="/packages/new" className="btn btn-primary">
              <i className="ti-plus mR-5" />
              Nuevo paquete
            </Link>
          </div>
        </div>

        <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {loading ? (
            <div className="p-20 ta-c c-grey-700">Cargando...</div>
          ) : packages.length === 0 ? (
            <div className="p-40 ta-c c-grey-700">
              <p className="mB-10">No hay paquetes.</p>
              <Link href="/packages/new" className="btn btn-primary">
                Crear primer paquete
              </Link>
            </div>
          ) : (
            <>
              <div className="d-f fxw-w jc-sb ai-c mB-20 gap-3">
                <div className="d-f ai-c gap-2">
                  <label className="c-grey-700 fsz-sm m-0">Buscar:</label>
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    style={{ width: 220 }}
                    placeholder="Filtrar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered">
                  <thead>
                    <tr>
                      <th className="c-grey-800" style={{ minWidth: 120 }}>
                        <button type="button" className="btn btn-link p-0 fw-500 c-grey-800 td-n" onClick={() => toggleSort('name')}>
                          Nombre {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th className="c-grey-800 ta-e" style={{ minWidth: 100 }}>
                        <button type="button" className="btn btn-link p-0 fw-500 c-grey-800 td-n" onClick={() => toggleSort('salePrice')}>
                          Precio {sortKey === 'salePrice' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th className="c-grey-800 ta-e" style={{ minWidth: 90 }}>
                        <button type="button" className="btn btn-link p-0 fw-500 c-grey-800 td-n" onClick={() => toggleSort('diskSpaceQuotaMb')}>
                          Disco {sortKey === 'diskSpaceQuotaMb' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th className="c-grey-800 ta-e" style={{ minWidth: 90 }}>BW</th>
                      <th className="c-grey-800" style={{ minWidth: 90 }}>Emails</th>
                      <th className="c-grey-800" style={{ minWidth: 100 }}>D. Adicionales</th>
                      <th className="c-grey-800 ta-e" style={{ minWidth: 100 }}>Dominios Incluidos</th>
                      <th className="c-grey-800 ta-e" style={{ minWidth: 70 }}>
                        <button type="button" className="btn btn-link p-0 fw-500 c-grey-800 td-n" onClick={() => toggleSort('hostingCount')}>
                          Hostings {sortKey === 'hostingCount' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th className="ta-e c-grey-800" style={{ minWidth: 90 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-500">
                          <Link
                            href={`/packages/${p.id}`}
                            className="btn btn-sm btn-outline-secondary td-n"
                            style={{
                              borderColor: p.colorHex || '#6c757d',
                              color: p.colorHex || '#6c757d',
                              backgroundColor: p.colorHex ? `${p.colorHex}12` : undefined,
                            }}
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="c-grey-800 ta-e">
                          $ {p.salePrice.toLocaleString('es-CO')}
                        </td>
                        <td className="c-grey-800 ta-e">{fmtMb(p.diskSpaceQuotaMb)}</td>
                        <td className="c-grey-800 ta-e">{fmtMb(p.bandwidthLimitMb)}</td>
                        <td className="c-grey-800">{fmtLimit(p.maxEmailAccounts)}</td>
                        <td className="c-grey-800">{fmtLimit(p.maxAddonDomains)}</td>
                        <td className="c-grey-800 ta-e">{p.includedDomains}</td>
                        <td className="c-grey-800 ta-e">{p.hostingCount}</td>
                        <td className="ta-e">
                          <div className="d-f gap-2 jc-e">
                            <Link
                              href={`/packages/${p.id}/edit`}
                              className="btn btn-sm btn-primary"
                              style={{ color: '#fff' }}
                              title="Editar"
                            >
                              <i className="ti-pencil" />
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDeleteModal(p)}
                              title="Eliminar"
                              disabled={p.hostingCount > 0}
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
                  ¿Estás seguro de que deseas eliminar el paquete <strong>{deleteModal.name}</strong>?
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
