import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toNumber, getHostingEffectivePrice } from '@/lib/hosting-price';

describe('Unit Test: Hosting Price Calculation (hosting-price.ts)', () => {
  it('toNumber should correctly parse numbers, strings and Prisma-like Decimals', () => {
    assert.equal(toNumber(150000), 150000);
    assert.equal(toNumber('150000'), 150000);
    assert.equal(toNumber('150000.50'), 150000.50);
    assert.equal(toNumber(null), null);
    assert.equal(toNumber(undefined), null);
    assert.equal(toNumber(''), null);
    assert.equal(toNumber('not-a-number'), null);

    // Mock Prisma Decimal object with toNumber()
    const mockPrismaDecimal = {
      toNumber: () => 249000.00,
    };
    assert.equal(toNumber(mockPrismaDecimal), 249000.00);
  });

  it('getHostingEffectivePrice should return standard package price when no override is set', () => {
    const hosting = {
      salePriceOverride: null,
      hostingPackage: {
        salePrice: 199000,
        currency: 'COP',
      },
    };

    const result = getHostingEffectivePrice(hosting);
    assert.equal(result.salePrice, 199000);
    assert.equal(result.currency, 'COP');
  });

  it('getHostingEffectivePrice should return salePriceOverride when valid override is provided', () => {
    const hosting = {
      salePriceOverride: 120000,
      hostingPackage: {
        salePrice: 199000,
        currency: 'COP',
      },
    };

    const result = getHostingEffectivePrice(hosting);
    assert.equal(result.salePrice, 120000);
    assert.equal(result.currency, 'COP');
  });

  it('getHostingEffectivePrice should support 0 COP price for bundled/included services', () => {
    const hosting = {
      salePriceOverride: 0,
      hostingPackage: {
        salePrice: 199000,
        currency: 'COP',
      },
    };

    const result = getHostingEffectivePrice(hosting);
    assert.equal(result.salePrice, 0);
  });

  it('getHostingEffectivePrice should fallback gracefully when hostingPackage is null', () => {
    const hosting = {
      salePriceOverride: null,
      hostingPackage: null,
    };

    const result = getHostingEffectivePrice(hosting);
    assert.equal(result.salePrice, 0);
    assert.equal(result.currency, 'COP');
  });
});
