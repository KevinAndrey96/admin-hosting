-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company_name` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `zip_code` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
    `status` ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_key`(`token`),
    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domains` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `registrar_name` VARCHAR(191) NOT NULL,
    `fqdn` VARCHAR(191) NOT NULL,
    `purchase_price` DECIMAL(10, 2) NULL,
    `sale_price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'COP',
    `billing_cycle` ENUM('ANNUAL') NOT NULL DEFAULT 'ANNUAL',
    `renewal_date` DATETIME(3) NOT NULL,
    `next_billing_date` DATETIME(3) NOT NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `service_status` ENUM('ACTIVE', 'AT_RISK', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `transfer_lock` BOOLEAN NOT NULL DEFAULT true,
    `auth_code_encrypted` TEXT NULL,
    `auto_renew` BOOLEAN NOT NULL DEFAULT false,
    `endpoint_url_to_check` VARCHAR(191) NULL,
    `health_status` ENUM('UP', 'DOWN', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `last_health_check_at` DATETIME(3) NULL,
    `last_health_http_code` INTEGER NULL,
    `last_health_response_ms` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `domains_user_id_idx`(`user_id`),
    INDEX `domains_next_billing_date_payment_status_idx`(`next_billing_date`, `payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domain_whois` (
    `id` VARCHAR(191) NOT NULL,
    `domain_id` VARCHAR(191) NOT NULL,
    `registrant_name` VARCHAR(191) NOT NULL,
    `registrant_org` VARCHAR(191) NULL,
    `registrant_email` VARCHAR(191) NOT NULL,
    `registrant_phone` VARCHAR(191) NULL,
    `registrant_address` TEXT NULL,
    `registrant_city` VARCHAR(191) NULL,
    `registrant_state` VARCHAR(191) NULL,
    `registrant_country` VARCHAR(191) NULL,
    `registrant_postal_code` VARCHAR(191) NULL,
    `privacy_enabled` BOOLEAN NOT NULL DEFAULT false,
    `raw_whois_json` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `domain_whois_domain_id_key`(`domain_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domain_nameservers` (
    `id` VARCHAR(191) NOT NULL,
    `domain_id` VARCHAR(191) NOT NULL,
    `hostname` VARCHAR(191) NOT NULL,
    `ipv4` VARCHAR(191) NULL,
    `ipv6` VARCHAR(191) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,

    INDEX `domain_nameservers_domain_id_idx`(`domain_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hosting_services` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `domain_id` VARCHAR(191) NULL,
    `provider_name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `plan_name` VARCHAR(191) NULL,
    `capacity_mb` INTEGER NULL,
    `used_mb` INTEGER NULL,
    `email_accounts_limit` INTEGER NULL,
    `email_accounts_used` INTEGER NULL,
    `sale_price` DECIMAL(10, 2) NOT NULL,
    `billing_cycle` ENUM('ANNUAL') NOT NULL DEFAULT 'ANNUAL',
    `next_billing_date` DATETIME(3) NOT NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `service_status` ENUM('ENABLED', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'ENABLED',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hosting_services_user_id_idx`(`user_id`),
    INDEX `hosting_services_next_billing_date_payment_status_idx`(`next_billing_date`, `payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `charges` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `resource_type` ENUM('DOMAIN', 'HOSTING') NOT NULL,
    `resource_id` VARCHAR(191) NOT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'COP',
    `due_date` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `payment_method_expected` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `charges_user_id_idx`(`user_id`),
    INDEX `charges_due_date_status_idx`(`due_date`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_receipts` (
    `id` VARCHAR(191) NOT NULL,
    `charge_id` VARCHAR(191) NOT NULL,
    `receipt_number` VARCHAR(191) NOT NULL,
    `paid_amount` DECIMAL(10, 2) NOT NULL,
    `payment_method` VARCHAR(191) NOT NULL,
    `paid_at` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `legal_disclaimer` TEXT NULL,
    `generated_pdf_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_receipts_charge_id_idx`(`charge_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domains` ADD CONSTRAINT `domains_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domain_whois` ADD CONSTRAINT `domain_whois_domain_id_fkey` FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domain_nameservers` ADD CONSTRAINT `domain_nameservers_domain_id_fkey` FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_services` ADD CONSTRAINT `hosting_services_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_services` ADD CONSTRAINT `hosting_services_domain_id_fkey` FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `charges` ADD CONSTRAINT `charges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_receipts` ADD CONSTRAINT `payment_receipts_charge_id_fkey` FOREIGN KEY (`charge_id`) REFERENCES `charges`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
