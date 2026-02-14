/**
 * Prisma Seed - Initial data from JSON files
 * Run: npm run db:seed (or automatic with db:reset)
 * Users and domains use explicit IDs for cross-reference.
 */
import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const SALT_ROUNDS = 10;
const DATA_DIR = path.join(__dirname, 'data');

function loadJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function main() {
  // Settings
  const settings = loadJson<Record<string, string>>('settings.json');
  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.setting.create({ data: { key, value } });
    }
  }
  console.log('Settings seed completed.');

  // Packages (with explicit IDs for cross-reference)
  const packages = loadJson<Array<{
    id: string;
    name: string;
    colorHex?: string;
    salePrice: number;
    currency?: string;
    diskSpaceQuotaMb?: number | 'unlimited';
    bandwidthLimitMb?: number | 'unlimited';
    maxEmailAccounts?: number | 'unlimited';
    maxParkedDomains?: number | 'unlimited';
    maxAddonDomains?: number | 'unlimited';
    includedDomains?: number;
  }>>('packages.json');

  const parseLimit = (v: number | 'unlimited' | undefined): number | null => {
    if (v === 'unlimited' || v == null) return null;
    return typeof v === 'number' ? v : null;
  };

  for (const p of packages) {
    await prisma.hostingPackage.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        colorHex: p.colorHex?.trim() || null,
        salePrice: p.salePrice,
        currency: p.currency || 'COP',
        diskSpaceQuotaMb: parseLimit(p.diskSpaceQuotaMb),
        bandwidthLimitMb: parseLimit(p.bandwidthLimitMb),
        maxEmailAccounts: parseLimit(p.maxEmailAccounts),
        maxParkedDomains: parseLimit(p.maxParkedDomains),
        maxAddonDomains: parseLimit(p.maxAddonDomains),
        includedDomains: p.includedDomains ?? 1,
      },
      update: {
        name: p.name,
        colorHex: p.colorHex?.trim() || null,
        salePrice: p.salePrice,
        currency: p.currency || 'COP',
        diskSpaceQuotaMb: parseLimit(p.diskSpaceQuotaMb),
        bandwidthLimitMb: parseLimit(p.bandwidthLimitMb),
        maxEmailAccounts: parseLimit(p.maxEmailAccounts),
        maxParkedDomains: parseLimit(p.maxParkedDomains),
        maxAddonDomains: parseLimit(p.maxAddonDomains),
        includedDomains: p.includedDomains ?? 1,
      },
    });
    console.log(`Package seeded: ${p.name} (${p.id})`);
  }

  // Users (with explicit IDs for cross-reference)
  const users = loadJson<Array<{
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    companyName?: string | null;
    address?: string | null;
    zipCode?: string | null;
    password: string;
    role: 'ADMIN' | 'CLIENT';
    status: 'ENABLED' | 'DISABLED';
  }>>('users.json');

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone ?? null,
        companyName: u.companyName ?? null,
        address: u.address ?? null,
        zipCode: u.zipCode ?? null,
        password: hashedPassword,
        role: u.role,
        status: u.status,
      },
      update: {
        fullName: u.fullName,
        phone: u.phone ?? null,
        companyName: u.companyName ?? null,
        address: u.address ?? null,
        zipCode: u.zipCode ?? null,
        password: hashedPassword,
        role: u.role,
        status: u.status,
      },
    });
    console.log(`User seeded: ${u.email} (${u.role})`);
  }

  // Domains (reference userID from users)
  const domains = loadJson<Array<{
    userID: string;
    registrarName: string;
    fqdn: string;
    salePrice: number;
    currency?: string;
    renewalDate: string;
    paymentStatus?: string;
    transferLock?: boolean;
    nameserver1?: string;
    nameserver2?: string;
  }>>('domains.json');

  for (const d of domains) {
    const renewal = new Date(d.renewalDate);
    const existing = await prisma.domain.findFirst({
      where: { fqdn: d.fqdn.toLowerCase(), userID: d.userID },
    });
    if (!existing) {
      await prisma.domain.create({
        data: {
          userID: d.userID,
          registrarName: d.registrarName,
          fqdn: d.fqdn.toLowerCase(),
          salePrice: d.salePrice,
          currency: d.currency || 'COP',
          renewalDate: renewal,
          nextBillingDate: renewal,
          paymentStatus: (['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(d.paymentStatus || '')
            ? (d.paymentStatus as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED')
            : d.paymentStatus === 'UNPAID' ? 'OVERDUE' : 'PENDING'),
          transferLock: d.transferLock !== false,
          nameserver1: d.nameserver1?.trim() || null,
          nameserver2: d.nameserver2?.trim() || null,
        },
      });
      console.log(`Domain seeded: ${d.fqdn} (user: ${d.userID})`);
    }
  }

  // Hostings (reference userID, packageID, domainFqdns)
  const hostings = loadJson<Array<{
    userID: string;
    packageID: string;
    username: string;
    nextBillingDate?: string;
    paymentStatus?: string;
    serviceStatus?: string;
    domainFqdns?: string[];
  }>>('hostings.json');

  for (const h of hostings) {
    const pkg = await prisma.hostingPackage.findUnique({ where: { id: h.packageID } });
    if (!pkg) {
      console.log(`Hosting skipped: paquete "${h.packageID}" no encontrado`);
      continue;
    }

    const domainIds: string[] = [];
    if (Array.isArray(h.domainFqdns) && h.domainFqdns.length > 0) {
      const domains = await prisma.domain.findMany({
        where: {
          userID: h.userID,
          fqdn: { in: h.domainFqdns.map((f) => f.toLowerCase()) },
        },
      });
      domainIds.push(...domains.map((d) => d.id));
    }

    const existing = await prisma.hostingService.findFirst({
      where: { userID: h.userID, username: h.username },
    });
    if (!existing) {
      await prisma.hostingService.create({
        data: {
          userID: h.userID,
          packageID: h.packageID,
          username: h.username,
          nextBillingDate: h.nextBillingDate ? new Date(h.nextBillingDate) : new Date(),
          paymentStatus: (['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(h.paymentStatus || '')
            ? (h.paymentStatus as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED')
            : h.paymentStatus === 'UNPAID' ? 'OVERDUE' : 'PENDING'),
          serviceStatus: (h.serviceStatus as 'ENABLED' | 'SUSPENDED' | 'CANCELLED') || 'ENABLED',
          domains: domainIds.length > 0
            ? { create: domainIds.map((domainID) => ({ domainID })) }
            : undefined,
        },
      });
      console.log(`Hosting seeded: ${h.username} (${pkg.name})`);
    }
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
