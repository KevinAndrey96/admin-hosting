'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import MasonryInit from '../components/MasonryInit';
import { useSession } from '../hooks/useSession';
import MonthlyStatsChart, {
  formatCurrency as formatMonthlyCurrency,
  type MonthlyIncomeResponse,
} from '../components/charts/MonthlyStatsChart';
import ClientMonthlyChart, { type ClientMonthlyData } from '../components/charts/ClientMonthlyChart';

interface AdminStats {
  totalDomains: number;
  activeDomains: number;
  totalHostings: number;
  activeHostings: number;
  activeHostingsAnnualValue: number;
  currency: string;
  clientCount: number;
  hostingsExpiring5Days: number;
}

interface AgencyPromotion {
  active: boolean;
  primaryHosting: {
    id: string;
    username: string;
    nextBillingDate: string;
    primaryDomain: string;
  } | null;
  referralsCount: number;
  bonusMonthsEarned: number;
}

interface ClientStats {
  activeHostings: number;
  activeDomains: number;
  hostingsExpiring30Days: number;
  domainsExpiring30Days: number;
  agencyPromotion?: AgencyPromotion | null;
}

function formatDateDisplay(d?: string | null) {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const isAdmin = user?.role === 'ADMIN';

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState<MonthlyIncomeResponse | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientMonthly, setClientMonthly] = useState<ClientMonthlyData[]>([]);
  const [clientMonthlyLoading, setClientMonthlyLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    fetch(`${basePath}/api/dashboard/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) setAdminStats(data);
      })
      .catch(console.error)
      .finally(() => setAdminLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    fetch(`${basePath}/api/dashboard/monthly-income`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) setMonthlyIncome(data);
      })
      .catch(console.error)
      .finally(() => setMonthlyLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    fetch(`${basePath}/api/dashboard/client-stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) setClientStats(data);
      })
      .catch(console.error)
      .finally(() => setClientLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    fetch(`${basePath}/api/dashboard/client-monthly`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) setClientMonthly(data.data ?? []);
      })
      .catch(console.error)
      .finally(() => setClientMonthlyLoading(false));
  }, [isAdmin]);

  if (sessionLoading) {
    return (
      <AdminLayout>
        <div className="p-20 ta-c c-grey-600">Cargando...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <MasonryInit />
      <div className="row gap-20 masonry pos-r">
        <div className="masonry-sizer col-md-6" />

        {isAdmin ? (
          <>
            {/* Admin: Hosting + Clientes */}
            <div className="masonry-item w-100">
              <div className="row gap-20">
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Hosting</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {adminLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <>
                              <span className="fw-600 fsz-lg">{adminStats?.totalHostings ?? 0}</span>
                              <span className="c-grey-600 mX-5">/</span>
                              <span className="fw-600">{adminStats?.activeHostings ?? 0} activos</span>
                              <span className="mX-5 c-grey-700 fsz-sm">
                                ({formatCurrency(adminStats?.activeHostingsAnnualValue ?? 0, adminStats?.currency ?? 'COP')}/año)
                              </span>
                            </>
                          )}
                        </div>
                        <div className="peer">
                          <Link href="/hosting" className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-green-50 c-green-600 td-n">
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Clientes</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {adminLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <span className="fw-600 fsz-lg">{adminStats?.clientCount ?? 0}</span>
                          )}
                        </div>
                        <div className="peer">
                          <Link href="/clients" className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-blue-50 c-blue-600 td-n">
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Admin: Dominios + Pendientes por apagar */}
            <div className="masonry-item w-100">
              <div className="row gap-20">
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Dominios</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {adminLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <>
                              <span className="fw-600 fsz-lg">{adminStats?.totalDomains ?? 0}</span>
                              <span className="c-grey-600 mX-5">/</span>
                              <span className="fw-600">{adminStats?.activeDomains ?? 0} activos</span>
                            </>
                          )}
                        </div>
                        <div className="peer">
                          <Link href="/domains" className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-deep-purple-50 c-deep-purple-600 td-n">
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Pendientes por apagar</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {adminLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <span className={`fw-600 fsz-lg ${(adminStats?.hostingsExpiring5Days ?? 0) > 0 ? 'c-red-600' : ''}`}>
                              {adminStats?.hostingsExpiring5Days ?? 0}
                            </span>
                          )}
                        </div>
                        <div className="peer">
                          <span className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-amber-50 c-amber-700">
                            Vencen ≤5 días
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Admin: Ingreso mensual */}
            <div className="masonry-item col-12">
              <div className="bd bgc-white">
                <div className="layers">
                  <div className="layer w-100 pX-20 pT-20">
                    <h6 className="lh-1">Ingreso mensual estimado</h6>
                    <small className="c-grey-600">Renovaciones de hosting y dominios por mes</small>
                  </div>
                  <div className="layer w-100 p-20">
                    <MonthlyStatsChart
                      data={monthlyIncome?.data ?? []}
                      currency={monthlyIncome?.currency ?? 'COP'}
                      height={340}
                    />
                  </div>
                  <div className="layer bdT p-20 w-100" style={{ alignSelf: 'stretch' }}>
                    <div className="d-f fxw-w jc-sb" style={{ gap: '12px 16px' }}>
                      <div className="ta-c" style={{ minWidth: 80 }}>
                        <div className="fsz-def fw-600 c-grey-800">
                          {monthlyLoading ? '...' : formatMonthlyCurrency(monthlyIncome?.total ?? 0, monthlyIncome?.currency ?? 'COP')}
                        </div>
                        <small className="c-grey-500 fw-600">Total</small>
                      </div>
                      <div className="ta-c" style={{ minWidth: 80 }}>
                        <div className="fsz-def fw-600 c-green-600">
                          {monthlyLoading ? '...' : monthlyIncome?.bestMonth ? formatMonthlyCurrency(monthlyIncome.bestMonth.value, monthlyIncome.currency) : '-'}
                        </div>
                        <small className="c-grey-500 fw-600">Mejor mes {monthlyIncome?.bestMonth ? `(${monthlyIncome.bestMonth.month})` : ''}</small>
                      </div>
                      <div className="ta-c" style={{ minWidth: 80 }}>
                        <div className="fsz-def fw-600 c-red-600">
                          {monthlyLoading ? '...' : monthlyIncome?.worstMonth ? formatMonthlyCurrency(monthlyIncome.worstMonth.value, monthlyIncome.currency) : '-'}
                        </div>
                        <small className="c-grey-500 fw-600">Peor mes {monthlyIncome?.worstMonth ? `(${monthlyIncome.worstMonth.month})` : ''}</small>
                      </div>
                      <div className="ta-c" style={{ minWidth: 80 }}>
                        <div className="fsz-def fw-600 c-grey-800">
                          {monthlyLoading ? '...' : formatMonthlyCurrency(monthlyIncome?.average ?? 0, monthlyIncome?.currency ?? 'COP')}
                        </div>
                        <small className="c-grey-500 fw-600">Promedio</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Client: Banner Promoción de Referidos para Agencias */}
            {clientStats?.agencyPromotion?.active && (
              <div className="masonry-item w-100 mB-20">
                <div
                  className="bd p-25 bdrs-8"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#f8fafc',
                    border: '1px solid #f59e0b',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                  }}
                >
                  <div className="d-f ai-c jc-sb fxw-w mB-15" style={{ gap: '10px' }}>
                    <div className="d-f ai-c" style={{ gap: '10px' }}>
                      <span
                        className="badge"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#000',
                          fontWeight: 700,
                          padding: '6px 12px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        🌟 Programa de Alianzas y Referidos
                      </span>
                      <span className="badge bg-secondary">Beneficio Activo</span>
                    </div>
                    {clientStats.agencyPromotion.primaryHosting && (
                      <span className="c-grey-400 fsz-sm">
                        Servidor Matriz:{' '}
                        <strong className="text-warning">
                          {clientStats.agencyPromotion.primaryHosting.username}
                        </strong>{' '}
                        ({clientStats.agencyPromotion.primaryHosting.primaryDomain})
                      </span>
                    )}
                  </div>

                  <h4 className="fw-700 mB-10 text-white" style={{ letterSpacing: '-0.3px' }}>
                    ¡Gana 2 Meses Gratis de Hosting por cada Cliente Nuevo que refieras!
                  </h4>
                  <p className="c-grey-300 fsz-def mB-20" style={{ maxWidth: '850px', lineHeight: 1.5 }}>
                    Te regalamos <strong>6 meses de cortesía</strong> para tu servidor de agencia (
                    <span className="text-warning fw-600">
                      vigente hasta el{' '}
                      {formatDateDisplay(clientStats.agencyPromotion.primaryHosting?.nextBillingDate)}
                    </span>
                    ). Por cada nuevo servidor de hosting anual que actives para tus clientes o proyectos,
                    tu cuenta recibirá <strong>2 meses adicionales gratis</strong> acumulables.
                  </p>

                  <div className="row gap-15 mB-20">
                    <div className="col-md-4">
                      <div
                        className="p-15 bdrs-6"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <small className="c-grey-400 d-b mB-5 fw-600 text-uppercase fsz-xs">Cortesía de Bienvenida</small>
                        <div className="fsz-def fw-700 text-warning">6 Meses sin Costo</div>
                        <small className="c-grey-400">Servidor matriz habilitado</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div
                        className="p-15 bdrs-6"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <small className="c-grey-400 d-b mB-5 fw-600 text-uppercase fsz-xs">Clientes Referidos</small>
                        <div className="fsz-def fw-700 text-white">
                          {clientStats.agencyPromotion.referralsCount}{' '}
                          <span className="fsz-sm fw-normal c-grey-400">
                            {clientStats.agencyPromotion.referralsCount === 1 ? 'servidor' : 'servidores'}
                          </span>
                        </div>
                        <small className="text-success fw-600">
                          +{clientStats.agencyPromotion.bonusMonthsEarned} meses bonificados
                        </small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div
                        className="p-15 bdrs-6"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <small className="c-grey-400 d-b mB-5 fw-600 text-uppercase fsz-xs">Regla de Bonificación</small>
                        <div className="fsz-def fw-700 text-white">+2 Meses por Compra</div>
                        <small className="c-grey-400">Aplica en cuentas nuevas (no en renovaciones)</small>
                      </div>
                    </div>
                  </div>

                  <div className="d-f ai-c jc-sb fxw-w" style={{ gap: '15px' }}>
                    <div className="d-f ai-c" style={{ gap: '10px' }}>
                      <Link
                        href="/hosting"
                        className="btn btn-warning btn-sm fw-700 px-3 py-2 text-dark"
                        style={{ borderRadius: '6px' }}
                      >
                        Ver Mis Hostings y Referidos
                      </Link>
                      <Link
                        href="/soporte"
                        className="btn btn-outline-light btn-sm fw-600 px-3 py-2"
                        style={{ borderRadius: '6px' }}
                      >
                        Solicitar Nuevo Servidor
                      </Link>
                    </div>
                    <small className="c-grey-400 fsz-xs">
                      * Todos los servidores referidos viven y se administran centralizados bajo tu cuenta.
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Client: Hosting activos + Dominios activos */}
            <div className="masonry-item w-100">
              <div className="row gap-20">
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Hosting activos</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {clientLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <span className="fw-600 fsz-lg">{clientStats?.activeHostings ?? 0}</span>
                          )}
                        </div>
                        <div className="peer">
                          <Link href="/hosting" className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-green-50 c-green-600 td-n">
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Dominios activos</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {clientLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <span className="fw-600 fsz-lg">{clientStats?.activeDomains ?? 0}</span>
                          )}
                        </div>
                        <div className="peer">
                          <Link href="/domains" className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-deep-purple-50 c-deep-purple-600 td-n">
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Client: Hosting pendientes + Dominios pendientes */}
            <div className="masonry-item w-100">
              <div className="row gap-20">
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Hosting pendientes por vencer</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {clientLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <span className={`fw-600 fsz-lg ${(clientStats?.hostingsExpiring30Days ?? 0) > 0 ? 'c-amber-600' : ''}`}>
                              {clientStats?.hostingsExpiring30Days ?? 0}
                            </span>
                          )}
                        </div>
                        <div className="peer">
                          <span className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-blue-50 c-blue-600">
                            30 días o menos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="layers bd bgc-white p-20">
                    <div className="layer w-100 mB-10">
                      <h6 className="lh-1">Dominios pendientes por vencer</h6>
                    </div>
                    <div className="layer w-100">
                      <div className="peers ai-sb fxw-nw">
                        <div className="peer peer-greed">
                          {clientLoading ? (
                            <span className="c-grey-600">...</span>
                          ) : (
                            <span className={`fw-600 fsz-lg ${(clientStats?.domainsExpiring30Days ?? 0) > 0 ? 'c-amber-600' : ''}`}>
                              {clientStats?.domainsExpiring30Days ?? 0}
                            </span>
                          )}
                        </div>
                        <div className="peer">
                          <span className="d-ib lh-0 va-m fw-600 bdrs-10em pX-15 pY-15 bgc-green-50 c-green-600">
                            30 días o menos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Client: Gráfica hosting/dominios por mes */}
            <div className="masonry-item col-12">
              <div className="bd bgc-white">
                <div className="layers">
                  <div className="layer w-100 pX-20 pT-20">
                    <h6 className="lh-1">Vencimientos por mes</h6>
                    <small className="c-grey-600">Hosting (azul) y dominios (verde) que vencen cada mes</small>
                  </div>
                  <div className="layer w-100 p-20">
                    <ClientMonthlyChart
                      data={clientMonthlyLoading ? [] : clientMonthly}
                      height={340}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
