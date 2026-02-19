/**
 * Effective price for a hosting service: custom override or package price.
 * Used for display, renewal, and payment flows.
 */

export type HostingWithPrice = {
  salePriceOverride?: unknown;
  hostingPackage?: { salePrice: unknown; currency: string } | null;
};

/** Prisma Decimal and similar come as objects; normalize to number. */
export function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "object" && value !== null && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = parseFloat(String(value));
  return !isNaN(n) ? n : null;
}

/**
 * Returns effective sale price and currency for a hosting.
 * When salePriceOverride is set (valid number >= 0), use it; otherwise use package price.
 */
export function getHostingEffectivePrice(
  hosting: HostingWithPrice
): { salePrice: number; currency: string } {
  const override = toNumber(hosting.salePriceOverride);
  const packagePrice = toNumber(hosting.hostingPackage?.salePrice) ?? 0;
  const currency = hosting.hostingPackage?.currency ?? "COP";
  const salePrice =
    override != null && override >= 0 ? override : packagePrice;
  return { salePrice, currency };
}
