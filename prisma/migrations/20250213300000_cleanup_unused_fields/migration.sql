-- Checkpoint: limpieza de campos y tablas innecesarios

-- Domain: eliminar purchase_price, auth_code_encrypted, auto_renew, health metadata
ALTER TABLE `domains` DROP COLUMN `purchase_price`;
ALTER TABLE `domains` DROP COLUMN `auth_code_encrypted`;
ALTER TABLE `domains` DROP COLUMN `auto_renew`;
ALTER TABLE `domains` DROP COLUMN `last_health_check_at`;
ALTER TABLE `domains` DROP COLUMN `last_health_http_code`;
ALTER TABLE `domains` DROP COLUMN `last_health_response_ms`;

-- DomainWhois: eliminar raw_whois_json
ALTER TABLE `domain_whois` DROP COLUMN `raw_whois_json`;

-- Eliminar tablas Charge y PaymentReceipt (no usadas)
DROP TABLE IF EXISTS `payment_receipts`;
DROP TABLE IF EXISTS `charges`;
