'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { useSession } from '../../../hooks/useSession';
import dayjs from 'dayjs';

type PackageData = {
  id: string;
  name: string;
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

type Hosting = {
  id: string;
  packageID: string;
  clientName: string;
  clientEmail: string;
  username: string;
  domainFqdns: string[];
  nextBillingDate: string;
  paymentStatus: string;
  serviceStatus: string;
};

function fmtLimit(v: number | null): string {
  return v != null ? v.toLocaleString() : 'Ilimitado';
}

function fmtMb(mb: number | null): string {
  if (mb == null) return 'Ilimitado';
  return `${mb.toLocaleString()} MB`;
}

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

export default function PackageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: sessionLoading } = useSession();
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchData = async () => {
      try {
        const [pkgRes, hostingRes] = await Promise.all([
          fetch(`${basePath}/api/packages/${id}`, { credentials: 'include' }),
          fetch(`${basePath}/api/hosting`, { credentials: 'include' }),
        ]);
        if (pkgRes.ok) {
          const data = await pkgRes.json();
          setPkg(data);
        } else {
          setPkg(null);
        }
        if (hostingRes.ok) {
          const allHostings = await hostingRes.json();
          setHostings(allHostings.filter((h: Hosting) => h.packageID === id));
        }
      } catch {
        setPkg(null);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN' && id) {
      fetchData();
    }
  }, [user?.role, id]);

  const handleDelete = async () => {
    if (!pkg || pkg.hostingCount > 0) return;
    setDeleting(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/packages/${pkg.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push('/packages');
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeleting(false);
    }
  };

  if (sessionLoading || user?.role !== 'ADMIN') return null;

  if (loading || !pkg) {
    return (
      <AdminLayout>
        <div className="container-fluid p-40 ta-c c-grey-600">
          {loading ? 'Cargando...' : 'Paquete no encontrado.'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: '#fff', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20">
          <div className="col-12 d-f jc-sb ai-c fxw-w gap-3">
            <div>
              <Link href="/packages" className="c-primary fsz-sm td-n mB-10 d-ib fw-500">
                ← Volver a paquetes
              </Link>
              <h4 className="m-0 mT-5 c-grey-900">{pkg.name}</h4>
              <p className="c-grey-700 fsz-sm mT-5">
                $ {pkg.salePrice.toLocaleString('es-CO')} · {pkg.hostingCount} hosting{pkg.hostingCount !== 1 ? 's' : ''} usando este paquete
              </p>
            </div>
            <div className="d-f gap-2">
              <Link href={`/packages/${pkg.id}/edit`} className="btn btn-primary" style={{ color: '#fff' }}>
                <i className="ti-pencil mR-5" />
                Editar
              </Link>
              {pkg.hostingCount === 0 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => setDeleteModal(true)}
                >
                  <i className="ti-trash mR-5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6 mB-20">
            <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h6 className="c-grey-800 mB-15">Información del paquete</h6>
              <table className="table table-sm table-borderless m-0">
                <tbody>
                  <tr>
                    <td className="c-grey-600" style={{ width: 180 }}>Precio</td>
                    <td className="fw-500">$ {pkg.salePrice.toLocaleString('es-CO')}</td>
                  </tr>
                  <tr>
                    <td className="c-grey-600">Disco</td>
                    <td>{fmtMb(pkg.diskSpaceQuotaMb)}</td>
                  </tr>
                  <tr>
                    <td className="c-grey-600">Ancho de banda</td>
                    <td>{fmtMb(pkg.bandwidthLimitMb)}</td>
                  </tr>
                  <tr>
                    <td className="c-grey-600">Cuentas email</td>
                    <td>{fmtLimit(pkg.maxEmailAccounts)}</td>
                  </tr>
                  <tr>
                    <td className="c-grey-600">D. Adicionales</td>
                    <td>{fmtLimit(pkg.maxAddonDomains)}</td>
                  </tr>
                  <tr>
                    <td className="c-grey-600">Dominios incluidos</td>
                    <td>{pkg.includedDomains}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="bd bgc-white bdrs-3 p-20" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h6 className="c-grey-800 mB-15">Hostings con este paquete</h6>
              {hostings.length === 0 ? (
                <p className="c-grey-600 m-0">Ningún hosting usa este paquete.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover table-bordered">
                    <thead>
                      <tr>
                        <th className="c-grey-800">Cliente</th>
                        <th className="c-grey-800">Usuario / cPanel</th>
                        <th className="c-grey-800">Dominios</th>
                        <th className="c-grey-800">Próx. facturación</th>
                        <th className="c-grey-800">Estado pago</th>
                        <th className="c-grey-800">Estado servicio</th>
                        <th className="ta-e c-grey-800">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostings.map((h) => (
                        <tr key={h.id}>
                          <td>
                            <span className="fw-500">{h.clientName}</span>
                            <br />
                            <span className="fsz-sm c-grey-600">{h.clientEmail}</span>
                          </td>
                          <td>{h.username}</td>
                          <td>
                            {h.domainFqdns?.length ? (
                              h.domainFqdns.join(', ')
                            ) : (
                              <span className="c-grey-500">—</span>
                            )}
                          </td>
                          <td>{h.nextBillingDate ? dayjs(h.nextBillingDate).format('DD/MM/YYYY') : '—'}</td>
                          <td>{PAYMENT_LABELS[h.paymentStatus] ?? h.paymentStatus}</td>
                          <td>{SERVICE_LABELS[h.serviceStatus] ?? h.serviceStatus}</td>
                          <td className="ta-e">
                            <Link
                              href={`/hosting/${h.id}/edit`}
                              className="btn btn-sm btn-primary"
                              style={{ color: '#fff' }}
                              title="Editar hosting"
                            >
                              <i className="ti-pencil" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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
                  onClick={() => !deleting && setDeleteModal(false)}
                  disabled={deleting}
                />
              </div>
              <div className="modal-body">
                <p className="m-0">
                  ¿Estás seguro de que deseas eliminar el paquete <strong>{pkg.name}</strong>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModal(false)}
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
