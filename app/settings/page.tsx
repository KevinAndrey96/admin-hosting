'use client';
/* eslint-disable @next/next/no-img-element */

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
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [numeroDaviplata, setNumeroDaviplata] = useState('');
  const [numeroNequi, setNumeroNequi] = useState('');
  const [llaveBreB, setLlaveBreB] = useState('');
  const [cuentaBancolombia, setCuentaBancolombia] = useState('');
  const [linkPagoMercadopago, setLinkPagoMercadopago] = useState('');
  const [renewalReminderEnabled, setRenewalReminderEnabled] = useState(true);
  const [domainReactivationPenalty, setDomainReactivationPenalty] = useState('');
  const [domainComPrice, setDomainComPrice] = useState('');
  const [domainNetPrice, setDomainNetPrice] = useState('');
  const [domainComCoPrice, setDomainComCoPrice] = useState('');
  const [domainCoPrice, setDomainCoPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name ?? '');
      setLogoUrl(settings.logo_url ?? '');
      setPrimaryColor(settings.primary_color ?? '#6366f1');
      setSecondaryColor(settings.secondary_color ?? '#64748b');
      setWhatsappNumber(settings.whatsapp_number ?? '');
      setNumeroDaviplata(settings.daviplata_number ?? '');
      setNumeroNequi(settings.nequi_number ?? '');
      setLlaveBreB(settings.breb_key ?? '');
      setCuentaBancolombia(settings.bancolombia_account ?? '');
      setLinkPagoMercadopago(settings.mercadopago_payment_link ?? '');
      setRenewalReminderEnabled(settings.renewal_reminder_enabled === 'true' || settings.renewal_reminder_enabled === '1');
      setDomainReactivationPenalty(settings.domain_reactivation_penalty ?? '');
      setDomainComPrice(settings.domain_com_price ?? '');
      setDomainNetPrice(settings.domain_net_price ?? '');
      setDomainComCoPrice(settings.domain_com_co_price ?? '');
      setDomainCoPrice(settings.domain_co_price ?? '');
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
        whatsapp_number: whatsappNumber,
        daviplata_number: numeroDaviplata,
        nequi_number: numeroNequi,
        breb_key: llaveBreB,
        bancolombia_account: cuentaBancolombia,
        mercadopago_payment_link: linkPagoMercadopago,
        renewal_reminder_enabled: renewalReminderEnabled ? 'true' : 'false',
        domain_reactivation_penalty: domainReactivationPenalty.trim(),
        domain_com_price: domainComPrice.trim(),
        domain_net_price: domainNetPrice.trim(),
        domain_com_co_price: domainComCoPrice.trim(),
        domain_co_price: domainCoPrice.trim(),
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
                  <div className="mb-3 mT-20">
                    <label htmlFor="whatsapp_number" className="form-label">
                      Número WhatsApp (Soporte)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="whatsapp_number"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="Ej: 573001234567 (código país + número)"
                      disabled={saving}
                    />
                    <div className="form-text">
                      Número para el enlace de WhatsApp en la página de Soporte. Incluir código de país (ej: 57 para Colombia).
                    </div>
                  </div>
                  <h6 className="mB-15 mT-25">Datos de pago</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="daviplata_number" className="form-label">
                          Número Daviplata
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="daviplata_number"
                          value={numeroDaviplata}
                          onChange={(e) => setNumeroDaviplata(e.target.value)}
                          placeholder="Ej: 3185563342"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="nequi_number" className="form-label">
                          Número Nequi
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="nequi_number"
                          value={numeroNequi}
                          onChange={(e) => setNumeroNequi(e.target.value)}
                          placeholder="Ej: 3185563342"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="bancolombia_account" className="form-label">
                          Cuenta Bancolombia
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="bancolombia_account"
                          value={cuentaBancolombia}
                          onChange={(e) => setCuentaBancolombia(e.target.value)}
                          placeholder="Ej: 3185563342"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="breb_key" className="form-label">
                          Llave Bre-B
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="breb_key"
                          value={llaveBreB}
                          onChange={(e) => setLlaveBreB(e.target.value)}
                          placeholder="Ej: 3185563342"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label htmlFor="mercadopago_payment_link" className="form-label">
                          Link de pago MercadoPago
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="mercadopago_payment_link"
                          value={linkPagoMercadopago}
                          onChange={(e) => setLinkPagoMercadopago(e.target.value)}
                          placeholder="https://..."
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <h6 className="mB-15 mT-25">Dominios</h6>
                  <div className="mb-3">
                    <label htmlFor="domain_reactivation_penalty" className="form-label">
                      Multa por reactivación (dominios vencidos)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="domain_reactivation_penalty"
                      value={domainReactivationPenalty}
                      onChange={(e) => setDomainReactivationPenalty(e.target.value)}
                      placeholder="Ej: 50000 o $50.000"
                      disabled={saving}
                    />
                    <div className="form-text">
                      Costo adicional por reactivar un dominio vencido. Se muestra en la tabla de dominios cuando el cliente tiene dominios que vencen en 30 días o menos. Dejar vacío para no mostrar.
                    </div>
                  </div>
                  <div className="row mT-15">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="domain_com_price" className="form-label">Precio .com</label>
                        <input type="text" className="form-control" id="domain_com_price" value={domainComPrice} onChange={(e) => setDomainComPrice(e.target.value)} placeholder="Ej: 50000" disabled={saving} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="domain_net_price" className="form-label">Precio .net</label>
                        <input type="text" className="form-control" id="domain_net_price" value={domainNetPrice} onChange={(e) => setDomainNetPrice(e.target.value)} placeholder="Ej: 55000" disabled={saving} />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="domain_com_co_price" className="form-label">Precio .com.co</label>
                        <input type="text" className="form-control" id="domain_com_co_price" value={domainComCoPrice} onChange={(e) => setDomainComCoPrice(e.target.value)} placeholder="Ej: 45000" disabled={saving} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="domain_co_price" className="form-label">Precio .co</label>
                        <input type="text" className="form-control" id="domain_co_price" value={domainCoPrice} onChange={(e) => setDomainCoPrice(e.target.value)} placeholder="Ej: 40000" disabled={saving} />
                      </div>
                    </div>
                  </div>
                  <div className="form-text mB-15">
                    Precios mostrados al verificar disponibilidad de dominios. Solo aplica a .com, .net, .com.co y .co.
                  </div>
                  <h6 className="mB-15 mT-25">Recordatorios de renovación</h6>
                  <p className="fsz-sm c-grey-600 mB-15">
                    Envía correos automáticos a los clientes a 30, 15, 7, 5, 3 y 1 día(s) antes del vencimiento. A 5 días: mensaje urgente. A 3 y 1 día: aviso de expiración. Incluye recordatorio de evitar costos de reactivación y pérdida de información.
                  </p>
                  <div className="form-check mB-15">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="renewal_reminder_enabled"
                      checked={renewalReminderEnabled}
                      onChange={(e) => setRenewalReminderEnabled(e.target.checked)}
                      disabled={saving}
                    />
                    <label className="form-check-label" htmlFor="renewal_reminder_enabled">
                      Activar recordatorios por correo
                    </label>
                  </div>
                  <p className="fsz-sm c-grey-600 mB-15">
                    Configura un cron que llame a <code className="fsz-xs">/api/cron/renewal-reminders</code> diariamente (Vercel Cron, cron-job.org, etc.). Usa el header <code className="fsz-xs">Authorization: Bearer CRON_SECRET</code>.
                  </p>
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
