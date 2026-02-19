'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { useSession } from '../../hooks/useSession';

type Client = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  zipCode?: string | null;
  role?: string;
};

export default function TransferInPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [userID, setUserID] = useState('');
  const [fqdn, setFqdn] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [salePrice, setSalePrice] = useState('0');
  const [currency, setCurrency] = useState('COP');
  const [privacyEnabled, setPrivacyEnabled] = useState(true);
  const [registrantName, setRegistrantName] = useState('');
  const [registrantEmail, setRegistrantEmail] = useState('');
  const [registrantPhone, setRegistrantPhone] = useState('');
  const [registrantAddress, setRegistrantAddress] = useState('');
  const [registrantCity, setRegistrantCity] = useState('');
  const [registrantState, setRegistrantState] = useState('');
  const [registrantCountry, setRegistrantCountry] = useState('CO');
  const [registrantPostalCode, setRegistrantPostalCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid?: boolean;
    error?: string;
    message?: string;
    price?: number;
    currency?: string;
  } | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/signin');
    }
  }, [router, sessionLoading, user]);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchData = async () => {
      try {
        if (isAdmin) {
          const clientsRes = await fetch(`${basePath}/api/clients`, { credentials: 'include' });
          if (clientsRes.ok) {
            const clientsData = await clientsRes.json();
            const clientsOnly = clientsData.filter((c: Client) => c.role === 'CLIENT');
            setClients(clientsOnly);
            if (clientsOnly.length === 1) setUserID(clientsOnly[0].id);
          }
        } else if (user?.id) {
          setUserID(user.id);
          // Pre-fill immediately from session (name, email) so form shows data right away
          setRegistrantName(user.fullName || '');
          setRegistrantEmail(user.email || '');
          const profileRes = await fetch(`${basePath}/api/user/profile`, { credentials: 'include' });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            setRegistrantName(profile.fullName || user.fullName || '');
            setRegistrantEmail(profile.email || user.email || '');
            setRegistrantPhone(profile.phone || '');
            setRegistrantAddress(profile.address || '');
            setRegistrantCity(profile.city || '');
            setRegistrantState(profile.stateProvince || '');
            setRegistrantCountry(profile.country || 'CO');
            setRegistrantPostalCode(profile.zipCode || '');
          }
        }
      } catch {
        setMessage({ type: 'error', text: 'Error al cargar datos' });
      }
    };
    if (user) fetchData();
  }, [user?.id, user?.role, isAdmin]);

  useEffect(() => {
    if (isAdmin && userID && clients.length) {
      const client = clients.find((c) => c.id === userID);
      if (client) {
        setRegistrantName(client.fullName || '');
        setRegistrantEmail(client.email || '');
        setRegistrantPhone(client.phone || '');
        setRegistrantAddress(client.address || '');
        setRegistrantCity(client.city || '');
        setRegistrantState(client.stateProvince || '');
        setRegistrantCountry(client.country || 'CO');
        setRegistrantPostalCode(client.zipCode || '');
      }
    }
  }, [isAdmin, userID, clients]);

  const handleValidate = async () => {
    setMessage(null);
    setValidationResult(null);
    if (!fqdn.trim()) {
      setValidationResult({ valid: false, error: 'Ingresa el dominio para verificar.' });
      return;
    }
    if (!registrantEmail.trim()) {
      setValidationResult({ valid: false, error: 'Ingresa el email del registrante para verificar.' });
      return;
    }
    setValidating(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(
        `${basePath}/api/domains/transfer-in/validate?domain=${encodeURIComponent(fqdn.trim().toLowerCase())}&email=${encodeURIComponent(registrantEmail.trim())}`,
        { credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));
      setValidationResult({
        valid: data.valid,
        error: data.error,
        message: data.message,
        price: data.price,
        currency: data.currency,
      });
    } catch {
      setValidationResult({ valid: false, error: 'Error de conexión al verificar.' });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (isAdmin && !userID) {
      setMessage({ type: 'error', text: 'Selecciona un cliente.' });
      return;
    }
    if (!isAdmin && !user?.id) {
      setMessage({ type: 'error', text: 'Sesión inválida. Vuelve a iniciar sesión.' });
      return;
    }
    if (!fqdn.trim()) {
      setMessage({ type: 'error', text: 'El dominio (FQDN) es requerido.' });
      return;
    }
    if (!authCode.trim()) {
      setMessage({ type: 'error', text: 'El código de autorización (EPP) es requerido.' });
      return;
    }
    if (!registrantEmail.trim()) {
      setMessage({ type: 'error', text: 'El email del registrante es requerido.' });
      return;
    }
    const saleNum = isAdmin ? parseFloat(salePrice) : 0;
    if (isAdmin && (isNaN(saleNum) || saleNum < 0)) {
      setMessage({ type: 'error', text: 'El precio debe ser un número válido.' });
      return;
    }
    setSubmitting(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const whoisPayload = {
        registrantName: registrantName.trim() || undefined,
        registrantEmail: registrantEmail.trim() || undefined,
        registrantPhone: registrantPhone.trim() || null,
        registrantAddress: registrantAddress.trim() || null,
        registrantCity: registrantCity.trim() || null,
        registrantState: registrantState.trim() || null,
        registrantCountry: registrantCountry.trim() || 'CO',
        registrantPostalCode: registrantPostalCode.trim() || null,
      };

      // Client: create transfer request and redirect to payment
      if (!isAdmin) {
        const res = await fetch(`${basePath}/api/domains/transfer-in/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fqdn: fqdn.trim().toLowerCase(),
            authCode: authCode.trim(),
            privacyEnabled,
            whois: whoisPayload,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({ type: 'error', text: data.error || 'Error al crear la solicitud.' });
          return;
        }
        const params = new URLSearchParams({
          tipo: 'transferir-dominio',
          domainId: data.id,
        });
        router.push(`/pago?${params}`);
        return;
      }

      // Admin: direct Spaceship transfer
      const res = await fetch(`${basePath}/api/domains/transfer-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userID,
          fqdn: fqdn.trim().toLowerCase(),
          authCode: authCode.trim(),
          salePrice: saleNum,
          currency: currency || 'COP',
          privacyEnabled,
          whois: whoisPayload,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al iniciar la transferencia.' });
        return;
      }

      setMessage({ type: 'success', text: data.message || 'Transferencia iniciada correctamente.' });
      setTimeout(() => router.push('/domains'), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading || !user) {
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
            maxWidth: 640,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: 'none',
            borderRadius: 12,
          }}
        >
          <div className="card-body p-30">
            <Link href="/domains" className="c-primary fsz-sm td-n d-ib fw-500 mB-15">
              ← Volver a dominios
            </Link>
            <h4 className="m-0 c-grey-900 fw-600">
              {isAdmin ? 'Transferir dominio aquí' : 'Transferir mi dominio'}
            </h4>
            <p className="c-grey-600 fsz-sm mT-5 mB-25">
              {isAdmin
                ? 'Transfiere un dominio desde otro registrador hacia la cuenta del cliente'
                : 'Transfiere tu dominio desde otro registrador hacia tu cuenta'}
            </p>

            <form onSubmit={handleSubmit}>
              {isAdmin && (
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
                    disabled={submitting}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="fqdn" className="form-label fw-500">
                  Dominio (FQDN) *
                </label>
                <div className="d-f ai-c gap-2">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="fqdn"
                    value={fqdn}
                    onChange={(e) => {
                      setFqdn(e.target.value);
                      setValidationResult(null);
                    }}
                    placeholder="ejemplo.com"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    style={{ whiteSpace: 'nowrap' }}
                    disabled={submitting || validating || !fqdn.trim()}
                    onClick={handleValidate}
                  >
                    {validating ? (
                      <i className="ti-reload ti-spin mR-5" />
                    ) : (
                      <i className="ti-check mR-5" />
                    )}
                    {validating ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
                {isAdmin && (
                  <small className="c-grey-600 fsz-xs d-b mT-5">
                    <a
                      href="https://www.spaceship.com/domains/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c-grey-600"
                    >
                      Ver precios de transferencia en Spaceship
                    </a>
                  </small>
                )}
                {validationResult && (
                  <div
                    className={`p-3 bdrs-3 mT-10 fsz-sm ${validationResult.valid ? 'bgc-success-50' : 'bgc-danger-50'}`}
                    style={{
                      backgroundColor: validationResult.valid
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${validationResult.valid ? '#10b981' : '#ef4444'}`,
                    }}
                  >
                    {validationResult.valid ? (
                      <div className="c-success">
                        <div className="d-f ai-c mB-5">
                          <i className="ti-check mR-5" />
                          {validationResult.message || 'Los datos son correctos. Puedes continuar.'}
                        </div>
                        {validationResult.price != null && validationResult.price > 0 && (
                          <div className="fw-600" style={{ color: 'var(--c-text-base)' }}>
                            Precio: {validationResult.currency === 'COP' ? '$' : validationResult.currency}{' '}
                            {Number(validationResult.price).toLocaleString('es-CO')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="c-danger">
                        <i className="ti-close mR-5" />
                        {validationResult.error}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="authCode" className="form-label fw-500">
                  Código de autorización (EPP) *
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="authCode"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Código que obtienes de tu registrador actual"
                  required
                  disabled={submitting}
                />
                <small className="c-grey-600 fsz-xs d-b mT-5">
                  Solicita este código en el panel de tu registrador actual.
                </small>
              </div>

              {isAdmin && (
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
                      disabled={submitting}
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
                      disabled={submitting}
                    >
                      <option value="COP">COP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="bd bdrs-3 p-20 mB-20" style={{ background: 'var(--c-bkg-body)' }}>
                <h6 className="m-0 mB-15 c-grey-800 fw-600">Contacto registrante (WHOIS)</h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantName" className="form-label fsz-sm">
                      Nombre
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantName"
                      value={registrantName}
                      onChange={(e) => setRegistrantName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantEmail" className="form-label fsz-sm">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="registrantEmail"
                      value={registrantEmail}
                      onChange={(e) => {
                        setRegistrantEmail(e.target.value);
                        setValidationResult(null);
                      }}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantPhone" className="form-label fsz-sm">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantPhone"
                      value={registrantPhone}
                      onChange={(e) => setRegistrantPhone(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantCity" className="form-label fsz-sm">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantCity"
                      value={registrantCity}
                      onChange={(e) => setRegistrantCity(e.target.value)}
                      placeholder="Solo letras, espacios y guiones"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="registrantAddress" className="form-label fsz-sm">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="registrantAddress"
                    value={registrantAddress}
                    onChange={(e) => setRegistrantAddress(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="registrantState" className="form-label fsz-sm">
                      Departamento / Estado
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantState"
                      value={registrantState}
                      onChange={(e) => setRegistrantState(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="registrantCountry" className="form-label fsz-sm">
                      País
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantCountry"
                      value={registrantCountry}
                      onChange={(e) => setRegistrantCountry(e.target.value)}
                      placeholder="CO"
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="registrantPostalCode" className="form-label fsz-sm">
                      Código postal
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantPostalCode"
                      value={registrantPostalCode}
                      onChange={(e) => setRegistrantPostalCode(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="privacyEnabled"
                    checked={privacyEnabled}
                    onChange={(e) => setPrivacyEnabled(e.target.checked)}
                    disabled={submitting}
                  />
                  <label className="form-check-label" htmlFor="privacyEnabled">
                    Privacidad WHOIS
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
                  disabled={submitting}
                  style={{ color: '#fff', padding: '14px 32px', fontWeight: 600 }}
                >
                  <i className={isAdmin ? 'ti-arrow-down mR-5' : 'ti-arrow-right mR-5'} />
                  {submitting
                    ? isAdmin
                      ? 'Iniciando...'
                      : 'Creando solicitud...'
                    : isAdmin
                      ? 'Iniciar transferencia'
                      : 'Continuar al pago'}
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
