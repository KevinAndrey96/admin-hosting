'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import { useSession } from '../hooks/useSession';

type HeaderDropdown = 'user' | null;

export default function Topbar() {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { user } = useSession();
  const [searchActive, setSearchActive] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<HeaderDropdown>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchActive((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return next;
    });
  };

  const toggleHeaderDropdown = (id: HeaderDropdown) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleSidebarToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    document.body.classList.toggle('is-collapsed');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sidebar:toggle', {
        detail: { collapsed: document.body.classList.contains('is-collapsed') },
      }));
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!searchActive && !target.closest('.search-box') && !target.closest('.search-input')) {
        setSearchActive(false);
      }
      if (!target.closest('.nav-right .dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchActive]);

  return (
    <div className="header navbar">
      <div className="header-container">
        <ul className="nav-left">
          <li>
            <a id="sidebar-toggle" className="sidebar-toggle" href="#" aria-label="Toggle sidebar" onClick={handleSidebarToggle}>
              <i className="ti-menu" />
            </a>
          </li>
          <li className={`search-box ${searchActive ? 'active' : ''}`}>
            <a className="search-toggle no-pdd-right" href="#" aria-label="Search" onClick={handleSearchToggle}>
              <i className="search-icon ti-search pdd-right-10" />
              <i className="search-icon-close ti-close pdd-right-10" />
            </a>
          </li>
          <li className={`search-input ${searchActive ? 'active' : ''}`}>
            <input ref={searchInputRef} className="form-control" type="text" placeholder="Search..." />
          </li>
        </ul>
        <ul className="nav-right">
          <li className="theme-toggle d-flex ai-c">
            {mounted && (
              <div className="form-check form-switch d-flex ai-c" style={{ margin: 0, padding: 0 }} role="group" aria-label="Theme switcher">
                <label className="form-check-label me-2 text-nowrap c-grey-700" htmlFor="theme-toggle" style={{ fontSize: '12px', marginRight: '8px' }}>
                  <i className="ti-sun" aria-hidden style={{ marginRight: '4px' }} />
                  <span className="theme-label">Light</span>
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="theme-toggle"
                  role="switch"
                  aria-checked={theme === 'dark'}
                  aria-label="Toggle dark mode"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  style={{ margin: 0, cursor: 'pointer' }}
                />
                <label className="form-check-label ms-2 text-nowrap c-grey-700" htmlFor="theme-toggle" style={{ fontSize: '12px', marginLeft: '8px' }}>
                  <span className="theme-label">Dark</span>
                  <i className="ti-moon" aria-hidden style={{ marginLeft: '4px' }} />
                </label>
              </div>
            )}
          </li>
          <li className={`dropdown ${openDropdown === 'user' ? 'show' : ''}`}>
            <a href="#" className="dropdown-toggle no-after peers fxw-nw ai-c lh-1" onClick={toggleHeaderDropdown('user')} role="button" aria-expanded={openDropdown === 'user'}>
              <div className="peer mR-10">
                <Image className="w-2r bdrs-50p" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/static/images/profile.png`} alt="" width={32} height={32} />
              </div>
              <div className="peer d-f ai-c gap-2">
                <span className="fsz-sm c-grey-900">{user?.fullName ?? 'Usuario'}</span>
                {user?.role && (
                  <span
                    className="badge rounded-pill fsz-xs fw-600"
                    style={{
                      backgroundColor: user.role === 'ADMIN' ? '#dc3545' : '#20c997',
                      color: '#fff',
                      padding: '4px 10px',
                    }}
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Cliente'}
                  </span>
                )}
              </div>
            </a>
            <ul className={`dropdown-menu fsz-sm ${openDropdown === 'user' ? 'show' : ''}`}>
              {user?.role === 'ADMIN' && (
                <li>
                  <Link href="/settings" className="d-b td-n pY-5 bgcH-grey-100 c-grey-700">
                    <i className="ti-settings mR-10" />
                    <span>Configuración</span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/profile" className="d-b td-n pY-5 bgcH-grey-100 c-grey-700">
                  <i className="ti-user mR-10" />
                  <span>Mi cuenta</span>
                </Link>
              </li>
              <li role="separator" className="divider" />
              <li>
                <a
                  href="#"
                  className="d-b td-n pY-5 bgcH-grey-100 c-grey-700"
                  onClick={async (e) => {
                    e.preventDefault();
                    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
                    await fetch(`${basePath}/api/auth/logout`, { method: 'POST' });
                    router.push('/signin');
                    router.refresh();
                  }}
                >
                  <i className="ti-power-off mR-10" />
                  <span>Cerrar sesión</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
