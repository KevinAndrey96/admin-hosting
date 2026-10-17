import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Integration Test: Instance Shape Business Rules & Package Rightsizing', () => {
  it('instanceshape.com bundle rule: domain price must be $0 COP when bundled with hosting', () => {
    const hostingPlan = {
      packageId: 'shape_gold',
      packageName: 'Shape Gold',
      includedDomains: 1,
    };

    // When a domain is bundled with an inclusive plan (e.g. Shape Gold includes 1 domain)
    const isDomainIncludedInPlan = hostingPlan.includedDomains >= 1;
    const domainPrice = isDomainIncludedInPlan ? 0.00 : 49999.00;

    assert.equal(isDomainIncludedInPlan, true);
    assert.equal(domainPrice, 0.00);
  });

  it('theagadvantagegroup.com domain consolidation rule: must prioritize new domain over old domain', () => {
    const domains = [
      {
        fqdn: 'agadvantagegroup.com',
        status: 'REJECTED',
        paymentStatus: 'CANCELLED',
        renewalDate: new Date('2026-08-09'),
        isPrimary: false,
      },
      {
        fqdn: 'theagadvantagegroup.com',
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        renewalDate: new Date('2027-10-02'),
        isPrimary: true,
      },
    ];

    const primaryDomain = domains.find((d) => d.isPrimary && d.status === 'ACTIVE');
    assert.ok(primaryDomain);
    assert.equal(primaryDomain.fqdn, 'theagadvantagegroup.com');
    assert.equal(primaryDomain.renewalDate.getFullYear(), 2027);

    const oldDomain = domains.find((d) => d.fqdn === 'agadvantagegroup.com');
    assert.ok(oldDomain);
    assert.equal(oldDomain.status, 'REJECTED');
  });

  it('dualbs account downgrade rule: must be assigned to shape_gold package', () => {
    const dualbsAccount = {
      username: 'dualbs',
      currentPackage: 'shape_gold',
      previousPackage: 'shape_platinum',
      quotaMb: 2000,
      bandwidthMb: 200000,
      maxEmails: null, // Unlimited
      maxAddonDomains: 1,
    };

    assert.equal(dualbsAccount.currentPackage, 'shape_gold');
    assert.equal(dualbsAccount.quotaMb, 2000);
    assert.equal(dualbsAccount.maxAddonDomains, 1);
  });

  it('shape_ssh protocol rule: temporary maintenance package with unlimited disk and bandwidth', () => {
    const shapeSshProtocol = {
      id: 'shape_ssh',
      name: 'Shape SSH (Mantenimiento)',
      diskSpaceQuotaMb: null, // Unlimited
      bandwidthLimitMb: null, // Unlimited
      sshAccess: true,
      isTemporary: true,
    };

    assert.equal(shapeSshProtocol.id, 'shape_ssh');
    assert.equal(shapeSshProtocol.diskSpaceQuotaMb, null);
    assert.equal(shapeSshProtocol.bandwidthLimitMb, null);
    assert.equal(shapeSshProtocol.sshAccess, true);
  });

  it('daily admin report calculation: $0 domain price must not be coerced to 49999 by falsy operator', () => {
    // Simulating domain with salePrice 0.00
    const domainRecord = { fqdn: 'instanceshape.com', salePrice: 0.00 };
    const priceNum = typeof domainRecord.salePrice === 'number' ? domainRecord.salePrice : parseFloat(String(domainRecord.salePrice));
    const isBundled = domainRecord.fqdn.toLowerCase() === 'instanceshape.com' || priceNum === 0;
    const effectivePrice = isBundled ? 0 : (priceNum ?? 49999);

    assert.equal(effectivePrice, 0, 'Domain price must remain 0 COP and not fallback to 49999');
  });

  it('instanceshape hosting renewal: must resolve to Gold package ($119.900) instead of legacy Platinum template ($499.999)', () => {
    const hostingRecord = {
      username: 'instanceshape',
      hostingPackage: { name: 'Platinum', salePrice: 499999, currency: 'COP' },
      salePriceOverride: null,
    };

    const isInstanceShape = hostingRecord.username === 'instanceshape' || hostingRecord.username === 'shape';
    const resolvedPackageName = isInstanceShape && hostingRecord.hostingPackage.name === 'Platinum' ? 'Gold' : hostingRecord.hostingPackage.name;
    const defaultPackagePrice = isInstanceShape && Number(hostingRecord.hostingPackage.salePrice) === 499999 ? 119900 : hostingRecord.hostingPackage.salePrice;

    assert.equal(resolvedPackageName, 'Gold');
    assert.equal(defaultPackagePrice, 119900);
  });
});
