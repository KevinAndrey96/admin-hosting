'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { useSession } from '../../../hooks/useSession';

type WhoisData = {
  id?: string;
  registrantName: string;
  registrantOrg: string | null;
  registrantEmail: string;
  registrantPhone: string | null;
  registrantAddress: string | null;
  registrantCity: string | null;
  registrantState: string | null;
  registrantCountry: string | null;
  registrantPostalCode: string | null;
  privacyEnabled: boolean;
};

type DomainData = {
  id: string;
  userID: string;
  clientName: string;
  clientEmail: string;
  registrarName: string;
  fqdn: string;
  salePrice: number;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  nextBillingDate: string;
  paymentStatus: string;
  transferLock: boolean;
  healthStatus: string;
  nameserver1: string | null;
  nameserver2: string | null;
  whois: WhoisData | null;
};

type Client = { id: string; fullName: string; email: string; role?: string };

export default function EditDomainPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: sessionLoading } = useSession();
  const [domain, setDomain] = useState<DomainData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [userID, setUserID] = useState('');
  const [registrarName, setRegistrarName] = useState('Spaceship');
  const [fqdn, setFqdn] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [renewalDate, setRenewalDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [transferLock, setTransferLock] = useState(true);
  const [whois, setWhois] = useState<WhoisData>({
    registrantName: '',
    registrantOrg: null,
    registrantEmail: '',
    registrantPhone: null,
    registrantAddress: null,
    registrantCity: null,
    registrantState: null,
    registrantCountry: null,
    registrantPostalCode: null,
    privacyEnabled: false,
  });
  const [nameserver1, setNameserver1] = useState('');
  const [nameserver2, setNameserver2] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockConfirmChecked, setUnlockConfirmChecked] = useState(false);
  const [showPropagationModal, setShowPropagationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferConfirmChecked, setTransferConfirmChecked] = useState(false);
  const [transferRequesting, setTransferRequesting] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

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
        const domainRes = await fetch(`${basePath}/api/domains/${id}`, { credentials: 'include' });
        const clientsRes = isAdmin
          ? await fetch(`${basePath}/api/clients`, { credentials: 'include' })
          : null;
        if (domainRes.ok) {
          const data = await domainRes.json();
          setDomain(data);
          setUserID(data.userID);
          setRegistrarName(data.registrarName || 'Spaceship');
          setFqdn(data.fqdn || '');
          setSalePrice(data.salePrice != null ? String(data.salePrice) : '');
          setCurrency(data.currency || 'COP');
          setRenewalDate(data.renewalDate ? data.renewalDate.slice(0, 10) : '');
          setPaymentStatus(data.paymentStatus || 'PENDING');
          setTransferLock(data.transferLock !== false);
          if (data.whois) {
            setWhois({
              registrantName: data.whois.registrantName || '',
              registrantOrg: data.whois.registrantOrg || null,
              registrantEmail: data.whois.registrantEmail || '',
              registrantPhone: data.whois.registrantPhone || null,
              registrantAddress: data.whois.registrantAddress || null,
              registrantCity: data.whois.registrantCity || null,
              registrantState: data.whois.registrantState || null,
              registrantCountry: data.whois.registrantCountry || null,
              registrantPostalCode: data.whois.registrantPostalCode || null,
              privacyEnabled: Boolean(data.whois.privacyEnabled),
            });
          } else {
            setWhois({
              registrantName: '',
              registrantOrg: null,
              registrantEmail: '',
              registrantPhone: null,
              registrantAddress: null,
              registrantCity: null,
              registrantState: null,
              registrantCountry: null,
              registrantPostalCode: null,
              privacyEnabled: false,
            });
          }
          setNameserver1(data.nameserver1 || '');
          setNameserver2(data.nameserver2 || '');
        } else {
          setDomain(null);
        }
        if (isAdmin && clientsRes && clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.filter((c: Client) => c.role === 'CLIENT'));
        }
      } catch {
        setDomain(null);
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchData();
    }
  }, [user, id, isAdmin]);

  const saveTransferLockOnly = async (value: boolean) => {
    setSaving(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transferLock: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar.' });
        return;
      }
      setTransferLock(value);
      setDomain((prev) => (prev ? { ...prev, transferLock: value } : null));
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setSaving(false);
    }
  };

  const doSave = async () => {
    setSaving(true);
    setShowPropagationModal(false);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const body = isAdmin
        ? {
            userID,
            registrarName: registrarName.trim(),
            fqdn: fqdn.trim().toLowerCase(),
            salePrice: parseFloat(salePrice),
            currency: currency || 'COP',
            renewalDate: renewalDate || undefined,
            paymentStatus,
            transferLock,
            whois: {
              registrantName: whois.registrantName.trim() || undefined,
              registrantOrg: whois.registrantOrg?.trim() || null,
              registrantEmail: whois.registrantEmail.trim() || undefined,
              registrantPhone: whois.registrantPhone?.trim() || null,
              registrantAddress: whois.registrantAddress?.trim() || null,
              registrantCity: whois.registrantCity?.trim() || null,
              registrantState: whois.registrantState?.trim() || null,
              registrantCountry: whois.registrantCountry?.trim() || null,
              registrantPostalCode: whois.registrantPostalCode?.trim() || null,
              privacyEnabled: whois.privacyEnabled,
            },
            nameserver1: nameserver1.trim() || null,
            nameserver2: nameserver2.trim() || null,
          }
        : {
            transferLock,
            whois: {
              registrantName: whois.registrantName.trim() || undefined,
              registrantOrg: whois.registrantOrg?.trim() || null,
              registrantEmail: whois.registrantEmail.trim() || undefined,
              registrantPhone: whois.registrantPhone?.trim() || null,
              registrantAddress: whois.registrantAddress?.trim() || null,
              registrantCity: whois.registrantCity?.trim() || null,
              registrantState: whois.registrantState?.trim() || null,
              registrantCountry: whois.registrantCountry?.trim() || null,
              registrantPostalCode: whois.registrantPostalCode?.trim() || null,
              privacyEnabled: whois.privacyEnabled,
            },
            nameserver1: nameserver1.trim() || null,
            nameserver2: nameserver2.trim() || null,
          };
      const res = await fetch(`${basePath}/api/domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar.' });
        return;
      }

      setMessage({ type: 'success', text: 'Dominio actualizado correctamente.' });
      setDomain((prev) => (prev ? { ...prev, ...data } : null));
      setTimeout(() => router.push('/domains'), 800);
      if (data.whois) setWhois((w) => ({ ...w, ...data.whois }));
      if (data.nameserver1 != null) setNameserver1(data.nameserver1 || '');
      if (data.nameserver2 != null) setNameserver2(data.nameserver2 || '');
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (isAdmin) {
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
    }
    setShowPropagationModal(true);
  };

  if (sessionLoading || !user) {
    return null;
  }

  if (loading || !domain) {
    return (
      <AdminLayout>
        <div className="container-fluid p-40 ta-c c-grey-600">
          {loading ? 'Cargando...' : 'Dominio no encontrado.'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div
        className="container-fluid d-f fxd-c ai-c"
        style={{ background: 'var(--c-bkg-body)', minHeight: '100%', padding: '24px' }}
      >
        <div className="row mB-20 w-100" style={{ maxWidth: 800 }}>
          <div className="col-12">
            <Link href="/domains" className="c-primary fsz-sm td-n mB-10 d-ib fw-500">
              ← Volver a dominios
            </Link>
            <h4 className="m-0 mT-5 c-grey-900">Editar dominio</h4>
            <p className="c-grey-700 fsz-sm mT-5">
              {domain.fqdn}
              {isAdmin && ` — ${domain.clientName}`}
            </p>
            {!isAdmin && (
              <p className="c-grey-600 fsz-sm mT-5">
                Completa la información WHOIS (registrante) de tu dominio.
              </p>
            )}
          </div>
        </div>

        <div className="row w-100" style={{ maxWidth: 800 }}>
          <div className="col-12">
            <div className="bd bgc-white p-30 bdrs-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <form onSubmit={handleSubmit}>
                {isAdmin ? (
                  <>
                    <h6 className="mB-20">Información del dominio</h6>
                    <div className="mb-3">
                      <label htmlFor="userID" className="form-label">Cliente *</label>
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
                          <option key={c.id} value={c.id}>
                            {c.fullName} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="registrarName" className="form-label">Registrador *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="registrarName"
                        value={registrarName}
                        onChange={(e) => setRegistrarName(e.target.value)}
                        placeholder="Spaceship"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="fqdn" className="form-label">Dominio (FQDN) *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="fqdn"
                        value={fqdn}
                        onChange={(e) => setFqdn(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="salePrice" className="form-label">Precio *</label>
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
                        <label htmlFor="currency" className="form-label">Moneda</label>
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
                      <label htmlFor="renewalDate" className="form-label">Fecha de renovación / facturación</label>
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
                    </div>
                  </>
                ) : (
                  <div className="mb-3 p-3 bgc-grey-100 bdrs-3">
                    <p className="m-0 fsz-sm c-grey-700">
                      <strong>Dominio:</strong> {domain.fqdn}
                    </p>
                  </div>
                )}
                <h6 className="mB-20">Información WHOIS (Registrante)</h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantName" className="form-label">
                      Nombre del registrante
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantName"
                      value={whois.registrantName}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantName: e.target.value }))}
                      placeholder="Juan Pérez"
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantOrg" className="form-label">
                      Organización
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantOrg"
                      value={whois.registrantOrg || ''}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantOrg: e.target.value || null }))}
                      placeholder="Mi Empresa S.A.S."
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantEmail" className="form-label">
                      Email del registrante
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="registrantEmail"
                      value={whois.registrantEmail}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantEmail: e.target.value }))}
                      placeholder="contacto@ejemplo.com"
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantPhone" className="form-label">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="registrantPhone"
                      value={whois.registrantPhone || ''}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantPhone: e.target.value.replace(/\D/g, '').slice(0, 10) || null }))}
                      placeholder="3001234567"
                      maxLength={10}
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="registrantAddress" className="form-label">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="registrantAddress"
                    value={whois.registrantAddress || ''}
                    onChange={(e) => setWhois((w) => ({ ...w, registrantAddress: e.target.value || null }))}
                    placeholder="Calle 123 #45-67"
                    disabled={saving || whois.privacyEnabled}
                  />
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="registrantCity" className="form-label">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantCity"
                      value={whois.registrantCity || ''}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantCity: e.target.value || null }))}
                      placeholder="Bogotá"
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="registrantState" className="form-label">
                      Departamento / Estado
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantState"
                      value={whois.registrantState || ''}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantState: e.target.value || null }))}
                      placeholder="Cundinamarca"
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="registrantPostalCode" className="form-label">
                      Código postal
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantPostalCode"
                      value={whois.registrantPostalCode || ''}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantPostalCode: e.target.value || null }))}
                      placeholder="110111"
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantCountry" className="form-label">
                      País
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantCountry"
                      value={whois.registrantCountry || ''}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantCountry: e.target.value || null }))}
                      placeholder="CO"
                      disabled={saving || whois.privacyEnabled}
                    />
                  </div>
                  <div className="col-md-6 mb-3 d-flex align-items-start">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="privacyEnabled"
                        checked={whois.privacyEnabled}
                        onChange={(e) => setWhois((w) => ({ ...w, privacyEnabled: e.target.checked }))}
                        disabled={saving}
                      />
                      <label className="form-check-label" htmlFor="privacyEnabled">
                        Privacidad WHOIS habilitada
                      </label>
                    </div>
                    <span
                      className="ms-2 c-info cur-p"
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowPrivacyInfo((v) => !v)}
                      onKeyDown={(e) => e.key === 'Enter' && setShowPrivacyInfo((v) => !v)}
                      title="Ver más información"
                    >
                      <i className="ti-help-alt fsz-lg" />
                    </span>
                  </div>
                </div>
                {showPrivacyInfo && (
                  <div className="p-3 bdrs-3 mB-0 mT-2" style={{ backgroundColor: '#e7f3ff', border: '1px solid #0d6efd' }}>
                    <p className="m-0 fsz-sm c-grey-800">
                      <strong className="c-primary">¿Por qué mantener el dominio privado?</strong> La privacidad WHOIS protege tus datos personales y de contacto de ser visibles públicamente. Sin ella, tu nombre, email, teléfono y dirección quedan expuestos en bases de datos accesibles por cualquiera, lo que puede generar spam, intentos de phishing, robos de identidad y contactos no deseados. Mantener la privacidad activa es una buena práctica de seguridad recomendada.
                    </p>
                  </div>
                )}

                <hr className="my-4" />
                <h6 className="mB-20">Nameservers</h6>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="nameserver1" className="form-label">Nameserver 1</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nameserver1"
                      placeholder="ns1.ejemplo.com"
                      value={nameserver1}
                      onChange={(e) => setNameserver1(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="nameserver2" className="form-label">Nameserver 2</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nameserver2"
                      placeholder="ns2.ejemplo.com"
                      value={nameserver2}
                      onChange={(e) => setNameserver2(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="bdT pt-3 mT-3" style={{ borderColor: '#dee2e6' }}>
                  <div className="d-f ai-c jc-sb fxw-w gap-2" style={{ fontSize: 13 }}>
                    <span className="c-grey-600">
                      <i className={`ti-${transferLock ? 'lock' : 'unlock'} mR-5`} style={{ opacity: 0.7 }} />
                      Bloqueo de transferencias: {transferLock ? 'activo' : 'desactivado'}
                    </span>
                    <span className="d-f gap-2">
                      {transferLock ? (
                        <button
                          type="button"
                          className="btn btn-link p-0 fsz-sm"
                          style={{ color: '#dc3545', textDecoration: 'none', fontWeight: 600 }}
                          onClick={() => { setShowUnlockModal(true); setUnlockConfirmChecked(false); }}
                          disabled={saving}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-link p-0 fsz-sm"
                            style={{ color: '#198754', textDecoration: 'none' }}
                            onClick={() => saveTransferLockOnly(true)}
                            disabled={saving}
                          >
                            Activar
                          </button>
                          <button
                            type="button"
                            className="btn btn-link p-0 fsz-sm"
                            style={{ color: '#0d6efd', textDecoration: 'none' }}
                            onClick={() => { setShowTransferModal(true); setTransferConfirmChecked(false); }}
                            disabled={saving}
                          >
                            Transferir dominio
                          </button>
                        </>
                      )}
                    </span>
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
                <div className="d-f gap-3 mT-20 jc-c">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ color: '#fff', padding: '14px 32px', fontWeight: 600 }}
                  >
                    <i className="ti-check mR-5" />
                    {saving ? 'Guardando...' : 'Guardar cambios'}
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
      </div>

      {showUnlockModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title d-f ai-c gap-2">
                  <i className="ti-alert text-warning fsz-lg" />
                  Advertencia de seguridad
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => { setShowUnlockModal(false); setUnlockConfirmChecked(false); }}
                />
              </div>
              <div className="modal-body">
                <p className="fw-600 c-grey-900 mB-15">
                  Por seguridad, no recomendamos desactivar el bloqueo de transferencias.
                </p>
                <p className="c-grey-700 mB-15">
                  El bloqueo de transferencias (transfer lock) es una capa de protección esencial que evita que tu dominio sea transferido a otro registrador sin tu autorización explícita. Al mantenerlo activo, reduces significativamente el riesgo de que terceros malintencionados puedan apropiarse de tu dominio mediante técnicas de ingeniería social, suplantación de identidad o acceso no autorizado a tu cuenta de correo.
                </p>
                <p className="c-grey-700 mB-15">
                  Los dominios sin bloqueo pueden ser transferidos en cuestión de días si un atacante obtiene acceso temporal a tu email o responde correctamente a los formularios de autorización. Una vez transferido, recuperar el dominio puede ser un proceso largo, costoso y en algunos casos irreversible. Además, durante ese período tu sitio web, correos y servicios asociados podrían quedar inaccesibles o ser redirigidos.
                </p>
                <p className="c-grey-700 mB-20">
                  Solo desactiva esta protección si tienes una razón técnica válida (por ejemplo, una transferencia planificada a otro registrador) y asegúrate de volver a activarla una vez completado el proceso.
                </p>
                <div className="form-check mB-10">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="unlockConfirm"
                    checked={unlockConfirmChecked}
                    onChange={(e) => setUnlockConfirmChecked(e.target.checked)}
                  />
                  <label className="form-check-label fw-500" htmlFor="unlockConfirm">
                    Sí, deseo continuar y entiendo los riesgos
                  </label>
                </div>
                {!unlockConfirmChecked && (
                  <p className="fsz-sm c-grey-600 mB-0">
                    Marca la casilla anterior para habilitar el botón de deshabilitar.
                  </p>
                )}
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowUnlockModal(false); setUnlockConfirmChecked(false); }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn ${unlockConfirmChecked ? 'btn-danger' : 'btn-outline-secondary'}`}
                  disabled={!unlockConfirmChecked}
                  onClick={() => {
                    setShowUnlockModal(false);
                    setUnlockConfirmChecked(false);
                    saveTransferLockOnly(false);
                  }}
                  style={unlockConfirmChecked ? { color: '#fff' } : {}}
                  title={!unlockConfirmChecked ? 'Marca la casilla para habilitar' : undefined}
                >
                  Deshabilitar bloqueo de protección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPropagationModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-f ai-c gap-2">
                  <i className="ti-info-alt text-info fsz-lg" />
                  Información importante
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setShowPropagationModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="m-0 c-grey-800">
                  Los cambios realizados pueden tardar entre <strong>24 y 48 horas</strong> en propagarse a nivel global debido al sistema de caché DNS y a los tiempos de actualización de los registros WHOIS en los diferentes registradores.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPropagationModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={doSave}
                  disabled={saving}
                  style={{ color: '#fff' }}
                >
                  {saving ? 'Guardando...' : 'Entendido, guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title d-f ai-c gap-2">
                  <i className="ti-arrow-right text-primary fsz-lg" />
                  Transferir dominio
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => { setShowTransferModal(false); setTransferConfirmChecked(false); }}
                />
              </div>
              <div className="modal-body">
                <p className="fw-600 c-grey-900 mB-15">
                  ¿Estás seguro de que deseas transferir tu dominio?
                </p>
                <p className="c-grey-700 mB-15">
                  Te recomendamos mantener tu dominio con nosotros. Ofrecemos soporte técnico, renovaciones automáticas y precios competitivos. Transferir el dominio a otro registrador puede implicar costos adicionales, tiempos de espera y la pérdida de beneficios exclusivos.
                </p>
                <p className="c-grey-700 mB-15">
                  Si tienes alguna inquietud o necesitas ayuda, contáctanos antes de continuar. Estamos aquí para asistirte.
                </p>
                <p className="c-grey-700 mB-20">
                  El código de transferencia llegará en las próximas horas a tu correo electrónico.
                </p>
                <div className="form-check mB-10">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="transferConfirm"
                    checked={transferConfirmChecked}
                    onChange={(e) => setTransferConfirmChecked(e.target.checked)}
                  />
                  <label className="form-check-label fw-500" htmlFor="transferConfirm">
                    Sí, deseo continuar y solicitar el código de transferencia
                  </label>
                </div>
                {!transferConfirmChecked && (
                  <p className="fsz-sm c-grey-600 mB-0">
                    Marca la casilla para habilitar el botón.
                  </p>
                )}
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowTransferModal(false); setTransferConfirmChecked(false); }}
                  disabled={transferRequesting}
                >
                  Permanecer
                </button>
                <button
                  type="button"
                  className={`btn ${transferConfirmChecked ? 'btn-primary' : 'btn-outline-secondary'}`}
                  disabled={!transferConfirmChecked || transferRequesting}
                  onClick={async () => {
                    if (!transferConfirmChecked) return;
                    setTransferRequesting(true);
                    try {
                      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
                      const res = await fetch(`${basePath}/api/domains/${id}/request-transfer`, {
                        method: 'POST',
                        credentials: 'include',
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setMessage({ type: 'error', text: data.error || 'Error al procesar la solicitud.' });
                        return;
                      }
                      setShowTransferModal(false);
                      setTransferConfirmChecked(false);
                      setMessage({
                        type: 'success',
                        text: 'Solicitud enviada. El código de transferencia llegará en las próximas horas a tu correo electrónico.',
                      });
                    } catch {
                      setMessage({ type: 'error', text: 'Error de conexión.' });
                    } finally {
                      setTransferRequesting(false);
                    }
                  }}
                  style={transferConfirmChecked ? { color: '#fff' } : {}}
                >
                  {transferRequesting ? 'Enviando...' : 'Continuar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
