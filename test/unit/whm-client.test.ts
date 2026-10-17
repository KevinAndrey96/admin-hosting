import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveWhmUsernameFromDomain,
  invalidateWhmAccountsCache,
  invalidateWhmEmailCache,
} from '@/lib/whm-client';

describe('Unit Test: WHM / cPanel Client & Cache Management (whm-client.ts)', () => {
  it('deriveWhmUsernameFromDomain should sanitize and format cPanel usernames according to cPanel specs', () => {
    // Normal domains
    assert.equal(deriveWhmUsernameFromDomain('instanceshape.com'), 'instanceshape');
    assert.equal(deriveWhmUsernameFromDomain('dualbs.com'), 'dualbs');
    assert.equal(deriveWhmUsernameFromDomain('frutyexpres.com'), 'frutyexpres');

    // Long domains must be trimmed to 16 characters
    // 'theagadvantagegroup' -> length 19 -> slice to 16
    const advantageUser = deriveWhmUsernameFromDomain('theagadvantagegroup.com');
    assert.equal(advantageUser.length <= 16, true);
    assert.equal(advantageUser, 'theagadvantagegr');

    // Domains starting with number must be prefixed with 'u' (cPanel restriction)
    assert.equal(deriveWhmUsernameFromDomain('123host.com'), 'u123host');
    assert.equal(deriveWhmUsernameFromDomain('24horas.com.co'), 'u24horas');
  });

  it('Cache invalidation functions should execute without throwing errors', () => {
    assert.doesNotThrow(() => {
      invalidateWhmAccountsCache();
      invalidateWhmEmailCache('instanceshape');
      invalidateWhmEmailCache(); // All accounts
    });
  });
});
