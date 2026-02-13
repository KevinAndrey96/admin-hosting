'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: could authenticate here
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
          <h4 className="m-0">Sign In</h4>
          <p className="c-grey-600 fsz-sm mT-5">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="signin-username" className="form-label">
              Username
            </label>
            <input
              type="text"
              className="form-control"
              id="signin-username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signin-password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="signin-password"
              placeholder="Password"
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
                Remember Me
              </label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>

        <p className="ta-c mT-20 fsz-sm c-grey-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="c-primary fw-600">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
