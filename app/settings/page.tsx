'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { useSettings } from '../hooks/useSettings';
import { useSession } from '../hooks/useSession';

export default function SettingsPage() {
  const router = useRouter();
  const { settings, loading, updateSettings } = useSettings();
  const { user, loading: sessionLoading } = useSession();
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#64748b');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name ?? '');
      setLogoUrl(settings.logo_url ?? '');
      setPrimaryColor(settings.primary_color ?? '#6366f1');
      setSecondaryColor(settings.secondary_color ?? '#64748b');
    }
  }, [settings]);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, sessionLoading, user?.role]);

  if (sessionLoading || user?.role !== 'ADMIN') {
    return null;
  }

  const isValidHex = (s: string) => /^#[0-9A-Fa-f]{6}$/.test(s);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!isValidHex(primaryColor) || !isValidHex(secondaryColor)) {
      setMessage({ type: 'error', text: 'Los colores deben ser en formato hex (#rrggbb), por ejemplo #6366f1' });
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        company_name: companyName,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
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
                  <h6 className="mB-15 mT-25">Colores de marca</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="primary_color" className="form-label">
                          Color primario
                        </label>
                        <div className="d-f gap-2 ai-c">
                          <input
                            type="color"
                            id="primary_color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            disabled={saving}
                            style={{ width: 44, height: 38, padding: 2, cursor: 'pointer', border: '1px solid var(--c-border)', borderRadius: 6 }}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            placeholder="#6366f1"
                            disabled={saving}
                            style={{ fontFamily: 'monospace', maxWidth: 120 }}
                          />
                        </div>
                        <div className="form-text">Botones, enlaces, elementos destacados</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="secondary_color" className="form-label">
                          Color secundario
                        </label>
                        <div className="d-f gap-2 ai-c">
                          <input
                            type="color"
                            id="secondary_color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            disabled={saving}
                            style={{ width: 44, height: 38, padding: 2, cursor: 'pointer', border: '1px solid var(--c-border)', borderRadius: 6 }}
                          />
                          <input
                            type="text"
                            className="form-control"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            placeholder="#64748b"
                            disabled={saving}
                            style={{ fontFamily: 'monospace', maxWidth: 120 }}
                          />
                        </div>
                        <div className="form-text">Acentos secundarios, texto muted</div>
                      </div>
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
            <div className="bd bgc-white p-20 bdrs-3 mB-20">
              <h6 className="mB-15">Vista previa de colores</h6>
              <div className="d-f gap-3 fw-w">
                <div className="d-f fd-c ai-c">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: primaryColor,
                      border: '1px solid var(--c-border)',
                    }}
                  />
                  <span className="fsz-sm c-grey-600 mT-5">Primario</span>
                </div>
                <div className="d-f fd-c ai-c">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: secondaryColor,
                      border: '1px solid var(--c-border)',
                    }}
                  />
                  <span className="fsz-sm c-grey-600 mT-5">Secundario</span>
                </div>
              </div>
            </div>
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
