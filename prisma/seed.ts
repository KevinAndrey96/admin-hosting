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
    serviceStatus?: string;
    transferLock?: boolean;
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
          paymentStatus: (d.paymentStatus as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED') || 'PENDING',
          serviceStatus: (d.serviceStatus as 'ACTIVE' | 'AT_RISK' | 'EXPIRED') || 'ACTIVE',
          transferLock: d.transferLock !== false,
        },
      });
      console.log(`Domain seeded: ${d.fqdn} (user: ${d.userID})`);
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
