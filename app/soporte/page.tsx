'use client';

import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useSettings } from '../hooks/useSettings';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const SUPPORT_OPTIONS = [
  { id: 'tecnico', label: 'Soporte técnico', desc: 'Problemas con el servidor, correo, FTP, etc.' },
  { id: 'adquirir', label: 'Adquirir servicios', desc: 'Contratar hosting, dominios o planes adicionales' },
  { id: 'migracion', label: 'Ayuda con una migración', desc: 'Migrar sitio web o correos a nuestro servidor' },
  { id: 'lento', label: 'Página web lenta', desc: 'Tu sitio carga lento o tiene problemas de rendimiento' },
  { id: 'upgrade', label: 'Solicitar upgrade de hosting', desc: 'Mejorar tu plan actual de hosting' },
  { id: 'facturacion', label: 'Facturación o pagos', desc: 'Consultas sobre facturas, pagos o renovaciones' },
  { id: 'dominio', label: 'Problemas con dominio', desc: 'DNS, transferencia, renovación de dominios' },
  { id: 'consulta', label: 'Consulta general', desc: 'Preguntas o dudas sobre nuestros servicios' },
  { id: 'otro', label: 'Otro', desc: 'Otra solicitud o tema no listado' },
];

function buildWhatsAppUrl(phone: string, text: string): string {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('57') ? clean : `57${clean}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export default function SoportePage() {
  const { settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || '';

  const [selected, setSelected] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setFeedback(null);
    setSending(true);
    try {
      const res = await fetch(`${basePath}/api/soporte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tipo: selected, message: message.trim() }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setFeedback({ type: 'success', text: data.message || 'Solicitud enviada correctamente.' });
        setSelected('');
        setMessage('');
      } else {
        setFeedback({ type: 'error', text: data.error || 'Error al enviar.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setSending(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) return;
    const text = 'Hola, necesito ayuda con mis servicios.';
    window.open(buildWhatsAppUrl(whatsappNumber, text), '_blank', 'noopener,noreferrer');
  };

  const hasWhatsApp = !!whatsappNumber.trim();

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            {/* Hero */}
            <div
              className="bd bdrs-10 p-30 mB-25"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                color: '#fff',
                boxShadow: '0 10px 40px rgba(15, 23, 42, 0.3)',
              }}
            >
              <div className="d-f ai-c gap-20 fxw-wr">
                <div className="flex-grow-1" style={{ minWidth: 200 }}>
                  <h4 className="mB-10" style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '0.02em', color: '#fff' }}>
                    Centro de soporte
                  </h4>
                  <p className="mB-0" style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
                    ¿Tienes una solicitud de soporte? Envíala por aquí y llegará automáticamente al correo de los administradores.
                    También puedes contactarnos directamente por WhatsApp para una respuesta más rápida.
                  </p>
                </div>
                {hasWhatsApp && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleWhatsAppClick();
                    }}
                    className="d-f ai-c gap-10 bdrs-8 pX-24 pY-14 td-n fw-600"
                    style={{
                      background: '#25D366',
                      color: '#fff',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Contactar por WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="row gap-20" style={{ alignItems: 'stretch' }}>
              {/* Form */}
              <div className="col-lg-8">
                <div className="bd bgc-white bdrs-10 p-25" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h5 className="mB-20 fw-600">Enviar solicitud de soporte</h5>
                  <p className="c-grey-600 fsz-sm mB-20">
                    Tu solicitud se enviará automáticamente al correo de los administradores.
                  </p>
                  {feedback && (
                    <div
                      className={`alert mB-20 ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                      role="alert"
                    >
                      {feedback.text}
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="mB-25">
                      <label className="form-label fw-600 mB-10 d-b">Tipo de solicitud</label>
                      <div className="row gap-15">
                        {SUPPORT_OPTIONS.map((opt) => (
                          <div key={opt.id} className="col-md-6 col-lg-4">
                            <label
                              className={`d-b bd bdrs-8 p-15 cur-p transition-all ${
                                selected === opt.id
                                  ? 'bd-2'
                                  : 'bd-1'
                              }`}
                              style={{
                                borderColor: selected === opt.id ? 'var(--c-primary, #6366f1)' : 'var(--c-border)',
                                background: selected === opt.id ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
                              }}
                            >
                              <div className="d-f ai-s gap-12">
                                <input
                                  type="radio"
                                  name="tipo"
                                  value={opt.id}
                                  checked={selected === opt.id}
                                  onChange={() => setSelected(opt.id)}
                                  className="mT-3"
                                />
                                <div>
                                  <div className="fw-600 fsz-sm">{opt.label}</div>
                                  <div className="c-grey-600 fsz-xs mT-2">{opt.desc}</div>
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mB-25">
                      <label htmlFor="mensaje" className="form-label fw-600 mB-10 d-b">
                        Mensaje
                      </label>
                      <textarea
                        id="mensaje"
                        className="form-control bdrs-8"
                        rows={5}
                        placeholder="Describe tu solicitud o problema con el mayor detalle posible. Incluye URLs, nombres de dominio o información relevante."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ resize: 'vertical', minHeight: 120 }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary bdrs-8 pX-30 pY-12 fw-600"
                      disabled={!selected || sending}
                    >
                      {sending ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sidebar - Contactar por WhatsApp */}
              <div className="col-lg-4" style={{ display: 'flex' }}>
                <div
                  className="bd bdrs-10 p-25 ta-c"
                  style={{
                    background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)',
                    border: '1px solid #86efac',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div className="mB-15">
                    <div
                      className="d-ib p-15 bdrs-50p"
                      style={{ background: 'rgba(37, 211, 102, 0.2)' }}
                    >
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                  </div>
                  <h6 className="fw-600 c-grey-800 mB-8">Contactar por WhatsApp</h6>
                  <p className="c-grey-600 fsz-sm mB-20" style={{ lineHeight: 1.5 }}>
                    Puedes contactarnos por WhatsApp para una respuesta más rápida. Estamos disponibles para ayudarte.
                  </p>
                  {hasWhatsApp ? (
                    <button
                      type="button"
                      onClick={handleWhatsAppClick}
                      className="btn bdrs-8 pX-24 pY-12 fw-600"
                      style={{
                        background: '#25D366',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      Abrir WhatsApp
                    </button>
                  ) : (
                    <p className="c-grey-500 fsz-xs mB-0">
                      El número de WhatsApp se configura en Configuración.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
