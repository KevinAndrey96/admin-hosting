'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/app/hooks/useSettings';

export default function ForgotPasswordPage() {
  const { logoUrl, companyName } = useSettings();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    setLoading(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Error al procesar la solicitud');
        return;
      }

      setSuccess(true);
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
          <h4 className="m-0">¿Olvidaste tu contraseña?</h4>
          <p className="c-grey-600 fsz-sm mT-5">
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </p>
        </div>

        {error && (
          <div className="alert alert-danger mB-20" role="alert">
            {error}
          </div>
        )}

        {success ? (
          <div className="alert alert-success mB-20" role="alert">
            Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu
            contraseña. Revisa tu bandeja de entrada y spam.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="forgot-email" className="form-label">
                Correo electrónico
              </label>
              <input
                type="email"
                className="form-control"
                id="forgot-email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <p className="ta-c mT-20 fsz-sm c-grey-600">
          <Link href="/signin" className="c-primary fw-600">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
