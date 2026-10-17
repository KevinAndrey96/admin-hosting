import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npm run db:seed',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'mysql://shape_hosting:Hosting2026@127.0.0.1:3306/shape_hosting',
  },
});
