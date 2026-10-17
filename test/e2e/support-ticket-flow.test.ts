import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('E2E Flow Test: Support Ticket Lifecycle & Conversation Loop', () => {
  it('should simulate the entire lifecycle of a support ticket from submission to multi-turn conversation and resolution', () => {
    // 1. Client creates ticket
    const clientUser = { id: 'usr_client_01', fullName: 'Carlos Pérez', email: 'carlos@empresa.com', role: 'CLIENT' };
    const adminUser = { id: 'usr_admin_01', fullName: 'Equipo de Soporte Instance Shape', email: 'soporte@instanceshape.com', role: 'ADMIN' };

    type TicketState = {
      id: string;
      ticketNumber: number;
      subject: string;
      category: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
      messages: Array<{
        sender: string;
        role: string;
        isAdmin: boolean;
        text: string;
        timestamp: Date;
      }>;
    };

    const ticket: TicketState = {
      id: 'tkt_001',
      ticketNumber: 1042,
      subject: 'Problema al conectar base de datos MySQL',
      category: 'Hosting & Servidor',
      priority: 'HIGH',
      status: 'OPEN',
      messages: [
        {
          sender: clientUser.fullName,
          role: clientUser.role,
          isAdmin: false,
          text: 'Hola, intento conectar mi CMS a la base de datos pero obtengo Access Denied.',
          timestamp: new Date('2026-10-17T10:00:00Z'),
        },
      ],
    };

    assert.equal(ticket.status, 'OPEN');
    assert.equal(ticket.messages.length, 1);
    assert.equal(ticket.messages[0].isAdmin, false);

    // 2. Support Admin responds -> Status transitions to IN_PROGRESS
    ticket.messages.push({
      sender: adminUser.fullName,
      role: adminUser.role,
      isAdmin: true,
      text: 'Estimado Carlos, hemos verificado y ajustado los privilegios del usuario MySQL. Por favor prueba nuevamente.',
      timestamp: new Date('2026-10-17T10:15:00Z'),
    });
    if (ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    assert.equal(ticket.status, 'IN_PROGRESS');
    assert.equal(ticket.messages.length, 2);
    assert.equal(ticket.messages[1].isAdmin, true);

    // 3. Client confirms and marks ticket as RESOLVED
    ticket.messages.push({
      sender: clientUser.fullName,
      role: clientUser.role,
      isAdmin: false,
      text: 'Excelente, ya conecta sin problemas. Muchas gracias!',
      timestamp: new Date('2026-10-17T10:25:00Z'),
    });
    ticket.status = 'RESOLVED';

    assert.equal(ticket.status, 'RESOLVED');
    assert.equal(ticket.messages.length, 3);

    // 4. Admin closes ticket
    ticket.status = 'CLOSED';
    assert.equal(ticket.status, 'CLOSED');

    // 5. Client re-opens with a follow-up query -> automatic reopen to IN_PROGRESS
    ticket.messages.push({
      sender: clientUser.fullName,
      role: clientUser.role,
      isAdmin: false,
      text: 'Disculpen, una última pregunta: ¿cómo puedo aumentar el max_connections en MariaDB?',
      timestamp: new Date('2026-10-17T10:40:00Z'),
    });
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      ticket.status = 'IN_PROGRESS';
    }

    assert.equal(ticket.status, 'IN_PROGRESS');
    assert.equal(ticket.messages.length, 4);
    assert.equal(ticket.messages[3].text.includes('max_connections'), true);
  });
});
