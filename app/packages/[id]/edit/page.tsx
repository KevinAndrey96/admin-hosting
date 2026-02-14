'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { useSession } from '../../../hooks/useSession';

function toStr(v: number | null | undefined): string {
  return v != null ? String(v) : '';
}

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [diskSpaceQuotaMb, setDiskSpaceQuotaMb] = useState('');
  const [bandwidthLimitMb, setBandwidthLimitMb] = useState('');
  const [maxEmailAccounts, setMaxEmailAccounts] = useState('');
  const [maxParkedDomains, setMaxParkedDomains] = useState('');
  const [maxAddonDomains, setMaxAddonDomains] = useState('');
  const [includedDomains, setIncludedDomains] = useState('1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'ADMIN') router.replace('/dashboard');
  }, [router, sessionLoading, user?.role]);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fetchData = async () => {
      try {
        const res = await fetch(`${basePath}/api/packages/${id}`, { credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          setName(d.name || '');
          setColorHex(d.colorHex || '');
          setSalePrice(d.salePrice != null ? String(d.salePrice) : '');
          setCurrency(d.currency || 'COP');
          setDiskSpaceQuotaMb(toStr(d.diskSpaceQuotaMb));
          setBandwidthLimitMb(toStr(d.bandwidthLimitMb));
          setMaxEmailAccounts(toStr(d.maxEmailAccounts));
          setMaxParkedDomains(toStr(d.maxParkedDomains));
          setMaxAddonDomains(toStr(d.maxAddonDomains));
          setIncludedDomains(d.includedDomains != null ? String(d.includedDomains) : '1');
        }
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'ADMIN' && id) fetchData();
  }, [user?.role, id]);

  const parseLimit = (v: string): number | 'unlimited' => {
    const t = v.trim().toLowerCase();
    if (t === 'unlimited' || t === 'ilimitado' || t === '') return 'unlimited';
    const n = parseInt(v, 10);
    return isNaN(n) ? 'unlimited' : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'El nombre es requerido.' });
      return;
    }
    const priceNum = parseFloat(salePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setMessage({ type: 'error', text: 'El precio debe ser un número válido.' });
      return;
    }
    const inclNum = parseInt(includedDomains, 10);
    if (isNaN(inclNum) || inclNum < 0) {
      setMessage({ type: 'error', text: 'Dominios incluidos debe ser un número válido.' });
      return;
    }
    setSaving(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const body: Record<string, unknown> = {
        name: name.trim(),
        colorHex: colorHex.trim() || undefined,
        salePrice: priceNum,
        currency,
        diskSpaceQuotaMb: parseLimit(diskSpaceQuotaMb),
        bandwidthLimitMb: parseLimit(bandwidthLimitMb),
        maxEmailAccounts: parseLimit(maxEmailAccounts),
        maxParkedDomains: parseLimit(maxParkedDomains),
        maxAddonDomains: parseLimit(maxAddonDomains),
        includedDomains: inclNum,
      };
      const res = await fetch(`${basePath}/api/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar.' });
        return;
      }

      setMessage({ type: 'success', text: 'Paquete actualizado correctamente.' });
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || user?.role !== 'ADMIN') return null;
  if (loading) {
    return (
      <AdminLayout>
        <div className="container-fluid p-40 ta-c c-grey-600">Cargando...</div>
      </AdminLayout>
    );
  }

  const limitInput = (label: string, value: string, setter: (v: string) => void, placeholder?: string) => (
    <div className="col-md-4 mb-3">
      <label className="form-label fsz-sm">{label}</label>
      <input
        type="text"
        className="form-control form-control-sm"
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder ?? '0 o unlimited'}
        disabled={saving}
      />
    </div>
  );

  return (
    <AdminLayout>
      <div className="container-fluid d-f fxd-c ai-c" style={{ background: '#fff', minHeight: '100%', padding: '24px' }}>
        <div className="row mB-20 w-100" style={{ maxWidth: 700 }}>
          <div className="col-12">
            <Link href={`/packages/${id}`} className="c-primary fsz-sm td-n mB-10 d-ib fw-500">← Volver al paquete</Link>
            <h4 className="m-0 mT-5 c-grey-900">Editar paquete</h4>
            <p className="c-grey-700 fsz-sm mT-5">{name || 'Paquete'}</p>
          </div>
        </div>

        <div className="row w-100" style={{ maxWidth: 700 }}>
          <div className="col-12">
            <div className="bd bgc-white p-30 bdrs-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <form onSubmit={handleSubmit}>
                <h6 className="mB-15">Información básica</h6>
                <div className="row mb-3">
                  <div className="col-md-5">
                    <label className="form-label fw-500">Nombre del paquete *</label>
                    <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required disabled={saving} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-500">Color</label>
                    <div className="d-f ai-c gap-2">
                      <input
                        type="color"
                        className="form-control form-control-color p-1"
                        value={colorHex || '#6c757d'}
                        onChange={(e) => setColorHex(e.target.value)}
                        disabled={saving}
                        style={{ width: 40, height: 38 }}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        placeholder="#CD7F32"
                        disabled={saving}
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-500">Precio *</label>
                    <input type="number" step="0.01" min="0" className="form-control" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required disabled={saving} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Moneda</label>
                    <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={saving}>
                      <option value="COP">COP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <hr className="my-4" />
                <h6 className="mB-15">Recursos</h6>
                <p className="fsz-sm c-grey-600 mB-15">Usar número o &quot;unlimited&quot; para ilimitado</p>
                <div className="row mb-3">
                  {limitInput('Disco (MB)', diskSpaceQuotaMb, setDiskSpaceQuotaMb)}
                  {limitInput('Ancho de banda (MB)', bandwidthLimitMb, setBandwidthLimitMb)}
                  {limitInput('Max cuentas email', maxEmailAccounts, setMaxEmailAccounts)}
                </div>
                <div className="row mb-3">
                  {limitInput('Max parked domains', maxParkedDomains, setMaxParkedDomains)}
                  {limitInput('Max addon domains', maxAddonDomains, setMaxAddonDomains)}
                  <div className="col-md-4 mb-3">
                    <label className="form-label fsz-sm">Dominios incluidos *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-sm"
                      value={includedDomains}
                      onChange={(e) => setIncludedDomains(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>
                </div>

                {message && (
                  <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mB-20`} role="alert">{message.text}</div>
                )}
                <div className="d-f gap-3 mT-25 jc-c">
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ color: '#fff', padding: '14px 32px', fontWeight: 600 }}>
                    <i className="ti-check mR-5" />
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <Link href="/packages" className="btn btn-outline-secondary" style={{ padding: '14px 32px' }}>Cancelar</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
