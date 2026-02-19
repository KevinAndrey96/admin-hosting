'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { useSession } from '../../../hooks/useSession';
import { generateSecurePassword } from '@/lib/password-utils';

type ClientData = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  address: string | null;
  zipCode: string | null;
  status: string;
};

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: sessionLoading } = useSession();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('ENABLED');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/clients/${id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setClient(data);
          setFullName(data.fullName || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setCompanyName(data.companyName || '');
          setAddress(data.address || '');
          setZipCode(data.zipCode || '');
          setStatus(data.status || 'ENABLED');
        } else {
          setClient(null);
        }
      } catch {
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'ADMIN' && id) {
      fetchClient();
    }
  }, [user?.role, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!fullName.trim()) {
      setMessage({ type: 'error', text: 'El nombre es requerido.' });
      return;
    }
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'El correo electrónico es requerido.' });
      return;
    }
    if (password && password.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    setSaving(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          companyName: companyName || undefined,
          address: address || undefined,
          zipCode: zipCode || undefined,
          password: password || undefined,
          status,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar.' });
        return;
      }

      setMessage({ type: 'success', text: 'Cliente actualizado correctamente.' });
      setClient((prev) => (prev ? { ...prev, ...data } : null));
      setFullName(data.fullName ?? fullName);
      setEmail(data.email ?? email);
      setCompanyName(data.companyName ?? '');
      setAddress(data.address ?? '');
      setZipCode(data.zipCode ?? '');
      setPassword('');
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || user?.role !== 'ADMIN') {
    return null;
  }

  if (loading || !client) {
    return (
      <AdminLayout>
        <div className="container-fluid p-40 ta-c c-grey-600">
          {loading ? 'Cargando...' : 'Cliente no encontrado.'}
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
        <div className="row mB-20 w-100" style={{ maxWidth: 640 }}>
          <div className="col-12">
            <Link href="/clients" className="c-primary fsz-sm td-n mB-10 d-ib fw-500">
              ← Volver a clientes
            </Link>
            <h4 className="m-0 mT-5 c-grey-900">Editar cliente</h4>
            <p className="c-grey-700 fsz-sm mT-5">
              {client.fullName} — {client.email}
            </p>
          </div>
        </div>

        <div className="row w-100" style={{ maxWidth: 640 }}>
          <div className="col-12">
            <div className="bd bgc-white p-30 bdrs-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <form onSubmit={handleSubmit}>
                <h6 className="mB-20">Información del cliente</h6>
                <div className="mb-3">
                  <label htmlFor="fullName" className="form-label">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="3100000000"
                    maxLength={10}
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="companyName" className="form-label">
                    Razón social
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="address" className="form-label">
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="zipCode" className="form-label">
                    Código postal
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Restablecer contraseña
                  </label>
                  <div className="d-f gap-2 ai-c">
                    <input
                      type="text"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Dejar vacío para no cambiar"
                      disabled={saving}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setPassword(generateSecurePassword())}
                      disabled={saving}
                      title="Generar contraseña segura"
                    >
                      <i className="ti-wand" />
                    </button>
                  </div>
                  <div className="form-text">Mínimo 8 caracteres. Vacío = no se modifica.</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">
                    Estado
                  </label>
                  <select
                    className="form-select"
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={saving}
                  >
                    <option value="ENABLED">Habilitado</option>
                    <option value="DISABLED">Deshabilitado</option>
                  </select>
                  <div className="form-text">Habilitado: puede iniciar sesión. Deshabilitado: acceso bloqueado.</div>
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
                    href="/clients"
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
