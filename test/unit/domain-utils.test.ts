import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidFqdn, isValidEmail } from '@/lib/domain-utils';

describe('Unit Test: Domain & Email Validation Utilities (domain-utils.ts)', () => {
  it('isValidFqdn should validate legitimate domain names', () => {
    assert.equal(isValidFqdn('instanceshape.com'), true);
    assert.equal(isValidFqdn('theagadvantagegroup.com'), true);
    assert.equal(isValidFqdn('dualbs.com'), true);
    assert.equal(isValidFqdn('garix.com.co'), true);
    assert.equal(isValidFqdn('mrchorro.app'), true);
    assert.equal(isValidFqdn('webmastercolombia.net'), true);
  });

  it('isValidFqdn should reject invalid, malicious, or malformed domain strings', () => {
    assert.equal(isValidFqdn(''), false);
    assert.equal(isValidFqdn('http://instanceshape.com'), false);
    assert.equal(isValidFqdn('instanceshape.com/admin'), false);
    assert.equal(isValidFqdn('instanceshape'), false);
    assert.equal(isValidFqdn('instanceshape:2087'), false);
    assert.equal(isValidFqdn('   '), false);
    assert.equal(isValidFqdn('domain..com'), false);
    assert.equal(isValidFqdn('a'.repeat(254) + '.com'), false);
  });

  it('isValidEmail should validate legitimate email addresses', () => {
    assert.equal(isValidEmail('no-reply@instanceshape.com'), true);
    assert.equal(isValidEmail('kevinandrey@instanceshape.com'), true);
    assert.equal(isValidEmail('admin@theagadvantagegroup.com'), true);
    assert.equal(isValidEmail('soporte.tecnico@dualbs.com'), true);
  });

  it('isValidEmail should reject invalid email addresses', () => {
    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail('no-reply'), false);
    assert.equal(isValidEmail('no-reply@'), false);
    assert.equal(isValidEmail('@instanceshape.com'), false);
    assert.equal(isValidEmail('no reply@instanceshape.com'), false);
  });
});
