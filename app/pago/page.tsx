'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { useSession } from '../hooks/useSession';
import { useSettings } from '../hooks/useSettings';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

const TIPO_LABELS: Record<string, string> = {
  'contratar-dominio': 'Contratar dominio',
  'renovar-dominio': 'Renovar dominio',
  'transferir-dominio': 'Transferir dominio',
  'registrar-dominio': 'Registrar dominio',
  'contratar-hosting': 'Contratar hosting',
  'renovar-hosting': 'Renovar hosting',
};

const MERCADOPAGO_FEE = 0.05;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PAYMENT_METHODS = [
  { id: 'bancolombia', name: 'Bancolombia', logo: 'bancolombia.png', settingKey: 'bancolombia_account' },
  { id: 'daviplata', name: 'Daviplata', logo: 'daviplata.png', settingKey: 'daviplata_number' },
  { id: 'nequi', name: 'Nequi', logo: 'nequi.png', settingKey: 'nequi_number' },
  { id: 'breb', name: 'Bre-B', logo: 'breb.png', settingKey: 'breb_key' },
] as const;

const LOGO_SIZE = 56;

function formatPrice(value: number): string {
  return `$ ${value.toLocaleString('es-CO')}`;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function addOneYear(isoDate: string): string {
  const d = new Date(isoDate);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

function PagoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: sessionLoading } = useSession();
  const { settings } = useSettings();
  const [pagoData, setPagoData] = useState<{ itemLabel: string; salePrice: number; currency: string; currentExpirationDate?: string } | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [sectionModal, setSectionModal] = useState<'sin-comision' | 'mercadopago' | null>(null);
  const [paymentModal, setPaymentModal] = useState<typeof PAYMENT_METHODS[number] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardCenter, setCardCenter] = useState<{ x: number; y: number } | null>(null);

  const tipo = searchParams.get('tipo') || '';
  const packageId = searchParams.get('packageId') || '';
  const hostingId = searchParams.get('hostingId') || '';
  const domainId = searchParams.get('domainId') || '';
  const dominio = searchParams.get('dominio') || '';

  const basePrice = pagoData?.salePrice ?? 0;
  const currency = pagoData?.currency ?? 'COP';
  const precioConMercadoPago = basePrice * (1 + MERCADOPAGO_FEE);
  const isDomain = tipo.includes('dominio');
  const itemLabel = pagoData?.itemLabel ?? (isDomain && !hostingId ? dominio : pagoData?.itemLabel || '');

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/signin');
    }
  }, [router, sessionLoading, user]);

  useEffect(() => {
    if (!tipo || sessionLoading || !user) return;
    const hasParams =
      (tipo.includes('hosting') && (packageId || hostingId)) ||
      (tipo === 'transferir-dominio' && domainId) ||
      (tipo.includes('dominio') && tipo !== 'transferir-dominio' && (domainId || dominio));
    if (!hasParams) return;

    setLoadingData(true);
    setErrorData(null);
    const params = new URLSearchParams({ tipo });
    if (packageId) params.set('packageId', packageId);
    if (hostingId) params.set('hostingId', hostingId);
    if (domainId) params.set('domainId', domainId);
    if (dominio) params.set('dominio', dominio);

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    fetch(`${basePath}/api/pago/datos?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setErrorData(data.error);
          setPagoData(null);
        } else {
          setPagoData({
            itemLabel: data.itemLabel ?? '',
            salePrice: Number(data.salePrice) || 0,
            currency: data.currency ?? 'COP',
            currentExpirationDate: data.currentExpirationDate,
          });
        }
      })
      .catch(() => {
        setErrorData('Error al cargar datos');
        setPagoData(null);
      })
      .finally(() => setLoadingData(false));
  }, [tipo, packageId, hostingId, domainId, dominio, sessionLoading, user]);

  const paymentNumber = paymentModal ? (settings?.[paymentModal.settingKey] ?? '') : '';

  const handleBack = () => router.back();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) return 'El archivo no debe superar 5 MB';
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(f.type)) return 'Solo se permiten imágenes (JPEG, PNG, GIF, WebP) o PDF';
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setUploadMessage({ type: 'error', text: err });
      return;
    }
    setFile(f);
    setUploadMessage(null);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setUploadMessage({ type: 'error', text: err });
      return;
    }
    setFile(f);
    setUploadMessage(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || !paymentModal) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metodo', paymentModal.id);
      formData.append('monto', String(basePrice));
      formData.append('tipo', tipo);
      formData.append('tipoLabel', TIPO_LABELS[tipo] || tipo);
      formData.append('itemLabel', itemLabel || '');
      if (hostingId) formData.append('hostingId', hostingId);
      if (packageId) formData.append('packageId', packageId);
      if (domainId) formData.append('domainId', domainId);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/pago/comprobante`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUploadMessage({ type: 'success', text: data.message || 'Comprobante enviado correctamente.' });
        setFile(null);
        const redirectPath = tipo.includes('hosting') ? '/hosting' : tipo.includes('dominio') ? '/domains' : null;
        setTimeout(() => {
          setPaymentModal(null);
          setUploadMessage(null);
          if (redirectPath) {
            router.push(redirectPath);
          }
        }, 2500);
      } else {
        setUploadMessage({ type: 'error', text: data.error || 'Error al subir.' });
      }
    } catch {
      setUploadMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setUploading(false);
    }
  }, [file, paymentModal, basePrice, tipo, itemLabel, hostingId, packageId, domainId, router]);

  const closeModal = useCallback(() => {
    if (!uploading) {
      setPaymentModal(null);
      setFile(null);
      setUploadMessage(null);
    }
  }, [uploading]);

  useEffect(() => {
    if (sectionModal || paymentModal) {
      const updateCenter = () => {
        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          setCardCenter({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }
      };
      updateCenter();
      window.addEventListener('scroll', updateCenter, true);
      window.addEventListener('resize', updateCenter);
      return () => {
        window.removeEventListener('scroll', updateCenter, true);
        window.removeEventListener('resize', updateCenter);
      };
    } else {
      setCardCenter(null);
    }
  }, [sectionModal, paymentModal]);

  if (sessionLoading || !user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: 'var(--c-bkg-body)', minHeight: '100%', padding: '24px' }}>
        <div className="row justify-content-center">
          <div className="col-12" style={{ maxWidth: 560 }}>
            <Link
              href="#"
              onClick={(e) => { e.preventDefault(); handleBack(); }}
              className="c-primary fsz-sm td-n mB-15 d-ib fw-500"
            >
              ← Volver
            </Link>

            <div
              ref={cardRef}
              className="bd bdrs-3 p-30 mB-20"
              style={{
                boxShadow: 'var(--shadow-lg)',
                background: 'var(--c-bkg-card)',
                border: '1px solid var(--c-border)',
              }}
            >
              <div className="d-f ai-c gap-3 mB-25">
                <div
                  className="d-f ai-c jc-c bdrs-50p"
                  style={{ width: 56, height: 56, backgroundColor: 'color-mix(in srgb, var(--c-success) 15%, var(--c-bkg-card))' }}
                >
                  <i className="ti-wallet c-success" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <h4 className="m-0 fw-600" style={{ color: 'var(--c-text-base)' }}>{TIPO_LABELS[tipo] || 'Realizar pago'}</h4>
                  <p className="m-0 mT-2 fsz-sm" style={{ color: 'var(--c-text-muted)' }}>
                    {loadingData ? (dominio || packageId || hostingId || '...') : (itemLabel || '—')}
                  </p>
                </div>
              </div>

              {!tipo && (
                <div className="p-15 bdrs-3 mB-20" style={{ backgroundColor: 'color-mix(in srgb, var(--c-warning) 15%, var(--c-bkg-card))', border: '1px solid color-mix(in srgb, var(--c-warning) 40%, var(--c-border))' }}>
                  <p className="m-0 fsz-sm" style={{ color: 'var(--c-text-base)' }}>
                    <i className="ti-info-alt mR-5" />
                    Indica el tipo de operación (contratar/renovar dominio u hosting) desde la tabla correspondiente.
                  </p>
                </div>
              )}

              {loadingData && (
                <div className="d-f jc-c ai-c p-30">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <span className="mS-10 fsz-sm" style={{ color: 'var(--c-text-muted)' }}>Cargando datos...</span>
                </div>
              )}

              {errorData && (
                <div className="p-15 bdrs-3 mB-20" style={{ backgroundColor: 'color-mix(in srgb, var(--c-danger) 12%, var(--c-bkg-card))', border: '1px solid color-mix(in srgb, var(--c-danger) 35%, var(--c-border))' }}>
                  <p className="m-0 fsz-sm c-danger">
                    <i className="ti-close mR-5" />
                    {errorData}
                  </p>
                </div>
              )}

              {(tipo && itemLabel && !loadingData && !errorData) && (
                <>
                  <div className="p-20 bdrs-3 mB-20" style={{ backgroundColor: 'var(--c-bkg-hover)', border: '1px solid var(--c-border)' }}>
                    <p className="m-0 fsz-sm mB-5" style={{ color: 'var(--c-text-muted)' }}>Monto base</p>
                    <p className="m-0 fsz-xl fw-600" style={{ color: 'var(--c-text-base)' }}>
                      {formatPrice(basePrice)}
                    </p>
                  </div>

                  {basePrice > 0 ? (
                    <>
                  <h6 className="fw-600 mB-15" style={{ color: 'var(--c-text-base)' }}>Pagos sin comisión</h6>
                  <div
                    role="button"
                    tabIndex={0}
                    className="p-20 bdrs-3 mB-20 cur-p"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--c-success) 8%, var(--c-bkg-card))', border: '1px solid color-mix(in srgb, var(--c-success) 25%, var(--c-border))' }}
                    onClick={() => setSectionModal('sin-comision')}
                    onKeyDown={(e) => e.key === 'Enter' && setSectionModal('sin-comision')}
                  >
                    <div className="d-f fxd-c gap-3">
                      <div>
                        <p className="m-0 fw-600" style={{ color: 'var(--c-text-base)' }}>Pago sin comisión adicional</p>
                        <p className="m-0 fsz-sm" style={{ color: 'var(--c-text-muted)' }}>Bancolombia, Daviplata, Nequi o Bre-B. Total: <strong style={{ color: 'var(--c-text-base)' }}>{formatPrice(basePrice)}</strong></p>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-600 mB-15" style={{ color: 'var(--c-text-base)' }}>MercadoPago</h6>
                  <div
                    role="button"
                    tabIndex={0}
                    className="d-f ai-c jc-sb p-20 bdrs-3 mB-20 cur-p"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--c-info) 8%, var(--c-bkg-card))', border: '1px solid color-mix(in srgb, var(--c-info) 25%, var(--c-border))' }}
                    onClick={() => setSectionModal('mercadopago')}
                    onKeyDown={(e) => e.key === 'Enter' && setSectionModal('mercadopago')}
                  >
                    <div>
                      <p className="m-0 fw-600" style={{ color: 'var(--c-text-base)' }}>Incluye 5% de comisión por transacción</p>
                      <p className="m-0 fsz-sm" style={{ color: 'var(--c-text-muted)' }}>A través de un link de pago. Total: <strong style={{ color: 'var(--c-text-base)' }}>{formatPrice(Math.round(precioConMercadoPago))}</strong></p>
                    </div>
                  </div>

                  <hr className="mB-0 mT-30" style={{ borderColor: 'var(--c-border)', borderTopWidth: 1 }} />
                  <div className="p-25 bdrs-3 mT-30" style={{ backgroundColor: 'color-mix(in srgb, var(--c-primary) 8%, var(--c-bkg-card))', border: '1px solid color-mix(in srgb, var(--c-primary) 25%, var(--c-border))' }}>
                    <p className="m-0 fsz-sm mB-0" style={{ color: 'var(--c-text-muted)' }}>
                      <i className="ti-info-alt mR-5" />
                      Una vez confirmado el pago se procederá a la {tipo.includes('renovar') ? 'renovación' : 'activación'} del servicio.
                    </p>
                    {tipo.includes('renovar') && pagoData?.currentExpirationDate && (
                      <p className="m-0 fsz-sm mT-10" style={{ color: 'var(--c-text-muted)' }}>
                        Se renovará por un año más. Fecha anterior de expiración: <strong>{formatDate(pagoData.currentExpirationDate)}</strong>. Nueva fecha de expiración: <strong>{formatDate(addOneYear(pagoData.currentExpirationDate))}</strong>.
                      </p>
                    )}
                  </div>
                    </>
                  ) : (
                    <div className="p-20 bdrs-3" style={{ backgroundColor: 'color-mix(in srgb, var(--c-success) 12%, var(--c-bkg-card))', border: '1px solid color-mix(in srgb, var(--c-success) 30%, var(--c-border))' }}>
                      <p className="m-0 fsz-sm" style={{ color: 'var(--c-text-base)' }}>
                        <i className="ti-check mR-5 c-success" />
                        Este servicio no tiene costo asociado. Contacta al administrador para proceder.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {sectionModal && (
        <div
          className="modal fade show"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1055,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          tabIndex={-1}
          role="dialog"
          onClick={() => setSectionModal(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={
              cardCenter
                ? {
                    position: 'fixed',
                    left: cardCenter.x,
                    top: cardCenter.y,
                    transform: 'translate(-50%, -50%)',
                    margin: 0,
                  }
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header d-f ai-c jc-sb">
                <h5 className="modal-title m-0">
                  {sectionModal === 'sin-comision' ? 'Pagos sin comisión' : 'MercadoPago'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setSectionModal(null)}
                />
              </div>
              <div className="modal-body">
                {sectionModal === 'sin-comision' ? (
                  <>
                    <p className="fsz-sm mB-15" style={{ color: 'var(--c-text-muted)' }}>Selecciona el medio de pago. Total: <strong style={{ color: 'var(--c-text-base)' }}>{formatPrice(basePrice)}</strong></p>
                    <div className="d-f gap-3 jc-c" style={{ flexWrap: 'nowrap' }}>
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          className="btn btn-outline-secondary p-15 bdrs-3 d-f fxd-c ai-c jc-c"
                          style={{ minWidth: 100, border: '1px solid var(--c-border)' }}
                          onClick={() => {
                            setSectionModal(null);
                            setPaymentModal(pm);
                          }}
                        >
                          <img
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/static/images/payment-methods/${pm.logo}`}
                            alt={pm.name}
                            width={LOGO_SIZE}
                            height={LOGO_SIZE}
                            style={{ objectFit: 'contain' }}
                          />
                          <span className="fsz-xs mT-5 ta-c" style={{ color: 'var(--c-text-muted)' }}>{pm.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="fsz-sm mB-15 ta-c" style={{ color: 'var(--c-text-muted)' }}>Total: <strong style={{ color: 'var(--c-text-base)' }}>{formatPrice(Math.round(precioConMercadoPago))}</strong> (incluye 5% de comisión)</p>
                    <div className="d-f ai-c jc-c gap-3 mB-15">
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/assets/static/images/payment-methods/mercadopago.png`}
                        alt="MercadoPago"
                        width={LOGO_SIZE}
                        height={LOGO_SIZE}
                        style={{ objectFit: 'contain' }}
                      />
                      <span className="fw-600" style={{ color: 'var(--c-text-base)' }}>MercadoPago</span>
                    </div>
                    {settings?.mercadopago_payment_link && (
                      <div className="ta-c">
                        <a
                          href={settings.mercadopago_payment_link.startsWith('http') ? settings.mercadopago_payment_link : `https://${settings.mercadopago_payment_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{ color: '#fff' }}
                        >
                          Pagar con MercadoPago
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentModal && (
        <div
          className="modal fade show"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1055,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          tabIndex={-1}
          role="dialog"
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={
              cardCenter
                ? {
                    position: 'fixed',
                    left: cardCenter.x,
                    top: cardCenter.y,
                    transform: 'translate(-50%, -50%)',
                    margin: 0,
                  }
                : undefined
            }
          >
            <div className="modal-content">
              <div className="modal-header d-f ai-c gap-2">
                <h5 className="modal-title m-0">{paymentModal.name}</h5>
                <button
                  type="button"
                  className="btn-close ms-auto"
                  aria-label="Cerrar"
                  onClick={closeModal}
                  disabled={uploading}
                />
              </div>
              <div className="modal-body">
                <div className="p-15 bdrs-3 mB-15" style={{ backgroundColor: 'var(--c-bkg-hover)', border: '1px solid var(--c-border)' }}>
                  <p className="m-0 fsz-sm mB-5" style={{ color: 'var(--c-text-muted)' }}>Monto a pagar</p>
                  <p className="m-0 fsz-xl fw-700" style={{ color: 'var(--c-text-base)' }}>
                    {formatPrice(basePrice)}
                  </p>
                </div>
                <p className="mB-15" style={{ color: 'var(--c-text-base)' }}>
                  Por favor realiza tu pago a este número <strong>{paymentNumber || '—'}</strong> y adjunta el comprobante de pago.
                </p>
                <div
                  className={`bdrs-3 p-20 ta-c cur-p ${dragOver ? 'bgc-primary-50' : ''}`}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--c-primary)' : 'var(--c-border)'}`,
                    backgroundColor: dragOver ? 'color-mix(in srgb, var(--c-primary) 8%, var(--c-bkg-card))' : 'transparent',
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input-comprobante')?.click()}
                >
                  <input
                    id="file-input-comprobante"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    className="d-n"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <p className="m-0 fsz-sm" style={{ color: 'var(--c-text-base)' }}>
                      <i className="ti-file mR-5" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  ) : (
                    <p className="m-0 fsz-sm" style={{ color: 'var(--c-text-muted)' }}>
                      Arrastra aquí tu comprobante (imagen o PDF, máx. 5 MB) o haz clic para seleccionar
                    </p>
                  )}
                </div>
                {uploadMessage && (
                  <div className={`alert alert-${uploadMessage.type === 'success' ? 'success' : 'danger'} mT-15 mB-0`} role="alert">
                    {uploadMessage.text}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={uploading}>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ color: '#fff' }}
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? 'Enviando...' : 'Enviar comprobante'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function PagoPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="container-fluid p-30 ta-c">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </AdminLayout>
    }>
      <PagoContent />
    </Suspense>
  );
}
