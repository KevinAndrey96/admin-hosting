'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!fullName.trim()) {
      setError('El nombre completo es requerido');
      return;
    }

    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrar');
        return;
      }

      router.push('/signin');
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
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/static/images/logo.svg`}
              alt="Adminator"
              width={60}
              height={60}
              className="mB-15"
            />
          </Link>
          <h4 className="m-0">Registro</h4>
          <p className="c-grey-600 fsz-sm mT-5">Crea tu cuenta</p>
        </div>

        {error && (
          <div className="alert alert-danger mB-20" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="signup-fullname" className="form-label">
              Nombre completo
            </label>
            <input
              type="text"
              className="form-control"
              id="signup-fullname"
              placeholder="Tu nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-email" className="form-label">
              Correo electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="signup-email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-phone" className="form-label">
              Teléfono
            </label>
            <input
              type="tel"
              className="form-control"
              id="signup-phone"
              placeholder="+52 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="signup-password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <small className="form-text text-muted">
              Mínimo {MIN_PASSWORD_LENGTH} caracteres
            </small>
          </div>
          <div className="mb-3">
            <label htmlFor="signup-confirm" className="form-label">
              Repetir contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="signup-confirm"
              placeholder="Repetir contraseña"
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
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="ta-c mT-20 fsz-sm c-grey-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/signin" className="c-primary fw-600">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
