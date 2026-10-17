import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Mock business logic helper simulating ticket state machine
function validateTicketCreation(input: {
  subject?: string;
  message?: string;
  priority?: string;
  category?: string;
}) {
  if (!input.subject || !input.subject.trim()) {
    return { ok: false, error: 'El asunto del ticket es obligatorio' };
  }
  if (!input.message || !input.message.trim()) {
    return { ok: false, error: 'El mensaje descriptivo es obligatorio' };
  }

  const validPriorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const priority: TicketPriority = validPriorities.includes(input.priority as TicketPriority)
    ? (input.priority as TicketPriority)
    : 'MEDIUM';

  return {
    ok: true,
    data: {
      subject: input.subject.trim(),
      message: input.message.trim(),
      priority,
      category: input.category?.trim() || 'General',
      status: 'OPEN' as TicketStatus,
    },
  };
}

function computeTicketTransitionOnReply(
  currentStatus: TicketStatus,
  authorRole: 'ADMIN' | 'CLIENT'
): TicketStatus {
  // If client replies to resolved or closed ticket, automatically reopen to IN_PROGRESS
  if (authorRole === 'CLIENT' && (currentStatus === 'RESOLVED' || currentStatus === 'CLOSED')) {
    return 'IN_PROGRESS';
  }
  // If admin replies to an OPEN ticket, advance to IN_PROGRESS
  if (authorRole === 'ADMIN' && currentStatus === 'OPEN') {
    return 'IN_PROGRESS';
  }
  return currentStatus;
}

describe('Integration Test: Support Ticket Lifecycle & State Transitions', () => {
  it('should validate ticket creation inputs and require subject and message', () => {
    const missingSubject = validateTicketCreation({ message: 'Detalles del error' });
    assert.equal(missingSubject.ok, false);
    assert.equal(missingSubject.error, 'El asunto del ticket es obligatorio');

    const missingMessage = validateTicketCreation({ subject: 'Falla en cPanel' });
    assert.equal(missingMessage.ok, false);
    assert.equal(missingMessage.error, 'El mensaje descriptivo es obligatorio');

    const valid = validateTicketCreation({
      subject: 'Problema con SSL',
      message: 'El certificado no se renueva automáticamente',
      priority: 'HIGH',
      category: 'Dominios & DNS',
    });
    assert.equal(valid.ok, true);
    assert.equal(valid.data?.status, 'OPEN');
    assert.equal(valid.data?.priority, 'HIGH');
    assert.equal(valid.data?.category, 'Dominios & DNS');
  });

  it('should fallback to MEDIUM priority when unrecognized priority is supplied', () => {
    const result = validateTicketCreation({
      subject: 'Consulta general',
      message: '¿Cuáles son los nameservers?',
      priority: 'SUPER_URGENTE_INVALIDA',
    });
    assert.equal(result.ok, true);
    assert.equal(result.data?.priority, 'MEDIUM');
  });

  it('should automatically transition ticket to IN_PROGRESS when Admin replies to an OPEN ticket', () => {
    const nextStatus = computeTicketTransitionOnReply('OPEN', 'ADMIN');
    assert.equal(nextStatus, 'IN_PROGRESS');
  });

  it('should automatically reopen ticket to IN_PROGRESS when Client replies to a RESOLVED or CLOSED ticket', () => {
    const afterResolved = computeTicketTransitionOnReply('RESOLVED', 'CLIENT');
    assert.equal(afterResolved, 'IN_PROGRESS');

    const afterClosed = computeTicketTransitionOnReply('CLOSED', 'CLIENT');
    assert.equal(afterClosed, 'IN_PROGRESS');
  });

  it('should preserve IN_PROGRESS status during ongoing discussion', () => {
    const statusAdmin = computeTicketTransitionOnReply('IN_PROGRESS', 'ADMIN');
    assert.equal(statusAdmin, 'IN_PROGRESS');

    const statusClient = computeTicketTransitionOnReply('IN_PROGRESS', 'CLIENT');
    assert.equal(statusClient, 'IN_PROGRESS');
  });
});
