'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { useSession } from '../../hooks/useSession';

type Client = { id: string; fullName: string; email: string; role?: string };
type Package = { id: string; name: string; salePrice: number; currency: string };

export default function NewDomainPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [userID, setUserID] = useState('');
  const [registrarName, setRegistrarName] = useState('Spaceship');
  const [fqdn, setFqdn] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [renewalDate, setRenewalDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [transferLock, setTransferLock] = useState(true);
  const [registerInSpaceship, setRegisterInSpaceship] = useState(false);
  const [createHostingWithPackage, setCreateHostingWithPackage] = useState(false);
  const [hostingPackageID, setHostingPackageID] = useState('');
  const [packages, setPackages] = useState<Package[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    price: number | null;
    currency: string;
    error?: string;
  } | null>(null);

  const formatPrice = (value: number, currency: string) => {
    const rounded = Math.round(value);
    const withSeparator = rounded.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return currency === 'COP' ? `$ ${withSeparator}` : `${currency} ${withSeparator}`;
  };

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    if (registerInSpaceship) setRegistrarName('Spaceship');
  }, [registerInSpaceship]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchData = async () => {
      try {
        const [clientsRes, packagesRes] = await Promise.all([
          fetch(`${basePath}/api/clients`, { credentials: 'include' }),
          fetch(`${basePath}/api/packages`, { credentials: 'include' }),
        ]);
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          const clientsOnly = clientsData.filter((c: Client) => c.role === 'CLIENT');
          setClients(clientsOnly);
          if (clientsOnly.length === 1) setUserID(clientsOnly[0].id);
        }
        if (packagesRes.ok) {
          const packagesData = await packagesRes.json();
          setPackages(packagesData);
          if (packagesData.length === 1) setHostingPackageID(packagesData[0].id);
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
    if (createHostingWithPackage && !hostingPackageID.trim()) {
      setMessage({ type: 'error', text: 'Selecciona un paquete de hosting.' });
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
          transferLock,
          registerInSpaceship,
          createHostingWithPackage: createHostingWithPackage || undefined,
          hostingPackageID: createHostingWithPackage ? hostingPackageID.trim() : undefined,
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

  const handleVerify = async () => {
    const domainToCheck = fqdn.trim().toLowerCase();
    if (!domainToCheck) {
      setMessage({ type: 'error', text: 'Escribe un dominio para verificar.' });
      return;
    }
    setMessage(null);
    setAvailability(null);
    setVerifying(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(
        `${basePath}/api/domains/check-availability?domain=${encodeURIComponent(domainToCheck)}`,
        { credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAvailability({
          available: false,
          price: null,
          currency: 'COP',
          error: data.error || 'Error al verificar.',
        });
        return;
      }
      setAvailability({
        available: data.available === true,
        price: data.price ?? null,
        currency: data.currency || 'COP',
      });
    } catch {
      setAvailability({
        available: false,
        price: null,
        currency: 'COP',
        error: 'Error de conexión.',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (sessionLoading || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div
        className="container-fluid d-f fxd-c ai-c jc-c"
        style={{ background: 'var(--c-bkg-body)', minHeight: '100%', padding: '32px' }}
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
                <div className="form-check mB-10">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="registerInSpaceship"
                    checked={registerInSpaceship}
                    onChange={(e) => setRegisterInSpaceship(e.target.checked)}
                    disabled={saving}
                  />
                  <label className="form-check-label" htmlFor="registerInSpaceship">
                    Registrar también en Spaceship
                  </label>
                </div>
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
                  disabled={saving || registerInSpaceship}
                  readOnly={registerInSpaceship}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="fqdn" className="form-label fw-500">
                  Dominio (FQDN) *
                </label>
                <div className="d-f gap-2 ai-stretch" style={{ flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="fqdn"
                    value={fqdn}
                    onChange={(e) => {
                      setFqdn(e.target.value);
                      setAvailability(null);
                    }}
                    placeholder="ejemplo.com"
                    required
                    disabled={saving}
                    style={{ flex: '1 1 200px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleVerify}
                    disabled={saving || verifying || !fqdn.trim()}
                  >
                    {verifying ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
                {availability !== null && (
                  <div
                    className={`fsz-sm mT-8 p-2 rounded ${availability.error ? 'bg-danger bg-opacity-10 text-danger' : availability.available ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}
                  >
                    {availability.error
                      ? availability.error
                      : availability.available
                        ? `Disponible${availability.price != null ? ` — ${formatPrice(availability.price, availability.currency)}` : ''}`
                        : `No disponible${availability.price != null ? ` — ${formatPrice(availability.price, availability.currency)}` : ''}`}
                  </div>
                )}
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
              <div className="mb-4">
                <div className="form-check mB-10">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="createHostingWithPackage"
                    checked={createHostingWithPackage}
                    onChange={(e) => setCreateHostingWithPackage(e.target.checked)}
                    disabled={saving}
                  />
                  <label className="form-check-label" htmlFor="createHostingWithPackage">
                    Crear servidor (hosting) para este dominio en WHM
                  </label>
                </div>
                {createHostingWithPackage && (
                  <div className="mT-8">
                    <label htmlFor="hostingPackageID" className="form-label fw-500">
                      Paquete de hosting *
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="hostingPackageID"
                      value={hostingPackageID}
                      onChange={(e) => setHostingPackageID(e.target.value)}
                      disabled={saving}
                      required={createHostingWithPackage}
                    >
                      <option value="">Seleccionar paquete</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.currency} {formatPrice(p.salePrice, p.currency)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
