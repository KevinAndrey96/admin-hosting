"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from '@/app/components/AdminLayout';
import { formatPrice } from "@/lib/utils";

interface DomainAvailability {
  available: boolean;
  price?: number;
  currency?: string;
  message?: string;
}

interface HostingPackage {
  id: string;
  name: string;
  salePrice: number;
  currency: string;
  colorHex?: string;
  diskSpaceQuotaMb?: number | null;
}

export default function RegisterDomainPage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [withHosting, setWithHosting] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packages, setPackages] = useState<HostingPackage[]>([]);
  const [hostings, setHostings] = useState<Array<{ packageID: string; salePrice: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState<DomainAvailability | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // WHOIS data
  const [registrantName, setRegistrantName] = useState("");
  const [registrantOrg, setRegistrantOrg] = useState("");
  const [registrantEmail, setRegistrantEmail] = useState("");
  const [registrantPhone, setRegistrantPhone] = useState("");
  const [registrantAddress, setRegistrantAddress] = useState("");
  const [registrantCity, setRegistrantCity] = useState("");
  const [registrantState, setRegistrantState] = useState("");
  const [registrantCountry, setRegistrantCountry] = useState("");
  const [registrantPostalCode, setRegistrantPostalCode] = useState("");
  const [privacyEnabled, setPrivacyEnabled] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchUserData();
    fetchHostings();
  }, []);

  const fetchHostings = async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const res = await fetch(`${basePath}/api/hosting`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setHostings(list.map((h: { packageID: string; salePrice: number }) => ({ packageID: h.packageID, salePrice: Number(h.salePrice) ?? 0 })));
      }
    } catch {
      setHostings([]);
    }
  };

  /** Max effective price per package from user's current hostings (so selected package shows the highest they pay). */
  const effectivePriceByPackageId = useMemo(() => {
    const m: Record<string, number> = {};
    hostings.forEach((h) => {
      if (h.packageID && h.salePrice >= 0) {
        const current = m[h.packageID];
        m[h.packageID] = current == null ? h.salePrice : Math.max(current, h.salePrice);
      }
    });
    return m;
  }, [hostings]);

  const fetchUserData = async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/user/profile`);
      if (response.ok) {
        const userData = await response.json();
        if (userData) {
          setRegistrantName(userData.fullName || '');
          setRegistrantOrg(userData.companyName || '');
          setRegistrantEmail(userData.email || '');
          setRegistrantPhone(userData.phone || '');
          setRegistrantAddress(userData.address || '');
          setRegistrantCity(userData.city || '');
          setRegistrantState(userData.stateProvince || '');
          setRegistrantCountry(userData.country || '');
          setRegistrantPostalCode(userData.zipCode || '');
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const checkAvailability = async () => {
    if (!domain) return;

    setCheckingAvailability(true);
    setAvailability(null);
    setError("");

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(
        `${basePath}/api/domains/check-availability?domain=${encodeURIComponent(domain)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      } else {
        setError("Error verificando disponibilidad del dominio");
      }
    } catch (error) {
      setError("Error verificando disponibilidad del dominio");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain) {
      setError("Por favor ingrese un dominio");
      return;
    }

    if (!availability?.available) {
      setError("El dominio no está disponible o no ha sido verificado");
      return;
    }

    if (withHosting && !selectedPackageId) {
      setError("Por favor seleccione un paquete de hosting");
      return;
    }

    // Validate required WHOIS fields
    if (!registrantName || !registrantEmail || !registrantPhone || !registrantAddress || !registrantCity || !registrantState || !registrantCountry) {
      setError("Por favor complete todos los campos requeridos de información de contacto WHOIS");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // First, update user profile if data is missing or incomplete
      await updateUserData();

      // Then proceed with domain registration
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/domains/register/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fqdn: domain,
          withHosting,
          packageID: withHosting ? selectedPackageId : null,
          registrantName,
          registrantOrg,
          registrantEmail,
          registrantPhone,
          registrantAddress,
          registrantCity,
          registrantState,
          registrantCountry,
          registrantPostalCode,
          privacyEnabled,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess("Solicitud de registro enviada correctamente. Será redirigido al pago...");
        
        // Redirect to pago; include hostingId when with hosting so price is shown from hosting package
        const params = new URLSearchParams({ tipo: 'registrar-dominio', domainId: data.domainId });
        if (data.hostingId) params.set('hostingId', data.hostingId);
        setTimeout(() => {
          router.push(`/pago?${params.toString()}`);
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || errorData.error || "Error al procesar la solicitud");
      }
    } catch (error) {
      setError("Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const updateUserData = async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      await fetch(`${basePath}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: registrantName,
          companyName: registrantOrg,
          phone: registrantPhone,
          address: registrantAddress,
          city: registrantCity,
          stateProvince: registrantState,
          country: registrantCountry,
          zipCode: registrantPostalCode,
        }),
      });
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  /** Price to show for a package: max of catalog and user's current max for that package. */
  const getDisplayPrice = (pkg: HostingPackage) =>
    Math.max(pkg.salePrice, effectivePriceByPackageId[pkg.id] ?? 0);

  return (
    <div>
      <AdminLayout>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="card w-100" style={{ maxWidth: 800, margin: '0 auto' }}>
                <div className="card-body p-30">
                  <Link href="/domains" className="c-primary fsz-sm td-n d-ib fw-500 mB-15">
                    ← Volver a dominios
                  </Link>
                  <h4 className="m-0 c-grey-900 fw-600">Registrar Nuevo Dominio</h4>
                  <p className="c-grey-600 fsz-sm mT-5 mB-25">
                    Solicita el registro de un nuevo dominio y opcionalmente contrata hosting
                  </p>

                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show mB-20" role="alert">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success alert-dismissible fade show mB-20" role="alert">
                      <strong>Éxito:</strong> {success}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Domain Selection */}
                    <div className="card bd-1 bdrs-3 mB-20">
                      <div className="card-header">
                        <h5 className="m-0 c-grey-900 fw-600">1. Seleccione su Dominio</h5>
                      </div>
                      <div className="card-body p-20">
                        <div className="row">
                          <div className="col-md-9">
                            <div className="mb-3">
                              <label htmlFor="domain" className="form-label fw-500">
                                Dominio
                              </label>
                              <input
                                id="domain"
                                type="text"
                                className="form-control form-control-lg"
                                placeholder="ejemplo.com"
                                value={domain}
                                onChange={(e: any) => setDomain(e.target.value.toLowerCase())}
                                disabled={submitting}
                              />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label fw-500">&nbsp;</label>
                              <button
                                type="button"
                                onClick={checkAvailability}
                                disabled={!domain || checkingAvailability || submitting}
                                className="btn btn-primary btn-lg w-100"
                              >
                                {checkingAvailability ? (
                                  <>
                                    <i className="ti-reload ti-spin mR-5" />
                                    Verificando
                                  </>
                                ) : (
                                  "Verificar"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {availability && (
                          <div className="alert mB-0" role="alert">
                            {availability.available ? (
                              <div className="d-f ai-c gap-2 c-success">
                                <i className="ti-check-circle fsz-lg" />
                                <span>
                                  ¡Dominio disponible!{" "}
                                  {availability.price && (
                                    <span className="fw-600">
                                      Precio: {formatPrice(availability.price, availability.currency || "COP")}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="d-f ai-c gap-2 c-danger">
                                <i className="ti-close-circle fsz-lg" />
                                <span>{availability.message || "Dominio no disponible"}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hosting Option */}
                    <div className="card bd-1 bdrs-3 mB-20">
                      <div className="card-header">
                        <h5 className="m-0 c-grey-900 fw-600">2. ¿Desea contratar Hosting?</h5>
                      </div>
                      <div className="card-body p-20">
                        <div className="alert alert-info mB-15" role="alert">
                          <i className="ti-info-alt mR-10"></i>
                          <strong>¡Oferta especial!</strong> Todos los paquetes de hosting incluyen un dominio gratuito. Si contrata hosting, el costo del registro del dominio será $0.
                        </div>
                        
                        <div className="form-check mB-15">
                          <input
                            id="withHosting"
                            type="checkbox"
                            className="form-check-input"
                            checked={withHosting}
                            onChange={(e: any) => setWithHosting(e.target.checked)}
                            disabled={submitting}
                          />
                          <label className="form-check-label" htmlFor="withHosting">
                            <strong>Sí, deseo contratar hosting para este dominio</strong> (y obtener mi dominio gratuito)
                          </label>
                        </div>

                        {withHosting && (
                          <div className="mb-3">
                            <label htmlFor="package" className="form-label fw-500">
                              Paquete de Hosting
                            </label>
                            <select
                              id="package"
                              className="form-select form-select-lg"
                              value={selectedPackageId}
                              onChange={(e: any) => setSelectedPackageId(e.target.value)}
                              disabled={submitting}
                            >
                              <option value="">Seleccione un paquete</option>
                              {packages.map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                  {pkg.name} - {pkg.diskSpaceQuotaMb ? `${pkg.diskSpaceQuotaMb.toLocaleString('es-CO')} MB` : 'Ilimitado'} - {formatPrice(getDisplayPrice(pkg), pkg.currency)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {withHosting && selectedPackage && (
                          <div className="alert alert-info mB-0" role="alert">
                            <strong>Importante:</strong> Al registrar el dominio con hosting, el costo del registro del dominio es gratuito.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* WHOIS Information */}
                    <div className="card bd-1 bdrs-3 mB-20">
                      <div className="card-header">
                        <h5 className="m-0 c-grey-900 fw-600">3. Información de Contacto WHOIS</h5>
                      </div>
                      <div className="card-body p-20">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="registrantName" className="form-label fw-500">
                                Nombre Completo *
                              </label>
                              <input
                                id="registrantName"
                                className="form-control"
                                value={registrantName}
                                onChange={(e: any) => setRegistrantName(e.target.value)}
                                disabled={submitting}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="registrantOrg" className="form-label fw-500">
                                Empresa (Opcional)
                              </label>
                              <input
                                id="registrantOrg"
                                className="form-control"
                                value={registrantOrg}
                                onChange={(e: any) => setRegistrantOrg(e.target.value)}
                                disabled={submitting}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="registrantEmail" className="form-label fw-500">
                                Email *
                              </label>
                              <input
                                id="registrantEmail"
                                type="email"
                                className="form-control"
                                value={registrantEmail}
                                onChange={(e: any) => setRegistrantEmail(e.target.value)}
                                disabled={submitting}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="registrantPhone" className="form-label fw-500">
                                Teléfono *
                              </label>
                              <input
                                id="registrantPhone"
                                className="form-control"
                                value={registrantPhone}
                                onChange={(e: any) => setRegistrantPhone(e.target.value)}
                                disabled={submitting}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="mb-3">
                              <label htmlFor="registrantAddress" className="form-label fw-500">
                                Dirección *
                              </label>
                              <input
                                id="registrantAddress"
                                className="form-control"
                                value={registrantAddress}
                                onChange={(e: any) => setRegistrantAddress(e.target.value)}
                                disabled={submitting}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label htmlFor="registrantCity" className="form-label fw-500">
                                Ciudad *
                              </label>
                              <input
                                id="registrantCity"
                                className="form-control"
                                value={registrantCity}
                                onChange={(e: any) => setRegistrantCity(e.target.value)}
                                disabled={submitting}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label htmlFor="registrantState" className="form-label fw-500">
                                Estado/Provincia *
                              </label>
                              <input
                                id="registrantState"
                                className="form-control"
                                value={registrantState}
                                onChange={(e: any) => setRegistrantState(e.target.value)}
                                disabled={submitting}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label htmlFor="registrantCountry" className="form-label fw-500">
                                País *
                              </label>
                              <input
                                id="registrantCountry"
                                className="form-control"
                                value={registrantCountry}
                                onChange={(e: any) => setRegistrantCountry(e.target.value)}
                                disabled={submitting}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="mb-3">
                              <label htmlFor="registrantPostalCode" className="form-label fw-500">
                                Código Postal
                              </label>
                              <input
                                id="registrantPostalCode"
                                className="form-control"
                                value={registrantPostalCode}
                                onChange={(e: any) => setRegistrantPostalCode(e.target.value)}
                                disabled={submitting}
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="form-check">
                              <input
                                id="privacyEnabled"
                                type="checkbox"
                                className="form-check-input"
                                checked={privacyEnabled}
                                onChange={(e: any) => setPrivacyEnabled(e.target.checked)}
                                disabled={submitting}
                              />
                              <label className="form-check-label" htmlFor="privacyEnabled">
                                Proteger privacidad WHOIS
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {(availability?.available) && (
                      <div className="card bd-1 bdrs-3 mB-20">
                        <div className="card-header">
                          <h5 className="m-0 c-grey-900 fw-600">4. Resumen</h5>
                        </div>
                        <div className="card-body p-20">
                          <div className="table-responsive">
                            <table className="table table-striped">
                              <tbody>
                                <tr>
                                  <td><strong>Dominio:</strong></td>
                                  <td className="text-end">{domain}</td>
                                </tr>
                                {withHosting && selectedPackage && (
                                  <>
                                    <tr>
                                      <td><strong>Paquete Hosting:</strong></td>
                                      <td className="text-end">{selectedPackage.name}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>Costo Hosting:</strong></td>
                                      <td className="text-end">
                                        {formatPrice(getDisplayPrice(selectedPackage), selectedPackage.currency)}
                                      </td>
                                    </tr>
                                    <tr className="c-success">
                                      <td><strong>Costo Dominio:</strong></td>
                                      <td className="text-end fw-600">GRATIS</td>
                                    </tr>
                                  </>
                                )}
                                {!withHosting && availability.price && (
                                  <tr>
                                    <td><strong>Costo Dominio:</strong></td>
                                    <td className="text-end">
                                      {formatPrice(availability.price, availability.currency || "COP")}
                                    </td>
                                  </tr>
                                )}
                                <tr className="table-active">
                                  <td><strong>Total a pagar:</strong></td>
                                  <td className="text-end fw-700 fsz-lg">
                                    {withHosting && selectedPackage
                                      ? formatPrice(getDisplayPrice(selectedPackage), selectedPackage.currency)
                                      : availability.price
                                      ? formatPrice(availability.price, availability.currency || "COP")
                                      : "Consultar"}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="d-f jc-e">
                      <button
                        type="submit"
                        disabled={submitting || !availability?.available}
                        className="btn btn-primary btn-lg px-30"
                      >
                        {submitting ? (
                          <>
                            <i className="ti-reload ti-spin mR-5" />
                            Procesando...
                          </>
                        ) : (
                          "Continuar al Pago"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}
