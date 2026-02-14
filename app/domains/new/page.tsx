'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { useSession } from '../../hooks/useSession';

type Client = { id: string; fullName: string; email: string; role?: string };

export default function NewDomainPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [userID, setUserID] = useState('');
  const [registrarName, setRegistrarName] = useState('Spaceship');
  const [fqdn, setFqdn] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [renewalDate, setRenewalDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [serviceStatus, setServiceStatus] = useState('ACTIVE');
  const [transferLock, setTransferLock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchData = async () => {
      try {
        const clientsRes = await fetch(`${basePath}/api/clients`, { credentials: 'include' });
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          const clientsOnly = clientsData.filter((c: Client) => c.role === 'CLIENT');
          setClients(clientsOnly);
          if (clientsOnly.length === 1) setUserID(clientsOnly[0].id);
        }
      } catch {
        setMessage({ type: 'error', text: 'Error al cargar datos' });
      }
    };
    if (user?.role === 'ADMIN') fetchData();
  }, [user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!userID) {
      setMessage({ type: 'error', text: 'Selecciona un cliente.' });
      return;
    }
    if (!registrarName.trim()) {
      setMessage({ type: 'error', text: 'El registrador es requerido.' });
      return;
    }
    if (!fqdn.trim()) {
      setMessage({ type: 'error', text: 'El dominio (FQDN) es requerido.' });
      return;
    }
    const saleNum = parseFloat(salePrice);
    if (isNaN(saleNum) || saleNum < 0) {
      setMessage({ type: 'error', text: 'El precio debe ser un número válido.' });
      return;
    }
    setSaving(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userID,
          registrarName: registrarName.trim(),
          fqdn: fqdn.trim().toLowerCase(),
          salePrice: saleNum,
          currency: currency || 'COP',
          renewalDate: renewalDate || undefined,
          paymentStatus,
          serviceStatus,
          transferLock,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al crear dominio.' });
        return;
      }

      setMessage({ type: 'success', text: data.message || 'Dominio creado correctamente.' });
      setTimeout(() => router.push('/domains'), 1500);
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
        className="container-fluid d-f fxd-c ai-c jc-c"
        style={{ background: '#f8f9fa', minHeight: '100%', padding: '32px' }}
      >
        <div
          className="card w-100"
          style={{
            maxWidth: 560,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: 'none',
            borderRadius: 12,
          }}
        >
          <div className="card-body p-30">
            <Link href="/domains" className="c-primary fsz-sm td-n d-ib fw-500 mB-15">
              ← Volver a dominios
            </Link>
            <h4 className="m-0 c-grey-900 fw-600">Nuevo dominio</h4>
            <p className="c-grey-600 fsz-sm mT-5 mB-25">Registra un nuevo dominio para un cliente</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="userID" className="form-label fw-500">
                  Cliente *
                </label>
                <select
                  className="form-select form-select-lg"
                  id="userID"
                  value={userID}
                  onChange={(e) => setUserID(e.target.value)}
                  required
                  disabled={saving}
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="registrarName" className="form-label fw-500">
                  Registrador *
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="registrarName"
                  value={registrarName}
                  onChange={(e) => setRegistrarName(e.target.value)}
                  placeholder="Spaceship"
                  required
                  disabled={saving}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="fqdn" className="form-label fw-500">
                  Dominio (FQDN) *
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="fqdn"
                  value={fqdn}
                  onChange={(e) => setFqdn(e.target.value)}
                  placeholder="ejemplo.com"
                  required
                  disabled={saving}
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="salePrice" className="form-label fw-500">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    id="salePrice"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="currency" className="form-label fw-500">
                    Moneda
                  </label>
                  <select
                    className="form-select"
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={saving}
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="renewalDate" className="form-label fw-500">
                  Fecha de renovación / facturación
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="renewalDate"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="paymentStatus" className="form-label fw-500">
                    Estado pago
                  </label>
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
                  <label htmlFor="serviceStatus" className="form-label fw-500">
                    Estado servicio
                  </label>
                  <select
                    className="form-select"
                    id="serviceStatus"
                    value={serviceStatus}
                    onChange={(e) => setServiceStatus(e.target.value)}
                    disabled={saving}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="AT_RISK">En riesgo</option>
                    <option value="EXPIRED">Expirado</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="transferLock"
                    checked={transferLock}
                    onChange={(e) => setTransferLock(e.target.checked)}
                    disabled={saving}
                  />
                  <label className="form-check-label" htmlFor="transferLock">
                    Bloqueo de dominio
                  </label>
                </div>
              </div>

              {message && (
                <div
                  className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mB-20`}
                  role="alert"
                >
                  {message.text}
                </div>
              )}
              <div className="d-f gap-3 mT-25 jc-c">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ color: '#fff', padding: '14px 32px', fontWeight: 600 }}
                >
                  <i className="ti-plus mR-5" />
                  {saving ? 'Creando...' : 'Crear dominio'}
                </button>
                <Link
                  href="/domains"
                  className="btn btn-outline-secondary"
                  style={{ color: '#6c757d', borderColor: '#6c757d', padding: '14px 32px' }}
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
