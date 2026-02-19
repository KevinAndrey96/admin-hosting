-- Add optional custom price for hosting; NULL = inherit from package
ALTER TABLE `hostings` ADD COLUMN `sale_price_override` DECIMAL(10, 2) NULL;
