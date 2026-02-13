'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: redirect al dashboard tras registro (luego conectar con auth real)
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
          <h4 className="m-0">Registro</h4>
          <p className="c-grey-600 fsz-sm mT-5">Crea tu cuenta</p>
        </div>

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
            />
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
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Registrarse
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
