-- AlterTable: add PENDING to HostingServiceStatus enum on hostings.service_status (MySQL)
ALTER TABLE `hostings` MODIFY COLUMN `service_status` ENUM('ENABLED', 'PENDING', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'ENABLED';
