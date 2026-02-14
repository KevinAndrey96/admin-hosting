import { ensureDefaultSettings } from '../lib/settings';
import { prisma } from '../lib/prisma';

async function main() {
  await ensureDefaultSettings();
  console.log('Settings seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
