'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: could register here
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
          <h4 className="m-0">Register</h4>
          <p className="c-grey-600 fsz-sm mT-5">Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="signup-username" className="form-label">
              Username
            </label>
            <input
              type="text"
              className="form-control"
              id="signup-username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              id="signup-email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="signup-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="signup-confirm" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              className="form-control"
              id="signup-confirm"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Register
          </button>
        </form>

        <p className="ta-c mT-20 fsz-sm c-grey-600">
          Already have an account?{' '}
          <Link href="/signin" className="c-primary fw-600">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
