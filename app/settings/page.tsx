'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useSettings } from '../hooks/useSettings';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name ?? '');
      setLogoUrl(settings.logo_url ?? '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await updateSettings({
        company_name: companyName,
        logo_url: logoUrl,
      });
      setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mB-20">
          <div className="col-12">
            <h4 className="m-0">Configuración</h4>
            <p className="c-grey-600 fsz-sm mT-5">Configuración general del panel (estilo WordPress)</p>
          </div>
        </div>

        <div className="row gap-20">
          <div className="col-md-8">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-20">Información general</h6>
              {loading ? (
                <p className="c-grey-600">Cargando...</p>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="company_name" className="form-label">
                      Nombre de la compañía
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="company_name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej: Mi Empresa"
                      disabled={saving}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="logo_url" className="form-label">
                      URL del logo
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="logo_url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="/assets/static/images/logo.svg o https://..."
                      disabled={saving}
                    />
                    <div className="form-text">
                      Ruta relativa (ej: /assets/static/images/logo.svg) o URL absoluta (https://...)
                    </div>
                  </div>
                  {message && (
                    <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mB-20`} role="alert">
                      {message.text}
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <div className="bd bgc-white p-20 bdrs-3">
              <h6 className="mB-15">Vista previa del logo</h6>
              {loading ? (
                <div className="d-f ai-c jc-c" style={{ minHeight: 80, background: 'var(--c-bkg-hover)' }}>
                  <span className="c-grey-600 fsz-sm">Cargando...</span>
                </div>
              ) : (
                <div className="d-f ai-c jc-c p-20 bd bdrs-3" style={{ background: 'var(--c-bkg-hover)' }}>
                  <img
                    src={
                      logoUrl.startsWith('http')
                        ? logoUrl
                        : `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl || '/assets/static/images/logo.svg'}`
                    }
                    alt="Logo preview"
                    style={{ maxWidth: 120, maxHeight: 80, objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
