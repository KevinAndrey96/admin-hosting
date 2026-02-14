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
CREATE TABLE `hosting_packages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sale_price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'COP',
    `disk_space_quota_mb` INTEGER NULL,
    `bandwidth_limit_mb` INTEGER NULL,
    `max_email_accounts` INTEGER NULL,
    `max_parked_domains` INTEGER NULL,
    `max_addon_domains` INTEGER NULL,
    `included_domains` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domains` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `registrar_name` VARCHAR(191) NOT NULL,
    `fqdn` VARCHAR(191) NOT NULL,
    `sale_price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'COP',
    `billing_cycle` ENUM('ANNUAL') NOT NULL DEFAULT 'ANNUAL',
    `renewal_date` DATETIME(3) NOT NULL,
    `next_billing_date` DATETIME(3) NOT NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `transfer_lock` BOOLEAN NOT NULL DEFAULT true,
    `health_status` ENUM('UP', 'DOWN', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `nameserver_1` VARCHAR(191) NULL,
    `nameserver_2` VARCHAR(191) NULL,
    `registrant_name` VARCHAR(191) NULL,
    `registrant_org` VARCHAR(191) NULL,
    `registrant_email` VARCHAR(191) NULL,
    `registrant_phone` VARCHAR(191) NULL,
    `registrant_address` TEXT NULL,
    `registrant_city` VARCHAR(191) NULL,
    `registrant_state` VARCHAR(191) NULL,
    `registrant_country` VARCHAR(191) NULL,
    `registrant_postal_code` VARCHAR(191) NULL,
    `privacy_enabled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `domains_user_id_idx`(`user_id`),
    INDEX `domains_next_billing_date_payment_status_idx`(`next_billing_date`, `payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hosting_services` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `package_id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `billing_cycle` ENUM('ANNUAL') NOT NULL DEFAULT 'ANNUAL',
    `next_billing_date` DATETIME(3) NOT NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `service_status` ENUM('ENABLED', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'ENABLED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `hosting_services_user_id_idx`(`user_id`),
    INDEX `hosting_services_package_id_idx`(`package_id`),
    INDEX `hosting_services_next_billing_date_payment_status_idx`(`next_billing_date`, `payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hosting_domains` (
    `id` VARCHAR(191) NOT NULL,
    `hosting_id` VARCHAR(191) NOT NULL,
    `domain_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `hosting_domains_hosting_id_domain_id_key`(`hosting_id`, `domain_id`),
    INDEX `hosting_domains_hosting_id_idx`(`hosting_id`),
    INDEX `hosting_domains_domain_id_idx`(`domain_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `domains` ADD CONSTRAINT `domains_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_services` ADD CONSTRAINT `hosting_services_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_services` ADD CONSTRAINT `hosting_services_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `hosting_packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_domains` ADD CONSTRAINT `hosting_domains_hosting_id_fkey` FOREIGN KEY (`hosting_id`) REFERENCES `hosting_services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hosting_domains` ADD CONSTRAINT `hosting_domains_domain_id_fkey` FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
