'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: redirect al dashboard (luego conectar con auth real)
    router.push('/dashboard');
  };

  return (
    <div className="d-f ai-c jc-c" style={{ minHeight: '100vh', background: 'var(--c-bkg-body)' }}>
      <div className="bd bgc-white p-40 bdrs-10" style={{ width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-lg)' }}>
        <div className="ta-c mB-30">
          <Link href="/" className="td-n">
            <Image
              src="/assets/static/images/logo.svg"
              alt="Adminator"
              width={60}
              height={60}
              className="mB-15"
            />
          </Link>
          <h4 className="m-0">Iniciar sesión</h4>
          <p className="c-grey-600 fsz-sm mT-5">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>

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
            />
          </div>
          <div className="mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="signin-remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="signin-remember">
                Recordarme
              </label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Entrar
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
