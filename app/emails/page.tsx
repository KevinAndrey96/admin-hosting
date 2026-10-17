'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';

type HostingOption = {
  id: string;
  username: string;
  packageName: string;
  clientName: string;
  domains: string[];
};

type CurrentHosting = {
  id: string;
  username: string;
  cpanelUser: string;
  packageName: string;
  maxEmailAccounts: string | number;
  diskSpaceQuotaMb: number | string | null;
  domains: string[];
};

type EmailAccount = {
  email: string;
  user: string;
  domain: string;
  diskused: string;
  diskquota: string;
  diskusedpercent: number;
  humandiskused: string;
  humandiskquota: string;
  suspendedLogin: boolean;
  suspendedIncoming: boolean;
};

function EmailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedHostingId = searchParams?.get('hostingId') || '';

  const { user, loading: sessionLoading } = useSession();
  const [hostings, setHostings] = useState<HostingOption[]>([]);
  const [currentHosting, setCurrentHosting] = useState<CurrentHosting | null>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedHostingId, setSelectedHostingId] = useState<string>(requestedHostingId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<EmailAccount | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState<EmailAccount | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<EmailAccount | null>(null);

  // Form states
  const [newPrefix, setNewPrefix] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newQuotaMb, setNewQuotaMb] = useState('1024');
  const [newIsUnlimited, setNewIsUnlimited] = useState(false);

  const [editPassword, setEditPassword] = useState('');
  const [editQuotaMb, setEditQuotaMb] = useState('1024');
  const [editIsUnlimited, setEditIsUnlimited] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/signin');
    }
  }, [sessionLoading, user, router]);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // Fetch emails for selected hosting
  const fetchEmails = async (hostingIdToFetch?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = hostingIdToFetch
        ? `${basePath}/api/emails?hostingId=${encodeURIComponent(hostingIdToFetch)}`
        : `${basePath}/api/emails`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al obtener cuentas de correo');
        setLoading(false);
        return;
      }

      setHostings(data.hostings || []);
      setCurrentHosting(data.currentHosting || null);
      setAccounts(data.accounts || []);
      if (data.currentHosting) {
        setSelectedHostingId(data.currentHosting.id);
        if (data.currentHosting.domains && data.currentHosting.domains.length > 0) {
          setNewDomain(data.currentHosting.domains[0]);
        }
      }
      if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Error de conexión al cargar cuentas de correo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmails(selectedHostingId || undefined);
    }
  }, [user, selectedHostingId]);

  // Generate a random strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  // Handle Create Email
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHosting) return;
    if (!newPrefix.trim() || !newDomain.trim() || !newPassword.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${basePath}/api/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hostingId: currentHosting.id,
          email: newPrefix.trim(),
          domain: newDomain.trim(),
          password: newPassword.trim(),
          quotaMb: newIsUnlimited ? 0 : (parseInt(newQuotaMb, 10) || 1024),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al crear la cuenta de correo');
        setActionLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Cuenta de correo creada exitosamente.');
      setShowCreateModal(false);
      setNewPrefix('');
      setNewPassword('');
      fetchEmails(currentHosting.id);
    } catch {
      alert('Error de conexión al crear la cuenta de correo');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHosting || !showPasswordModal) return;
    if (!editPassword.trim()) {
      alert('Ingresa la nueva contraseña');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${basePath}/api/emails`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hostingId: currentHosting.id,
          email: showPasswordModal.user,
          domain: showPasswordModal.domain,
          action: 'password',
          password: editPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al cambiar la contraseña');
        setActionLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Contraseña actualizada.');
      setShowPasswordModal(null);
      setEditPassword('');
    } catch {
      alert('Error de conexión al actualizar contraseña');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Quota
  const handleEditQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHosting || !showQuotaModal) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${basePath}/api/emails`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hostingId: currentHosting.id,
          email: showQuotaModal.user,
          domain: showQuotaModal.domain,
          action: 'quota',
          quotaMb: editIsUnlimited ? 0 : (parseInt(editQuotaMb, 10) || 1024),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al actualizar cuota');
        setActionLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Cuota actualizada.');
      setShowQuotaModal(null);
      fetchEmails(currentHosting.id);
    } catch {
      alert('Error de conexión al actualizar cuota');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteAccount = async () => {
    if (!currentHosting || !showDeleteModal) return;

    setActionLoading(true);
    try {
      const url = `${basePath}/api/emails?hostingId=${encodeURIComponent(currentHosting.id)}&email=${encodeURIComponent(showDeleteModal.user)}&domain=${encodeURIComponent(showDeleteModal.domain)}`;
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al eliminar cuenta');
        setActionLoading(false);
        return;
      }

      setSuccessMessage(data.message || 'Cuenta de correo eliminada.');
      setShowDeleteModal(null);
      fetchEmails(currentHosting.id);
    } catch {
      alert('Error de conexión al eliminar cuenta');
    } finally {
      setActionLoading(false);
    }
  };

  // Max accounts calculation
  const maxAccountsDisplay = useMemo(() => {
    if (!currentHosting) return '—';
    if (!currentHosting.maxEmailAccounts || currentHosting.maxEmailAccounts === 'unlimited') {
      return 'Ilimitadas';
    }
    return String(currentHosting.maxEmailAccounts);
  }, [currentHosting]);

  const canCreateMore = useMemo(() => {
    if (!currentHosting) return false;
    if (!currentHosting.maxEmailAccounts || currentHosting.maxEmailAccounts === 'unlimited') {
      return true;
    }
    const num = Number(currentHosting.maxEmailAccounts);
    return isNaN(num) || accounts.length < num;
  }, [currentHosting, accounts]);

  if (sessionLoading || (!user && !error)) {
    return (
      <AdminLayout>
        <div className="p-30 ta-c">
          <i className="ti-reload ti-spin fsz-xl c-primary" />
          <p className="mT-10 c-grey-600">Cargando módulo de correos corporativos...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid p-20" style={{ background: 'var(--c-bkg-body)', minHeight: '100%' }}>
        
        {/* Header */}
        <div className="row mB-20 ai-c">
          <div className="col-md-6">
            <h4 className="m-0 fw-700 c-grey-900">
              <i className="ti-email c-teal-500 mR-10" />
              Correos Corporativos
            </h4>
            <p className="m-0 c-grey-600 fsz-sm">
              Crea y administra tus cuentas de correo profesional, contraseñas y espacio en disco.
            </p>
          </div>
          <div className="col-md-6 ta-e d-f gap-2 jc-e fxw-w">
            <a
              href="https://instanceshape.com/webmail"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary d-if ai-c gap-2"
              title="Abrir Webmail en nueva pestaña"
            >
              <i className="ti-share" />
              <span>Abrir Webmail</span>
            </a>
            <button
              type="button"
              className="btn btn-primary d-if ai-c gap-2"
              onClick={() => {
                setNewPassword(generatePassword());
                setShowCreateModal(true);
              }}
              disabled={!canCreateMore || !currentHosting}
            >
              <i className="ti-plus" />
              <span>Crear Cuenta de Correo</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show d-f ai-c jc-sb mB-20" role="alert">
            <div>
              <i className="ti-check mR-10" />
              <strong>{successMessage}</strong>
            </div>
            <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)} />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show d-f ai-c jc-sb mB-20" role="alert">
            <div>
              <i className="ti-alert mR-10" />
              <strong>{error}</strong>
            </div>
            <button type="button" className="btn-close" onClick={() => setError(null)} />
          </div>
        )}

        {/* Hosting Selector & Summary Cards */}
        <div className="row mB-20">
          <div className="col-md-4 mB-15">
            <div className="bgc-white p-20 bd bdrs-10 h-100 shadow-sm">
              <label className="form-label fsz-xs fw-700 text-uppercase c-grey-600 mB-5">
                Servicio de Hosting Seleccionado
              </label>
              {hostings.length > 1 ? (
                <select
                  className="form-select fw-600"
                  value={selectedHostingId}
                  onChange={(e) => setSelectedHostingId(e.target.value)}
                >
                  {hostings.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.username} — {h.packageName} ({h.domains.join(', ') || 'Sin dominio'})
                    </option>
                  ))}
                </select>
              ) : currentHosting ? (
                <div>
                  <h5 className="m-0 fw-700 c-grey-900">{currentHosting.username}</h5>
                  <span className="badge bg-primary mT-5">{currentHosting.packageName}</span>
                </div>
              ) : (
                <span className="c-grey-500">Sin hosting asignado</span>
              )}
            </div>
          </div>

          <div className="col-md-4 mB-15">
            <div className="bgc-white p-20 bd bdrs-10 h-100 shadow-sm d-f ai-c gap-3">
              <div
                className="bdrs-50p d-f ai-c jc-c"
                style={{ width: 48, height: 48, background: '#e0f2fe', color: '#0284c7' }}
              >
                <i className="ti-email fsz-lg" />
              </div>
              <div>
                <span className="fsz-xs fw-700 text-uppercase c-grey-600">Cuentas Creadas</span>
                <h4 className="m-0 fw-700 c-grey-900">
                  {accounts.length} <span className="fsz-sm fw-normal c-grey-600">/ {maxAccountsDisplay}</span>
                </h4>
              </div>
            </div>
          </div>

          <div className="col-md-4 mB-15">
            <div className="bgc-white p-20 bd bdrs-10 h-100 shadow-sm d-f ai-c gap-3">
              <div
                className="bdrs-50p d-f ai-c jc-c"
                style={{ width: 48, height: 48, background: '#fef3c7', color: '#d97706' }}
              >
                <i className="ti-harddrives fsz-lg" />
              </div>
              <div>
                <span className="fsz-xs fw-700 text-uppercase c-grey-600">Espacio Asignado</span>
                <h4 className="m-0 fw-700 c-grey-900">
                  {currentHosting?.diskSpaceQuotaMb
                    ? `${Number(currentHosting.diskSpaceQuotaMb).toLocaleString()} MB`
                    : 'Ilimitado'}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Email Accounts Table */}
        <div className="bgc-white bd bdrs-10 shadow-sm mB-30">
          <div className="p-20 border-bottom d-f ai-c jc-sb">
            <h5 className="m-0 fw-700 c-grey-900">
              Buzones Activos en el Servidor ({accounts.length})
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => fetchEmails(selectedHostingId)}
              disabled={loading}
              title="Refrescar lista"
            >
              <i className={`ti-reload ${loading ? 'ti-spin' : ''}`} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light fsz-xs text-uppercase c-grey-600">
                <tr>
                  <th style={{ padding: '14px 20px' }}>Cuenta de Correo</th>
                  <th style={{ padding: '14px 20px' }}>Uso de Disco / Cuota</th>
                  <th style={{ padding: '14px 20px' }}>Estado</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="ta-c p-30 c-grey-600">
                      <i className="ti-reload ti-spin fsz-lg c-primary mR-10" />
                      Consultando cuentas en cPanel...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="ta-c p-40">
                      <i className="ti-email c-grey-400" style={{ fontSize: 42 }} />
                      <h6 className="mT-15 fw-600 c-grey-800">Aún no tienes cuentas de correo creadas</h6>
                      <p className="c-grey-600 fsz-sm">
                        Crea tu primera cuenta corporativa haciendo clic en el botón superior.
                      </p>
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => {
                    const percent = Math.min(acc.diskusedpercent || 0, 100);
                    const barColor = percent > 90 ? '#ef4444' : percent > 75 ? '#f59e0b' : '#10b981';

                    return (
                      <tr key={acc.email}>
                        <td style={{ padding: '14px 20px' }}>
                          <div className="d-f ai-c gap-3">
                            <div
                              className="bdrs-50p d-f ai-c jc-c bgc-grey-100"
                              style={{ width: 38, height: 38, color: '#475569' }}
                            >
                              <i className="ti-user" />
                            </div>
                            <div>
                              <strong className="c-grey-900 fsz-sm d-b">{acc.email}</strong>
                              <span className="c-grey-500 fsz-xs">Dominio: {acc.domain}</span>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px', minWidth: 220 }}>
                          <div className="d-f jc-sb fsz-xs c-grey-600 mB-5">
                            <span>{acc.humandiskused} usados</span>
                            <span className="fw-600">{acc.humandiskquota}</span>
                          </div>
                          <div className="progress" style={{ height: 6 }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${percent}%`, backgroundColor: barColor }}
                              aria-valuenow={percent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px' }}>
                          {acc.suspendedLogin ? (
                            <span className="badge bg-danger rounded-pill">Suspendida</span>
                          ) : (
                            <span className="badge bg-success rounded-pill">Activa</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div className="d-f gap-2 jc-e">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary p-8"
                              onClick={() => {
                                setEditPassword(generatePassword());
                                setShowPasswordModal(acc);
                              }}
                              title="Cambiar contraseña"
                            >
                              <i className="ti-key" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-info p-8"
                              onClick={() => {
                                setEditQuotaMb(acc.diskquota === 'unlimited' ? '1024' : String(parseInt(acc.diskquota, 10) || 1024));
                                setEditIsUnlimited(acc.diskquota === 'unlimited');
                                setShowQuotaModal(acc);
                              }}
                              title="Cambiar cuota de espacio"
                            >
                              <i className="ti-harddrives" />
                            </button>
                            <a
                              href="https://instanceshape.com/webmail"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary p-8"
                              title="Ingresar a Webmail"
                            >
                              <i className="ti-share" />
                            </a>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger p-8"
                              onClick={() => setShowDeleteModal(acc)}
                              title="Eliminar cuenta"
                            >
                              <i className="ti-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Configuration Guide Card */}
        <div className="bgc-white bd bdrs-10 shadow-sm p-25 mB-30">
          <h5 className="fw-700 c-grey-900 mB-15">
            <i className="ti-settings c-blue-500 mR-10" />
            Parámetros de Conexión para Outlook, Gmail y Dispositivos Móviles
          </h5>
          <div className="row">
            <div className="col-md-6 mB-15">
              <div className="p-15 bdrs-8" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h6 className="fw-700 c-grey-900 mB-10">📥 Servidor de Correo Entrante (IMAP)</h6>
                <ul className="list-unstyled fsz-sm c-grey-800 m-0" style={{ lineHeight: 1.8 }}>
                  <li><strong>Servidor:</strong> <code>mail.{currentHosting?.domains[0] || 'tudominio.com'}</code> (o <code>instanceshape.com</code>)</li>
                  <li><strong>Puerto IMAP:</strong> <code>993</code> (con cifrado SSL/TLS)</li>
                  <li><strong>Usuario:</strong> Tu dirección de correo completa</li>
                  <li><strong>Contraseña:</strong> La clave asignada a la casilla</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 mB-15">
              <div className="p-15 bdrs-8" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h6 className="fw-700 c-grey-900 mB-10">📤 Servidor de Correo Saliente (SMTP)</h6>
                <ul className="list-unstyled fsz-sm c-grey-800 m-0" style={{ lineHeight: 1.8 }}>
                  <li><strong>Servidor:</strong> <code>mail.{currentHosting?.domains[0] || 'tudominio.com'}</code> (o <code>instanceshape.com</code>)</li>
                  <li><strong>Puerto SMTP:</strong> <code>465</code> (con cifrado SSL/TLS) o <code>587</code> (STARTTLS)</li>
                  <li><strong>Autenticación:</strong> Requerida (mismo usuario y contraseña)</li>
                  <li><strong>Seguridad:</strong> Certificados SSL automáticos activos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: Crear Cuenta */}
      {showCreateModal && currentHosting && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleCreateAccount}>
                <div className="modal-header">
                  <h5 className="modal-title fw-700">Crear Nueva Cuenta de Correo</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-600 fsz-sm">Dirección de Correo *</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="ej. ventas o contacto"
                        value={newPrefix}
                        onChange={(e) => setNewPrefix(e.target.value)}
                        required
                        disabled={actionLoading}
                      />
                      <span className="input-group-text">@</span>
                      <select
                        className="form-select"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        disabled={actionLoading}
                      >
                        {currentHosting.domains.map((dom) => (
                          <option key={dom} value={dom}>{dom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-f jc-sb ai-c mB-5">
                      <label className="form-label fw-600 fsz-sm m-0">Contraseña Segura *</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 td-n fsz-xs"
                        onClick={() => setNewPassword(generatePassword())}
                      >
                        Generar aleatoria
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={actionLoading}
                    />
                    <small className="form-text text-muted">Asegúrate de copiar y guardar esta contraseña.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-600 fsz-sm">Cuota de Almacenamiento</label>
                    <div className="form-check mB-10">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="unlimitedCheck"
                        checked={newIsUnlimited}
                        onChange={(e) => setNewIsUnlimited(e.target.checked)}
                        disabled={actionLoading}
                      />
                      <label className="form-check-label fsz-sm" htmlFor="unlimitedCheck">
                        Espacio ilimitado (hasta la capacidad del plan)
                      </label>
                    </div>
                    {!newIsUnlimited && (
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          min="100"
                          step="100"
                          value={newQuotaMb}
                          onChange={(e) => setNewQuotaMb(e.target.value)}
                          required
                          disabled={actionLoading}
                        />
                        <span className="input-group-text">MB</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={actionLoading}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Creando en cPanel...' : 'Crear Cuenta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleChangePassword}>
                <div className="modal-header">
                  <h5 className="modal-title fw-700">Cambiar Contraseña</h5>
                  <button type="button" className="btn-close" onClick={() => setShowPasswordModal(null)} />
                </div>
                <div className="modal-body">
                  <p className="fsz-sm c-grey-700">
                    Vas a cambiar la contraseña para: <strong>{showPasswordModal.email}</strong>
                  </p>
                  <div className="mb-3">
                    <div className="d-f jc-sb ai-c mB-5">
                      <label className="form-label fw-600 fsz-sm m-0">Nueva Contraseña *</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 td-n fsz-xs"
                        onClick={() => setEditPassword(generatePassword())}
                      >
                        Generar aleatoria
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      required
                      disabled={actionLoading}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(null)} disabled={actionLoading}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Cuota */}
      {showQuotaModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleEditQuota}>
                <div className="modal-header">
                  <h5 className="modal-title fw-700">Editar Cuota de Disco</h5>
                  <button type="button" className="btn-close" onClick={() => setShowQuotaModal(null)} />
                </div>
                <div className="modal-body">
                  <p className="fsz-sm c-grey-700">
                    Ajustar límite de espacio para: <strong>{showQuotaModal.email}</strong>
                  </p>
                  <div className="mb-3">
                    <div className="form-check mB-10">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="unlimitedEditCheck"
                        checked={editIsUnlimited}
                        onChange={(e) => setEditIsUnlimited(e.target.checked)}
                        disabled={actionLoading}
                      />
                      <label className="form-check-label fsz-sm" htmlFor="unlimitedEditCheck">
                        Espacio ilimitado
                      </label>
                    </div>
                    {!editIsUnlimited && (
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          min="100"
                          step="100"
                          value={editQuotaMb}
                          onChange={(e) => setEditQuotaMb(e.target.value)}
                          required
                          disabled={actionLoading}
                        />
                        <span className="input-group-text">MB</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowQuotaModal(null)} disabled={actionLoading}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Guardando...' : 'Actualizar Cuota'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Eliminar Cuenta */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-700 text-danger">Eliminar Cuenta de Correo</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(null)} />
              </div>
              <div className="modal-body">
                <p className="fsz-sm c-grey-800">
                  ¿Estás seguro de que deseas eliminar la cuenta de correo <strong>{showDeleteModal.email}</strong>?
                </p>
                <div className="alert alert-warning fsz-xs m-0">
                  ⚠️ <strong>Atención:</strong> Todos los mensajes, archivos adjuntos y carpetas contenidos en este buzón serán eliminados de forma permanente del servidor.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(null)} disabled={actionLoading}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteAccount} disabled={actionLoading}>
                  {actionLoading ? 'Eliminando...' : 'Sí, Eliminar Cuenta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default function EmailsPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <div className="p-30 ta-c">
            <i className="ti-reload ti-spin fsz-xl c-primary" />
            <p className="mT-10 c-grey-600">Cargando correos corporativos...</p>
          </div>
        </AdminLayout>
      }
    >
      <EmailsContent />
    </Suspense>
  );
}
