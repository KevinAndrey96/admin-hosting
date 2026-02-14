# Prisma - Base de datos

## Configuración

1. Crea `.env` con `DATABASE_URL` (ej: `mysql://user:password@localhost:3306/admin`)
2. Ejecuta las migraciones y el seed

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run db:reset` | **Migrate fresh**: borra la DB, aplica migraciones y ejecuta el seed |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:migrate:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Ejecuta solo el seed |
| `npm run db:push` | Sincroniza schema sin migraciones (prototipado) |
| `npm run db:studio` | Abre Prisma Studio |

## Migrate fresh (checkpoint limpio)

```bash
npm run db:reset
```

Esto:
1. Elimina la base de datos
2. La recrea vacía
3. Aplica todas las migraciones
4. Ejecuta el seed (usuarios por defecto, settings, registrador)

## Seed por defecto

- **Admin**: admin@hotmail.com / Admin2026@
- **Cliente**: client@hotmail.com / Client2026@
- **Settings**: company_name, logo_url, primary_color, secondary_color
- **Registrador**: Registrador por defecto
