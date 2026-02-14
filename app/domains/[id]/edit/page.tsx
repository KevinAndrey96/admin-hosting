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
  serviceStatus: string;
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
  const [serviceStatus, setServiceStatus] = useState('ACTIVE');
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

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchData = async () => {
      try {
        const [domainRes, clientsRes] = await Promise.all([
          fetch(`${basePath}/api/domains/${id}`, { credentials: 'include' }),
          fetch(`${basePath}/api/clients`, { credentials: 'include' }),
        ]);
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
          setServiceStatus(data.serviceStatus || 'ACTIVE');
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
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.filter((c: Client) => c.role === 'CLIENT'));
        }
      } catch {
        setDomain(null);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN' && id) {
      fetchData();
    }
  }, [user?.role, id]);

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
      const res = await fetch(`${basePath}/api/domains/${id}`, {
        method: 'PUT',
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
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar.' });
        return;
      }

      setMessage({ type: 'success', text: 'Dominio actualizado correctamente.' });
      setDomain((prev) => (prev ? { ...prev, ...data } : null));
      if (data.whois) setWhois((w) => ({ ...w, ...data.whois }));
      if (data.nameserver1 != null) setNameserver1(data.nameserver1 || '');
      if (data.nameserver2 != null) setNameserver2(data.nameserver2 || '');
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || user?.role !== 'ADMIN') {
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
        style={{ background: '#fff', minHeight: '100%', padding: '24px' }}
      >
        <div className="row mB-20 w-100" style={{ maxWidth: 800 }}>
          <div className="col-12">
            <Link href="/domains" className="c-primary fsz-sm td-n mB-10 d-ib fw-500">
              ← Volver a dominios
            </Link>
            <h4 className="m-0 mT-5 c-grey-900">Editar dominio</h4>
            <p className="c-grey-700 fsz-sm mT-5">
              {domain.fqdn} — {domain.clientName}
            </p>
          </div>
        </div>

        <div className="row w-100" style={{ maxWidth: 800 }}>
          <div className="col-12">
            <div className="bd bgc-white p-30 bdrs-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <form onSubmit={handleSubmit}>
                <h6 className="mB-20">Información del dominio</h6>
                <div className="mb-3">
                <label htmlFor="userID" className="form-label">
                  Cliente *
                </label>
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
                  <label htmlFor="registrarName" className="form-label">
                    Registrador *
                  </label>
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
                  <label htmlFor="fqdn" className="form-label">
                    Dominio (FQDN) *
                  </label>
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
                    <label htmlFor="salePrice" className="form-label">
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
                    <label htmlFor="currency" className="form-label">
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
                  <label htmlFor="renewalDate" className="form-label">
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
                    <label htmlFor="paymentStatus" className="form-label">
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
                    <label htmlFor="serviceStatus" className="form-label">
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

                <hr className="my-4" />
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="registrantPhone" className="form-label">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="registrantPhone"
                      value={whois.registrantPhone || ''}
                      onChange={(e) => setWhois((w) => ({ ...w, registrantPhone: e.target.value || null }))}
                      placeholder="+57 300 123 4567"
                      disabled={saving}
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
                    disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                  <div className="col-md-6 mb-3 d-flex align-items-end">
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
                  </div>
                </div>

                <hr className="my-4" />
                <h6 className="mB-20">Nameservers (IPv4, máx. 2)</h6>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="nameserver1" className="form-label">Nameserver 1</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nameserver1"
                      placeholder="Ej: 192.168.1.1"
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
                      placeholder="Ej: 192.168.1.2"
                      value={nameserver2}
                      onChange={(e) => setNameserver2(e.target.value)}
                      disabled={saving}
                    />
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
    </AdminLayout>
  );
}
