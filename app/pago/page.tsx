'use client';

import { useEffect, useState, useCallback } from 'react';
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

const SHOW_PAYMENT_METHOD_BOXES = false; // temporal: oculto para experimento

function PagoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: sessionLoading } = useSession();
  const { settings } = useSettings();
  const [pagoData, setPagoData] = useState<{ itemLabel: string; salePrice: number; currency: string } | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentModal, setPaymentModal] = useState<typeof PAYMENT_METHODS[number] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tipo = searchParams.get('tipo') || '';
  const packageId = searchParams.get('packageId') || '';
  const hostingId = searchParams.get('hostingId') || '';
  const domainId = searchParams.get('domainId') || '';
  const dominio = searchParams.get('dominio') || '';

  const basePrice = pagoData?.salePrice ?? 0;
  const currency = pagoData?.currency ?? 'COP';
  const precioConMercadoPago = basePrice * (1 + MERCADOPAGO_FEE);
  const isDomain = tipo.includes('dominio');
  const itemLabel = pagoData?.itemLabel ?? (isDomain ? dominio : '');

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/signin');
    }
  }, [router, sessionLoading, user]);

  useEffect(() => {
    if (!tipo || sessionLoading || !user) return;
    const hasParams = (tipo.includes('hosting') && (packageId || hostingId)) || (tipo.includes('dominio') && (domainId || dominio));
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
        setTimeout(() => {
          setPaymentModal(null);
          setUploadMessage(null);
        }, 2500);
      } else {
        setUploadMessage({ type: 'error', text: data.error || 'Error al subir.' });
      }
    } catch {
      setUploadMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setUploading(false);
    }
  }, [file, paymentModal, basePrice]);

  const closeModal = useCallback(() => {
    if (!uploading) {
      setPaymentModal(null);
      setFile(null);
      setUploadMessage(null);
    }
  }, [uploading]);

  if (sessionLoading || !user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)', minHeight: '100%', padding: '24px' }}>
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
              className="bd bdrs-3 p-30 mB-20"
              style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="d-f ai-c gap-3 mB-25">
                <div
                  className="d-f ai-c jc-c bdrs-50p"
                  style={{ width: 56, height: 56, backgroundColor: 'rgba(34, 197, 94, 0.12)' }}
                >
                  <i className="ti-wallet c-success" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <h4 className="m-0 c-grey-900 fw-600">{TIPO_LABELS[tipo] || 'Realizar pago'}</h4>
                  <p className="m-0 mT-2 c-grey-600 fsz-sm">
                    {loadingData ? (dominio || packageId || hostingId || '...') : (itemLabel || '—')}
                  </p>
                </div>
              </div>

              {!tipo && (
                <div className="p-15 bdrs-3 mB-20" style={{ backgroundColor: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.4)' }}>
                  <p className="m-0 fsz-sm c-grey-800">
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
                  <span className="mS-10 c-grey-600 fsz-sm">Cargando datos...</span>
                </div>
              )}

              {errorData && (
                <div className="p-15 bdrs-3 mB-20" style={{ backgroundColor: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)' }}>
                  <p className="m-0 fsz-sm c-danger">
                    <i className="ti-close mR-5" />
                    {errorData}
                  </p>
                </div>
              )}

              {(tipo && itemLabel && !loadingData && !errorData) && (
                <>
                  <div className="p-20 bdrs-3 mB-20" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="m-0 fsz-sm c-grey-600 mB-5">Monto base</p>
                    <p className="m-0 fsz-2xl fw-700 c-grey-900">
                      {currency} {basePrice.toLocaleString()}
                    </p>
                  </div>

                  <h6 className="fw-600 c-grey-800 mB-15">Pagos sin comisión</h6>
                  <div
                    className="p-20 bdrs-3 mB-20"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                  >
                    <div className="d-f fxd-c gap-3">
                      <div>
                        <p className="m-0 fw-600 c-grey-900">Pago sin comisión adicional</p>
                        <p className="m-0 fsz-sm c-grey-600">Bancolombia, Daviplata, Nequi o Bre-B. Total: <strong className="fw-700 c-grey-900">{currency} {basePrice.toLocaleString()}</strong></p>
                      </div>
                      {SHOW_PAYMENT_METHOD_BOXES && (
                        !showPaymentMethods ? (
                          <button
                            type="button"
                            className="btn btn-success align-self-start"
                            style={{ color: '#fff' }}
                            onClick={() => setShowPaymentMethods(true)}
                          >
                            Ver medios de pago
                          </button>
                        ) : (
                          <div className="d-f gap-3 fxw-w">
                            {PAYMENT_METHODS.map((pm) => (
                              <button
                                key={pm.id}
                                type="button"
                                className="btn btn-outline-secondary p-15 bdrs-3"
                                style={{ border: '1px solid #dee2e6' }}
                                onClick={() => setPaymentModal(pm)}
                              >
                                {pm.name}
                              </button>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <h6 className="fw-600 c-grey-800 mB-15">MercadoPago</h6>
                  <div
                    className="d-f ai-c jc-sb p-20 bdrs-3 mB-20"
                    style={{ backgroundColor: 'rgba(0, 123, 255, 0.06)', border: '1px solid rgba(0, 123, 255, 0.2)' }}
                  >
                    <div>
                      <p className="m-0 fw-600 c-grey-900">Incluye 5% de comisión por transacción</p>
                      <p className="m-0 fsz-sm c-grey-600">A través de un link de pago. Total: <strong className="fw-700 c-grey-900">{currency} {Math.round(precioConMercadoPago).toLocaleString()}</strong></p>
                    </div>
                    {settings?.mercadopago_payment_link && (
                      <a
                        href={settings.mercadopago_payment_link.startsWith('http') ? settings.mercadopago_payment_link : `https://${settings.mercadopago_payment_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ color: '#fff' }}
                      >
                        Pagar con MercadoPago
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {paymentModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
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
                <div className="p-15 bdrs-3 mB-15" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p className="m-0 fsz-sm c-grey-600 mB-5">Monto a pagar</p>
                  <p className="m-0 fsz-xl fw-700 c-grey-900">
                    {currency} {basePrice.toLocaleString()}
                  </p>
                </div>
                <p className="c-grey-800 mB-15">
                  Por favor realiza tu pago a este número <strong className="c-grey-900">{paymentNumber || '—'}</strong> y adjunta el comprobante de pago.
                </p>
                <div
                  className={`bdrs-3 p-20 ta-c cur-p ${dragOver ? 'bgc-primary-50' : ''}`}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--c-primary)' : '#cbd5e1'}`,
                    backgroundColor: dragOver ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
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
                    <p className="m-0 fsz-sm c-grey-800">
                      <i className="ti-file mR-5" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  ) : (
                    <p className="m-0 fsz-sm c-grey-600">
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
