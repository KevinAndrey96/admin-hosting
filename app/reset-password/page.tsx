'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettings } from '@/app/hooks/useSettings';

function ResetPasswordForm() {
  const { logoUrl, companyName } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?"');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) return;

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Error al actualizar la contraseña');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/signin'), 2000);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-f ai-c jc-c" style={{ minHeight: '100vh', background: 'var(--c-bkg-body)' }}>
      <div className="bd bgc-white p-40 bdrs-10" style={{ width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)' }}>
        <div className="ta-c mB-30">
          <Link href="/" className="td-n">
            <Image
              src={logoUrl}
              alt={companyName}
              width={60}
              height={60}
              className="mB-15"
              unoptimized
            />
          </Link>
          <h4 className="m-0">Nueva contraseña</h4>
          <p className="c-grey-600 fsz-sm mT-5">Ingresa tu nueva contraseña</p>
        </div>

        {error && (
          <div className="alert alert-danger mB-20" role="alert">
            {error}
          </div>
        )}

        {success ? (
          <div className="alert alert-success mB-20" role="alert">
            Contraseña actualizada correctamente. Redirigiendo a iniciar sesión...
          </div>
        ) : token ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="reset-password" className="form-label">
                Nueva contraseña
              </label>
              <input
                type="password"
                className="form-control"
                id="reset-password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="reset-confirm" className="form-label">
                Confirmar contraseña
              </label>
              <input
                type="password"
                className="form-control"
                id="reset-confirm"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        ) : null}

        <p className="ta-c mT-20 fsz-sm c-grey-600">
          <Link href="/signin" className="c-primary fw-600">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="d-f ai-c jc-c" style={{ minHeight: '100vh', background: 'var(--c-bkg-body)' }}>
          <span className="c-grey-600">Cargando...</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
