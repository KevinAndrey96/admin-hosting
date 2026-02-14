'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/app/hooks/useSettings';
import { useSession } from '@/app/hooks/useSession';

// Hide demo options (Go Pro, Email, Compose, etc.) - set to false to show them
const HIDE_DEMO_ITEMS = true;

export default function Sidebar() {
  const pathname = usePathname();
  const { logoUrl, companyName } = useSettings();
  const { user } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const hiddenStyle = HIDE_DEMO_ITEMS ? { display: 'none' as const } : undefined;

  useEffect(() => {
    if (pathname?.startsWith('/tables')) setOpenDropdown('tables');
    else if (pathname?.startsWith('/maps')) setOpenDropdown('maps');
    else if (pathname && ['/blank', '/error-404', '/error-500', '/signin', '/signup'].includes(pathname)) setOpenDropdown('pages');
    else setOpenDropdown(null);
  }, [pathname]);

  const toggleDropdown = (id: string) => (e: React.MouseEvent) => {
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
  return (
    <div className="sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-logo">
          <div className="peers ai-c fxw-nw">
            <div className="peer peer-greed">
              <Link href="/dashboard" className="sidebar-link td-n">
                <div className="logo">
                  <Image
                    src={logoUrl}
                    alt={companyName}
                    width={42}
                    height={42}
                    style={{ display: 'block', margin: '11px auto' }}
                    unoptimized
                  />
                </div>
              </Link>
            </div>
            <div className="peer">
              <div className="mobile-toggle sidebar-toggle">
                <a href="#" className="td-n" aria-label="Toggle menu" onClick={handleSidebarToggle}>
                  <i className="ti-arrow-circle-left" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <ul className="sidebar-menu scrollable pos-r">
          <li className={`nav-item mT-30 ${pathname === '/dashboard' ? 'actived' : ''}`}>
            <Link href="/dashboard" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-blue-500 ti-home" />
              </span>
              <span className="title">Inicio</span>
            </Link>
          </li>
          <li className={`nav-item ${pathname === '/profile' ? 'actived' : ''}`}>
            <Link href="/profile" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-indigo-500 ti-user" />
              </span>
              <span className="title">Mi cuenta</span>
            </Link>
          </li>
          <li className={`nav-item ${pathname === '/pago' ? 'actived' : ''}`}>
            <Link href="/pago" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-green-500 ti-wallet" />
              </span>
              <span className="title">Pago</span>
            </Link>
          </li>
          {user?.role === 'ADMIN' && (
            <li className={`nav-item ${pathname?.startsWith('/clients') ? 'actived' : ''}`}>
              <Link href="/clients" className="sidebar-link">
                <span className="icon-holder">
                  <i className="c-green-500 ti-agenda" />
                </span>
                <span className="title">Clientes</span>
              </Link>
            </li>
          )}
          <li className={`nav-item ${pathname?.startsWith('/domains') ? 'actived' : ''}`}>
            <Link href="/domains" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-cyan-500 ti-world" />
              </span>
              <span className="title">Dominios</span>
            </Link>
          </li>
          <li className={`nav-item ${pathname?.startsWith('/hosting') ? 'actived' : ''}`}>
            <Link href="/hosting" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-orange-500 ti-server" />
              </span>
              <span className="title">Hosting</span>
            </Link>
          </li>
          {user?.role === 'ADMIN' && (
            <>
              <li className={`nav-item ${pathname?.startsWith('/packages') ? 'actived' : ''}`}>
                <Link href="/packages" className="sidebar-link">
                  <span className="icon-holder">
                    <i className="c-amber-500 ti-package" />
                  </span>
                  <span className="title">Paquetes</span>
                </Link>
              </li>
              <li className={`nav-item ${pathname === '/settings' ? 'actived' : ''}`}>
                <Link href="/settings" className="sidebar-link">
                  <span className="icon-holder">
                    <i className="c-teal-500 ti-settings" />
                  </span>
                  <span className="title">Configuración</span>
                </Link>
              </li>
            </>
          )}
          <li className="nav-item" style={hiddenStyle}>
            <a className="sidebar-link" href="https://dashboardpack.com/?utm_source=adminator&utm_medium=sidebar&utm_campaign=go_pro" target="_blank" rel="noopener noreferrer">
              <span className="icon-holder">
                <i className="c-purple-500 ti-crown" />
              </span>
              <span className="title">Go Pro <span className="badge bg-primary ms-2">PRO</span></span>
            </a>
          </li>
          <li className="nav-item" style={hiddenStyle}>
            <Link href="/email" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-brown-500 ti-email" />
              </span>
              <span className="title">Email</span>
            </Link>
          </li>
          <li className="nav-item" style={hiddenStyle}>
            <Link href="/compose" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-blue-500 ti-share" />
              </span>
              <span className="title">Compose</span>
            </Link>
          </li>
          <li className="nav-item" style={hiddenStyle}>
            <Link href="/calendar" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-deep-orange-500 ti-calendar" />
              </span>
              <span className="title">Calendar <span className="badge bg-danger ms-2">HOT</span></span>
            </Link>
          </li>
          <li className="nav-item" style={hiddenStyle}>
            <Link href="/chat" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-deep-purple-500 ti-comment-alt" />
              </span>
              <span className="title">Chat</span>
            </Link>
          </li>
          <li className="nav-item" style={hiddenStyle}>
            <Link href="/charts" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-indigo-500 ti-bar-chart" />
              </span>
              <span className="title">Charts <span className="badge bg-success ms-2">NEW</span></span>
            </Link>
          </li>
          <li className="nav-item" style={hiddenStyle}>
            <Link href="/forms" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-light-blue-500 ti-pencil" />
              </span>
              <span className="title">Forms</span>
            </Link>
          </li>
          <li className="nav-item dropdown" style={hiddenStyle}>
            <Link href="/ui" className="sidebar-link">
              <span className="icon-holder">
                <i className="c-pink-500 ti-palette" />
              </span>
              <span className="title">UI Elements</span>
            </Link>
          </li>
          <li className={`nav-item dropdown ${openDropdown === 'tables' ? 'open' : ''}`} style={hiddenStyle}>
            <a className="dropdown-toggle sidebar-link" href="#" onClick={toggleDropdown('tables')} role="button">
              <span className="icon-holder">
                <i className="c-orange-500 ti-layout-list-thumb" />
              </span>
              <span className="title">Tables</span>
              <span className="arrow">
                <i className="ti-angle-right" />
              </span>
            </a>
            <ul className="dropdown-menu">
              <li>
                <Link href="/tables/basic" className="sidebar-dropdown-link">Basic Table</Link>
              </li>
              <li>
                <Link href="/tables/data" className="sidebar-dropdown-link">Data Table <span className="badge bg-success ms-1">NEW</span></Link>
              </li>
            </ul>
          </li>
          <li className={`nav-item dropdown ${openDropdown === 'maps' ? 'open' : ''}`} style={hiddenStyle}>
            <a className="dropdown-toggle sidebar-link" href="#" onClick={toggleDropdown('maps')} role="button">
              <span className="icon-holder">
                <i className="c-purple-500 ti-map" />
              </span>
              <span className="title">Maps</span>
              <span className="arrow">
                <i className="ti-angle-right" />
              </span>
            </a>
            <ul className="dropdown-menu">
              <li><Link href="/maps/google" className="sidebar-dropdown-link">Google Map</Link></li>
              <li><Link href="/maps/vector" className="sidebar-dropdown-link">Vector Map</Link></li>
            </ul>
          </li>
          <li className={`nav-item dropdown ${openDropdown === 'pages' ? 'open' : ''}`} style={hiddenStyle}>
            <a className="dropdown-toggle sidebar-link" href="#" onClick={toggleDropdown('pages')} role="button">
              <span className="icon-holder">
                <i className="c-red-500 ti-files" />
              </span>
              <span className="title">Pages</span>
              <span className="arrow">
                <i className="ti-angle-right" />
              </span>
            </a>
            <ul className="dropdown-menu">
              <li><Link href="/blank" className="sidebar-dropdown-link">Blank</Link></li>
              <li><Link href="/error-404" className="sidebar-dropdown-link">404</Link></li>
              <li><Link href="/error-500" className="sidebar-dropdown-link">500</Link></li>
              <li><Link href="/signin" className="sidebar-dropdown-link">Iniciar sesión</Link></li>
              <li><Link href="/signup" className="sidebar-dropdown-link">Registro</Link></li>
            </ul>
          </li>
          <li className={`nav-item dropdown ${openDropdown === 'levels' ? 'open' : ''}`} style={hiddenStyle}>
            <a className="dropdown-toggle sidebar-link" href="#" onClick={toggleDropdown('levels')} role="button">
              <span className="icon-holder">
                <i className="c-teal-500 ti-view-list-alt" />
              </span>
              <span className="title">Multiple Levels</span>
              <span className="arrow">
                <i className="ti-angle-right" />
              </span>
            </a>
            <ul className="dropdown-menu">
              <li><a href="#" className="sidebar-dropdown-link">Menu Item</a></li>
              <li><a href="#" className="sidebar-dropdown-link">Menu Item</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}
