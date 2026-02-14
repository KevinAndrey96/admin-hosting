'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';

type ProfileData = {
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/signin');
    }
  }, [router, sessionLoading, user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const res = await fetch(`${basePath}/api/user/profile`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newPassword || newPassword.length < 8) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setSaving(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar la contraseña.' });
        return;
      }

      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || !user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: '#fff', minHeight: '100%', padding: '24px' }}>
        <div className="card bdrs-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: 'none' }}>
          <div className="card-header bgc-white bdT-0 bdrs-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <h4 className="m-0 c-grey-900 fw-600">Mi cuenta</h4>
            <p className="c-grey-600 fsz-sm mT-5 mB-0">Tu información y configuración de seguridad</p>
          </div>
          <div className="card-body p-24">
            <div className="row gap-20">
              <div className="col-md-6">
                <div className="bd p-20 bdrs-3" style={{ minHeight: 200, backgroundColor: '#f8f9fa' }}>
                  <h6 className="mB-20 c-grey-800 fw-600">Información personal</h6>
              {profileLoading ? (
                <p className="c-grey-600">Cargando...</p>
              ) : profile ? (
                <div className="d-f fxd-c gap-3">
                  <div>
                    <label className="form-label fsz-sm c-grey-600">Nombre</label>
                    <p className="m-0 fw-500">{profile.fullName}</p>
                  </div>
                  <div>
                    <label className="form-label fsz-sm c-grey-600">Correo electrónico</label>
                    <p className="m-0 fw-500">{profile.email}</p>
                  </div>
                  <div>
                    <label className="form-label fsz-sm c-grey-600">Teléfono</label>
                    <p className="m-0 fw-500">{profile.phone || '—'}</p>
                  </div>
                  <div>
                    <label className="form-label fsz-sm c-grey-600">Rol</label>
                    <p className="m-0">
                      <span
                        className="badge rounded-pill fsz-xs"
                        style={{
                          backgroundColor: profile.role === 'ADMIN' ? '#dc3545' : '#20c997',
                          color: '#fff',
                        }}
                      >
                        {profile.role === 'ADMIN' ? 'Admin' : 'Cliente'}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="c-grey-600">No se pudo cargar la información.</p>
              )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="bd p-20 bdrs-3" style={{ minHeight: 200, backgroundColor: '#f8f9fa' }}>
                  <h6 className="mB-20 c-grey-800 fw-600">Cambiar contraseña</h6>
              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label htmlFor="current-password" className="form-label">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    disabled={saving}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="new-password" className="form-label">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={saving}
                    minLength={8}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirm-password" className="form-label">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    disabled={saving}
                    required
                  />
                </div>
                {message && (
                  <div
                    className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mB-20`}
                    role="alert"
                  >
                    {message.text}
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
