import { prisma } from "./prisma";

export async function getDomainPriceByTld(tld: string): Promise<number | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: `domain_price_${tld}` },
    });
    
    return setting ? parseFloat(setting.value) : null;
  } catch (error) {
    console.error(`Error getting domain price for TLD ${tld}:`, error);
    return null;
  }
}

export async function getAllDomainPrices(): Promise<Record<string, number>> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: "domain_price_",
        },
      },
    });

    const prices: Record<string, number> = {};
    
    for (const setting of settings) {
      const tld = setting.key.replace("domain_price_", "");
      prices[tld] = parseFloat(setting.value);
    }

    return prices;
  } catch (error) {
    console.error("Error getting domain prices:", error);
    return {};
  }
}
