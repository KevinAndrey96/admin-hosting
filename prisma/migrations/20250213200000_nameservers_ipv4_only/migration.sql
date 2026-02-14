-- DomainNameserver: solo IPv4, máx 2 por dominio. Eliminar hostname e ipv6.
UPDATE `domain_nameservers` SET `ipv4` = '0.0.0.0' WHERE `ipv4` IS NULL OR `ipv4` = '';
ALTER TABLE `domain_nameservers` MODIFY COLUMN `ipv4` VARCHAR(191) NOT NULL;
ALTER TABLE `domain_nameservers` DROP COLUMN `hostname`;
ALTER TABLE `domain_nameservers` DROP COLUMN `ipv6`;
