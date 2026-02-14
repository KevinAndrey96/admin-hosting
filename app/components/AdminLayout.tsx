'use client';

import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSettings } from '../hooks/useSettings';

export default function AdminLayout({
  children,
  hideFooter,
}: {
  children: React.ReactNode;
  hideFooter?: boolean;
}) {
  const { companyName } = useSettings();

  useEffect(() => {
    // Load Bootstrap JS for dropdowns
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <Sidebar />
      <div className="page-container">
        <Topbar />
        <main className="main-content bgc-grey-100">
          <div id="mainContent">
            {children}
          </div>
        </main>
        {!hideFooter && (
          <footer className="bdT ta-c p-30 lh-0 fsz-sm c-grey-600">
            <span>© {new Date().getFullYear()} {companyName}. Todos los derechos reservados.</span>
          </footer>
        )}
      </div>
    </div>
  );
}
