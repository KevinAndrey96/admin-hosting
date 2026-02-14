'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import { useSession } from '../../hooks/useSession';
import { generateSecurePassword } from '@/lib/password-utils';

export default function NewClientPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [status, setStatus] = useState('ENABLED');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName,
          email,
          phone: phone || undefined,
          companyName: companyName || undefined,
          address: address || undefined,
          zipCode: zipCode || undefined,
          status,
          password: password || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al crear cliente.' });
        return;
      }

      setMessage({ type: 'success', text: data.message || 'Cliente creado correctamente.' });
      setTimeout(() => router.push('/clients'), 1500);
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
            maxWidth: 480,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: 'none',
            borderRadius: 12,
          }}
        >
          <div className="card-body p-30">
            <Link href="/clients" className="c-primary fsz-sm td-n d-ib fw-500 mB-15">
              ← Volver a clientes
            </Link>
            <h4 className="m-0 c-grey-900 fw-600">Nuevo cliente</h4>
            <p className="c-grey-600 fsz-sm mT-5 mB-25">Crea un nuevo cliente con acceso al portal</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="fullName" className="form-label fw-500">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                  disabled={saving}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-500">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={saving}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="phone" className="form-label fw-500">
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="form-control form-control-lg"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="3100000000"
                  maxLength={10}
                  disabled={saving}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="companyName" className="form-label fw-500">
                  Razón social
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Empresa SAS"
                  disabled={saving}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="address" className="form-label fw-500">
                  Dirección
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Calle 123 # 45-67"
                  disabled={saving}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="zipCode" className="form-label fw-500">
                  Código postal
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Ej: 111156"
                  disabled={saving}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="status" className="form-label fw-500">
                  Estado
                </label>
                <select
                  className="form-select form-select-lg"
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={saving}
                >
                  <option value="ENABLED">Habilitado</option>
                  <option value="DISABLED">Deshabilitado</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-500">
                  Contraseña inicial
                </label>
                <div className="d-f gap-2 ai-c">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Dejar vacío para que use ¿Olvidaste tu contraseña?"
                    minLength={8}
                    disabled={saving}
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
                <div className="form-text mT-5">
                  Si se deja vacío, el cliente puede usar "¿Olvidaste tu contraseña?" para definirla.
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
                  {saving ? 'Creando...' : 'Crear cliente'}
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
    </AdminLayout>
  );
}
