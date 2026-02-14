'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { useSession } from '../../hooks/useSession';

type Client = { id: string; fullName: string; email: string; role?: string };
type Domain = { id: string; fqdn: string; userID: string };
type Package = { id: string; name: string; salePrice: number; currency: string };

export default function NewHostingPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [userID, setUserID] = useState('');
  const [packageID, setPackageID] = useState('');
  const [domainIDs, setDomainIDs] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [serviceStatus, setServiceStatus] = useState('ENABLED');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchClients = async () => {
      try {
        const res = await fetch(`${basePath}/api/clients`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const clientsOnly = data.filter((c: Client) => c.role === 'CLIENT');
          setClients(clientsOnly);
          if (clientsOnly.length === 1) setUserID(clientsOnly[0].id);
        }
      } catch {
        setMessage({ type: 'error', text: 'Error al cargar clientes' });
      }
    };
    if (user?.role === 'ADMIN') fetchClients();
  }, [user?.role]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchPackages = async () => {
      try {
        const res = await fetch(`${basePath}/api/packages`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
          if (data.length === 1) setPackageID(data[0].id);
        }
      } catch {
        setMessage({ type: 'error', text: 'Error al cargar paquetes' });
      }
    };
    if (user?.role === 'ADMIN') fetchPackages();
  }, [user?.role]);

  useEffect(() => {
    if (!userID) {
      setDomains([]);
      setDomainIDs([]);
      return;
    }
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchDomains = async () => {
      try {
        const res = await fetch(`${basePath}/api/domains`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const userDomains = data.filter((d: Domain) => d.userID === userID);
          setDomains(userDomains);
          setDomainIDs([]);
        }
      } catch {
        setDomains([]);
      }
    };
    fetchDomains();
  }, [userID]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!userID) {
      setMessage({ type: 'error', text: 'Selecciona un cliente.' });
      return;
    }
    if (!packageID) {
      setMessage({ type: 'error', text: 'Selecciona un paquete.' });
      return;
    }
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'El usuario/cpanel es requerido.' });
      return;
    }
    setSaving(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/hosting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userID,
          packageID,
          domainIDs: domainIDs.length ? domainIDs : undefined,
          username: username.trim(),
          nextBillingDate: nextBillingDate || undefined,
          paymentStatus,
          serviceStatus,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al crear hosting.' });
        return;
      }

      setMessage({ type: 'success', text: data.message || 'Hosting creado correctamente.' });
      setTimeout(() => router.push('/hosting'), 1500);
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div
        className="container-fluid d-f fxd-c ai-c"
        style={{ background: '#fff', minHeight: '100%', padding: '24px' }}
      >
        <div className="row mB-20 w-100" style={{ maxWidth: 640 }}>
          <div className="col-12">
            <Link href="/hosting" className="c-primary fsz-sm td-n mB-10 d-ib fw-500">
              ← Volver a hosting
            </Link>
            <h4 className="m-0 mT-5 c-grey-900">Nuevo hosting</h4>
            <p className="c-grey-700 fsz-sm mT-5">Registra un plan de hosting para un cliente</p>
          </div>
        </div>

        <div className="row w-100" style={{ maxWidth: 640 }}>
          <div className="col-12">
            <div className="bd bgc-white p-30 bdrs-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="userID" className="form-label fw-500">Cliente *</label>
                  <select
                    className="form-select"
                    id="userID"
                    value={userID}
                    onChange={(e) => setUserID(e.target.value)}
                    required
                    disabled={saving}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="packageID" className="form-label fw-500">Paquete *</label>
                  <select
                    className="form-select"
                    id="packageID"
                    value={packageID}
                    onChange={(e) => setPackageID(e.target.value)}
                    required
                    disabled={saving || packages.length === 0}
                  >
                    <option value="">Seleccionar paquete</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — $ {p.salePrice.toLocaleString('es-CO')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Dominios asociados</label>
                  <div className="border rounded p-3" style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {domains.length === 0 ? (
                      <span className="c-grey-600 fsz-sm">
                        {userID ? 'Este cliente no tiene dominios.' : 'Selecciona un cliente primero.'}
                      </span>
                    ) : (
                      domains.map((d) => (
                        <div key={d.id} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`domain-${d.id}`}
                            checked={domainIDs.includes(d.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDomainIDs((prev) => [...prev, d.id]);
                              } else {
                                setDomainIDs((prev) => prev.filter((id) => id !== d.id));
                              }
                            }}
                            disabled={saving}
                          />
                          <label className="form-check-label" htmlFor={`domain-${d.id}`}>
                            {d.fqdn}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label fw-500">Usuario / cPanel *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="usuario123"
                      required
                      disabled={saving}
                    />
                </div>
                <div className="mb-3">
                  <label htmlFor="nextBillingDate" className="form-label">Próxima facturación</label>
                  <input
                    type="date"
                    className="form-control"
                    id="nextBillingDate"
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="paymentStatus" className="form-label">Estado pago</label>
                    <select
                      className="form-select"
                      id="paymentStatus"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      disabled={saving}
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="PAID">Pagado</option>
                      <option value="OVERDUE">Vencido</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="serviceStatus" className="form-label">Estado servicio</label>
                    <select
                      className="form-select"
                      id="serviceStatus"
                      value={serviceStatus}
                      onChange={(e) => setServiceStatus(e.target.value)}
                      disabled={saving}
                    >
                      <option value="ENABLED">Activo</option>
                      <option value="SUSPENDED">Suspendido</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>
                </div>
                {message && (
                  <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mB-20`} role="alert">
                    {message.text}
                  </div>
                )}
                <div className="d-f gap-3 mT-20 jc-c">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ color: '#fff', padding: '14px 32px', fontWeight: 600 }}
                  >
                    <i className="ti-plus mR-5" />
                    {saving ? 'Creando...' : 'Crear hosting'}
                  </button>
                  <Link href="/hosting" className="btn btn-outline-secondary" style={{ padding: '14px 32px' }}>
                    Cancelar
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
