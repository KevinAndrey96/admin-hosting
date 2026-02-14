'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSettings } from '@/app/hooks/useSettings';

export default function SignInPage() {
  const { logoUrl, companyName } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    setLoading(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember,
        }),
      });

      const text = await res.text();
      let data: { error?: string };
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(`Error del servidor (${res.status}). La API no devolvió JSON válido.`);
        console.error('API response:', text?.slice(0, 300));
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
      router.refresh();
    } catch {
      setError('Error de conexión. Verifica que el servidor esté corriendo y la base de datos accesible.');
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
          <h4 className="m-0">Iniciar sesión</h4>
          <p className="c-grey-600 fsz-sm mT-5">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>

        {error && (
          <div className="alert alert-danger mB-20" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="signin-email" className="form-label">
              Correo electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="signin-email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signin-password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="signin-password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3 d-f jc-sb ai-c">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="signin-remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <label className="form-check-label" htmlFor="signin-remember">
                Recordarme
              </label>
            </div>
            <Link href="/forgot-password" className="fsz-sm c-primary fw-600">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="ta-c mT-20 fsz-sm c-grey-600">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="c-primary fw-600">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
