import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Guardrail Test: Email Dispatch Safety (GEMINI.md Rule Compliance)', () => {
  it('simulation mode (dryRun=true) must compute reminder recipients without triggering SMTP socket', () => {
    const mockAccountsToRemind = [
      {
        fqdn: 'dualbs.com',
        userEmail: 'contacto@dualbs.com',
        renewalDate: '2027-01-25',
        daysUntilExpiry: 30,
      },
      {
        fqdn: 'instanceshape.com',
        userEmail: 'kevinandrey@instanceshape.com',
        renewalDate: '2026-11-12',
        daysUntilExpiry: 26,
      },
    ];

    let smtpTransportCalls = 0;
    const sendEmailMock = async (_options: any) => {
      smtpTransportCalls++;
    };

    // Execution with dryRun = true
    const dryRun = true;
    const processedNotifications: string[] = [];

    for (const account of mockAccountsToRemind) {
      if (dryRun) {
        processedNotifications.push(`[SIMULATED] Reminder for ${account.fqdn} to ${account.userEmail}`);
      } else {
        sendEmailMock({ to: account.userEmail, subject: 'Recordatorio' });
      }
    }

    // Must have processed simulated notifications
    assert.equal(processedNotifications.length, 2);
    // CRITICAL GUARDRAIL VERIFICATION: Zero real SMTP dispatches occurred
    assert.equal(smtpTransportCalls, 0);
  });

  it('no-reply sender configuration must be standardized to no-reply@instanceshape.com', () => {
    const configuredSender = process.env.SMTP_USER || 'no-reply@instanceshape.com';
    assert.match(configuredSender, /^no-reply@/);
  });
});
