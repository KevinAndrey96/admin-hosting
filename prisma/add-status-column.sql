-- Add status column if missing (run manually if needed)
ALTER TABLE `domains` ADD COLUMN `status` ENUM('PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX `domains_status_idx` ON `domains`(`status`);
