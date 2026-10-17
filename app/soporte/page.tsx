'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useSettings } from '../hooks/useSettings';
import { useSession } from '../hooks/useSession';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type TicketMessage = {
  id: string;
  ticketID: string;
  userID: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
};

type Ticket = {
  id: string;
  ticketNumber: number;
  userID: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  serviceType: string | null;
  serviceId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    companyName?: string;
  };
  _count?: {
    messages: number;
  };
  messages?: TicketMessage[];
};

const CATEGORIES = [
  'Soporte Técnico',
  'Hosting & Servidor',
  'Dominios & DNS',
  'Correo Corporativo',
  'Facturación & Pagos',
  'Migración de Sitio',
  'Consulta General',
  'Otro',
];

const STATUS_LABELS: Record<TicketStatus, { label: string; badgeClass: string; bg: string; color: string }> = {
  OPEN: { label: 'Abierto', badgeClass: 'badge bg-primary', bg: '#e0f2fe', color: '#0369a1' },
  IN_PROGRESS: { label: 'En Proceso', badgeClass: 'badge bg-warning', bg: '#fef3c7', color: '#b45309' },
  RESOLVED: { label: 'Resuelto', badgeClass: 'badge bg-success', bg: '#dcfce7', color: '#15803d' },
  CLOSED: { label: 'Cerrado', badgeClass: 'badge bg-secondary', bg: '#f1f5f9', color: '#475569' },
};

const PRIORITY_LABELS: Record<TicketPriority, { label: string; bg: string; color: string }> = {
  LOW: { label: 'Baja', bg: '#f3f4f6', color: '#4b5563' },
  MEDIUM: { label: 'Media', bg: '#e0e7ff', color: '#3730a3' },
  HIGH: { label: 'Alta', bg: '#ffedd5', color: '#c2410c' },
  URGENT: { label: 'Urgente', bg: '#fee2e2', color: '#b91c1c' },
};

function buildWhatsAppUrl(phone: string, text: string): string {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('57') ? clean : `57${clean}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function SoportePage() {
  const { user } = useSession();
  const { settings } = useSettings();
  const whatsappNumber = settings?.whatsapp_number || '';
  const isAdmin = user?.role === 'ADMIN';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);

  // Create form state
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Soporte Técnico');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${basePath}/api/tickets?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.tickets) {
        setTickets(data.tickets);
      } else {
        setError(data.error || 'Error al cargar los tickets');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTicketDetail = async (ticketId: string) => {
    try {
      setLoadingTicketDetail(true);
      const res = await fetch(`${basePath}/api/tickets/${ticketId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setSelectedTicket(data.ticket);
      } else {
        alert(data.error || 'Error al cargar el detalle del ticket');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    try {
      setCreating(true);
      const res = await fetch(`${basePath}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: newPriority,
          message: newMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setShowCreateModal(false);
        setNewSubject('');
        setNewMessage('');
        fetchTickets();
        openTicketDetail(data.ticket.id);
      } else {
        alert(data.error || 'Error al crear el ticket');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const res = await fetch(`${basePath}/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setReplyText('');
        // Refresh ticket detail & list
        await openTicketDetail(selectedTicket.id);
        fetchTickets();
      } else {
        alert(data.error || 'Error al enviar la respuesta');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const res = await fetch(`${basePath}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
        }
        fetchTickets();
      } else {
        alert(data.error || 'Error al cambiar estado');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const handleUpdatePriority = async (ticketId: string, newPriority: TicketPriority) => {
    try {
      const res = await fetch(`${basePath}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priority: newPriority }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) => prev ? { ...prev, priority: newPriority } : null);
        }
        fetchTickets();
      } else {
        alert(data.error || 'Error al cambiar prioridad');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    return { total, open, inProgress, resolved };
  }, [tickets]);

  return (
    <AdminLayout>
      <div className="container-fluid" style={{ paddingBottom: '3rem' }}>
        {/* Hero Banner */}
        <div
          className="bd bdrs-10 p-25 mB-25"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)',
          }}
        >
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-15">
            <div>
              <h3 className="mB-5" style={{ fontWeight: 700, color: '#fff' }}>
                Centro de Tickets de Soporte
              </h3>
              <p className="mB-0" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                Gestiona tus consultas, reportes técnicos y solicitudes de servicio en tiempo real.
              </p>
            </div>
            <div className="d-flex gap-10 flex-wrap">
              {whatsappNumber && (
                <button
                  type="button"
                  onClick={() => window.open(buildWhatsAppUrl(whatsappNumber, 'Hola, necesito asistencia con mis servicios.'), '_blank')}
                  className="btn btn-outline-light d-flex align-items-center gap-5"
                  style={{ borderRadius: '8px', fontWeight: 500 }}
                >
                  <i className="ti-comments" /> WhatsApp Directo
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary d-flex align-items-center gap-5"
                style={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb',
                }}
              >
                <i className="ti-plus" /> Abrir Nuevo Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="row g-3 mB-25">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
              <div className="card-body p-20 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    Total Tickets
                  </span>
                  <h3 className="mB-0 mt-1 fw-bold">{stats.total}</h3>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#475569',
                    fontSize: '1.25rem',
                  }}
                >
                  <i className="ti-ticket" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
              <div className="card-body p-20 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    Abiertos
                  </span>
                  <h3 className="mB-0 mt-1 fw-bold text-primary">{stats.open}</h3>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    fontSize: '1.25rem',
                  }}
                >
                  <i className="ti-alert" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
              <div className="card-body p-20 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    En Proceso
                  </span>
                  <h3 className="mB-0 mt-1 fw-bold text-warning">{stats.inProgress}</h3>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706',
                    fontSize: '1.25rem',
                  }}
                >
                  <i className="ti-reload" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
              <div className="card-body p-20 d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    Resueltos / Cerrados
                  </span>
                  <h3 className="mB-0 mt-1 fw-bold text-success">{stats.resolved}</h3>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    fontSize: '1.25rem',
                  }}
                >
                  <i className="ti-check" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="card shadow-sm border-0 mB-20" style={{ borderRadius: '10px' }}>
          <div className="card-body p-20">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="ti-search text-muted" />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por asunto, número de ticket o categoría..."
                    className="form-control border-start-0 ps-0"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.9rem' }}
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="OPEN">Abierto</option>
                  <option value="IN_PROGRESS">En Proceso</option>
                  <option value="RESOLVED">Resuelto</option>
                  <option value="CLOSED">Cerrado</option>
                </select>
              </div>
              <div className="col-6 col-md-3">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.9rem' }}
                >
                  <option value="ALL">Todas las Prioridades</option>
                  <option value="URGENT">Urgente</option>
                  <option value="HIGH">Alta</option>
                  <option value="MEDIUM">Media</option>
                  <option value="LOW">Baja</option>
                </select>
              </div>
              <div className="col-12 col-md-1 text-end">
                <button
                  type="button"
                  onClick={fetchTickets}
                  className="btn btn-outline-secondary w-100"
                  title="Refrescar lista"
                >
                  <i className="ti-reload" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mB-20 d-flex align-items-center gap-10">
            <i className="ti-alert" /> {error}
          </div>
        )}

        {/* Tickets Table / List */}
        <div className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center p-50">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-3 text-muted">Cargando tickets de soporte...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center p-50">
                <div style={{ fontSize: '3rem', color: '#cbd5e1' }}>
                  <i className="ti-comments-smiley" />
                </div>
                <h5 className="mt-3 text-secondary">No se encontraron tickets</h5>
                <p className="text-muted" style={{ maxWidth: 450, margin: '0 auto' }}>
                  No hay tickets que coincidan con los filtros aplicados. Puedes abrir una nueva solicitud de soporte con el botón superior.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary mt-3"
                  style={{ borderRadius: '8px' }}
                >
                  Abrir Nuevo Ticket
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ background: '#f8fafc', fontSize: '0.8rem', color: '#64748b' }}>
                    <tr>
                      <th className="ps-4">TICKET</th>
                      <th>ASUNTO & CATEGORÍA</th>
                      {isAdmin && <th>CLIENTE</th>}
                      <th>ESTADO</th>
                      <th>PRIORIDAD</th>
                      <th>MENSAJES</th>
                      <th>ÚLTIMA ACTIVIDAD</th>
                      <th className="text-end pe-4">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => {
                      const statusMeta = STATUS_LABELS[t.status] || STATUS_LABELS.OPEN;
                      const priorityMeta = PRIORITY_LABELS[t.priority] || PRIORITY_LABELS.MEDIUM;

                      return (
                        <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => openTicketDetail(t.id)}>
                          <td className="ps-4 fw-bold text-muted">
                            #{String(t.ticketNumber).padStart(4, '0')}
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{t.subject}</div>
                            <span className="badge bg-light text-secondary border mt-1" style={{ fontSize: '0.75rem' }}>
                              {t.category || 'General'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td>
                              <div className="fw-medium text-dark">{t.user?.fullName || 'Usuario'}</div>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{t.user?.email}</div>
                            </td>
                          )}
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: statusMeta.bg,
                                color: statusMeta.color,
                              }}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: priorityMeta.bg,
                                color: priorityMeta.color,
                              }}
                            >
                              {priorityMeta.label}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              <i className="ti-comment-alt me-1" /> {t._count?.messages || 1}
                            </span>
                          </td>
                          <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                            {formatDate(t.updatedAt)}
                          </td>
                          <td className="text-end pe-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTicketDetail(t.id);
                              }}
                              className="btn btn-sm btn-outline-primary"
                              style={{ borderRadius: '6px' }}
                            >
                              Ver Conversación
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create Ticket */}
        {showCreateModal && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">Abrir Nuevo Ticket de Soporte</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Cerrar"
                  />
                </div>
                <form onSubmit={handleCreateTicket}>
                  <div className="modal-body p-25">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Asunto del Ticket *</label>
                      <input
                        type="text"
                        required
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Ej. Problema con certificado SSL en dominio..."
                        className="form-control"
                      />
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Categoría</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="form-select"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Nivel de Prioridad</label>
                        <select
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                          className="form-select"
                        >
                          <option value="LOW">Baja (Consultas generales)</option>
                          <option value="MEDIUM">Media (Comportamiento irregular)</option>
                          <option value="HIGH">Alta (Servicio degradado)</option>
                          <option value="URGENT">Urgente (Sitio o correos caídos)</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Descripción Detallada *</label>
                      <textarea
                        required
                        rows={5}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Describe el inconveniente o la solicitud con el mayor detalle posible. Incluye mensajes de error o URLs relevantes..."
                        className="form-control"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="btn btn-primary d-flex align-items-center gap-5"
                    >
                      {creating && <div className="spinner-border spinner-border-sm" role="status" />}
                      Crear Ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Ticket Conversation Thread */}
        {selectedTicket && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', maxHeight: '90vh' }}>
                <div className="modal-header bg-light border-bottom">
                  <div className="d-flex align-items-center gap-15 flex-wrap">
                    <span className="badge bg-secondary" style={{ fontSize: '0.9rem' }}>
                      #{String(selectedTicket.ticketNumber).padStart(4, '0')}
                    </span>
                    <div>
                      <h5 className="modal-title fw-bold mB-0 text-dark">
                        {selectedTicket.subject}
                      </h5>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Categoría: <strong>{selectedTicket.category || 'General'}</strong> • Creado: {formatDate(selectedTicket.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-10">
                    {/* Status badge / selector */}
                    {isAdmin ? (
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)}
                        className="form-select form-select-sm"
                        style={{ width: 'auto', fontWeight: 600 }}
                      >
                        <option value="OPEN">Abierto</option>
                        <option value="IN_PROGRESS">En Proceso</option>
                        <option value="RESOLVED">Resuelto</option>
                        <option value="CLOSED">Cerrado</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: STATUS_LABELS[selectedTicket.status]?.bg || '#f1f5f9',
                          color: STATUS_LABELS[selectedTicket.status]?.color || '#475569',
                        }}
                      >
                        {STATUS_LABELS[selectedTicket.status]?.label || selectedTicket.status}
                      </span>
                    )}

                    {/* Priority badge / selector */}
                    {isAdmin ? (
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as TicketPriority)}
                        className="form-select form-select-sm"
                        style={{ width: 'auto', fontWeight: 600 }}
                      >
                        <option value="LOW">Prioridad Baja</option>
                        <option value="MEDIUM">Prioridad Media</option>
                        <option value="HIGH">Prioridad Alta</option>
                        <option value="URGENT">Prioridad Urgente</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: PRIORITY_LABELS[selectedTicket.priority]?.bg || '#f3f4f6',
                          color: PRIORITY_LABELS[selectedTicket.priority]?.color || '#4b5563',
                        }}
                      >
                        {PRIORITY_LABELS[selectedTicket.priority]?.label || selectedTicket.priority}
                      </span>
                    )}

                    {/* Client resolution button */}
                    {!isAdmin && selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                        className="btn btn-sm btn-outline-success"
                      >
                        <i className="ti-check" /> Marcar Resuelto
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-close ms-2"
                      onClick={() => setSelectedTicket(null)}
                      aria-label="Cerrar"
                    />
                  </div>
                </div>

                <div className="modal-body p-25" style={{ background: '#f8fafc' }}>
                  {loadingTicketDetail ? (
                    <div className="text-center p-30">
                      <div className="spinner-border text-primary" role="status" />
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-15">
                      {selectedTicket.messages && selectedTicket.messages.map((m, idx) => {
                        const isMsgAdmin = m.isAdmin || m.user?.role === 'ADMIN';

                        return (
                          <div
                            key={m.id || idx}
                            className={`p-20 shadow-sm border ${
                              isMsgAdmin ? 'bg-white border-primary border-opacity-25 ms-md-4' : 'bg-white me-md-4'
                            }`}
                            style={{
                              borderRadius: '10px',
                              borderLeft: isMsgAdmin ? '4px solid #2563eb' : '4px solid #64748b',
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center gap-10">
                                <span className="fw-bold text-dark">
                                  {m.user?.fullName || (isMsgAdmin ? 'Soporte Técnico' : 'Cliente')}
                                </span>
                                {isMsgAdmin ? (
                                  <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>
                                    Equipo de Soporte
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                                    Cliente
                                  </span>
                                )}
                              </div>
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                {formatDate(m.createdAt)}
                              </span>
                            </div>
                            <div
                              style={{
                                color: '#334155',
                                fontSize: '0.95rem',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                              }}
                            >
                              {m.message}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reply Footer */}
                <div className="modal-footer bg-white border-top p-20 d-block">
                  <form onSubmit={handleSendReply}>
                    <div className="mb-2">
                      <label className="form-label fw-semibold text-dark">
                        Escribir una Respuesta en este Ticket:
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        className="form-control"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Al responder, el estado del ticket se actualizará automáticamente para dar seguimiento.
                      </div>
                      <div className="d-flex gap-10">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setSelectedTicket(null)}
                        >
                          Cerrar Vista
                        </button>
                        <button
                          type="submit"
                          disabled={sendingReply || !replyText.trim()}
                          className="btn btn-primary d-flex align-items-center gap-5"
                          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                        >
                          {sendingReply && <div className="spinner-border spinner-border-sm" role="status" />}
                          <i className="ti-share-alt" /> Enviar Respuesta
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
