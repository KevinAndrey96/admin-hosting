-- Remove migration records that were never applied or are obsolete
DELETE FROM _prisma_migrations WHERE migration_name IN (
  '20250214100000_add_transfer_request',
  '20250214100000_add_domain_transfer_status',
  '20250214200000_replace_transfer_status_with_domain_status',
  '20250214300000_add_domain_status'
);
