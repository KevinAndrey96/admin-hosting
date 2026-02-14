/**
 * Prisma Seed - Initial data
 * Run: npm run db:seed (or automatic with db:reset)
 */
import bcrypt from 'bcryptjs';
import { ensureDefaultSettings } from '../lib/settings';
import { prisma } from '../lib/prisma';

const SALT_ROUNDS = 10;

const defaultUsers = [
  {
    fullName: 'Default Admin',
    email: 'admin@hotmail.com',
    phone: '3100000001',
    password: 'Admin2026@',
    role: 'ADMIN' as const,
    status: 'ENABLED' as const,
  },
  {
    fullName: 'Default Client',
    email: 'client@hotmail.com',
    phone: '3100000000',
    password: 'Client2026@',
    role: 'CLIENT' as const,
    status: 'ENABLED' as const,
  },
];

async function main() {
  await ensureDefaultSettings();
  console.log('Settings seed completed (company_name, logo_url, primary_color, secondary_color).');

  for (const u of defaultUsers) {
    const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        password: hashedPassword,
        role: u.role,
        status: u.status,
      },
      update: {
        fullName: u.fullName,
        phone: u.phone,
        password: hashedPassword,
        role: u.role,
        status: u.status,
      },
    });
    console.log(`User seeded: ${u.email} (${u.role})`);

    if (u.role === 'CLIENT') {
      await prisma.clientProfile.upsert({
        where: { userID: user.id },
        create: { userID: user.id },
        update: {},
      });
      console.log(`ClientProfile seeded for ${u.email}`);
    }
  }

  const existingRegistrar = await prisma.registrar.findFirst({
    where: { name: 'Registrador por defecto' },
  });
  if (!existingRegistrar) {
    await prisma.registrar.create({
      data: {
        name: 'Registrador por defecto',
        notes: 'Registrador de ejemplo',
      },
    });
    console.log('Default registrar seeded.');
  }

  console.log('Default users seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
