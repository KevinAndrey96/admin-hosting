import { prisma } from './prisma';

const DEFAULTS: Record<string, string> = {
  company_name: 'Adminator',
  logo_url: '/assets/static/images/logo.svg',
  primary_color: '#6366f1',
  secondary_color: '#64748b',
  whatsapp_number: '',
  daviplata_number: '',
  nequi_number: '',
  breb_key: '',
  bancolombia_account: '',
  mercadopago_payment_link: '',
  renewal_reminder_enabled: 'true',
  domain_reactivation_penalty: '',
  domain_com_price: '',
  domain_net_price: '',
  domain_com_co_price: '',
  domain_co_price: '',
};

export type SettingsMap = Record<string, string>;

export async function getSettings(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const map: SettingsMap = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? '';
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function setSettings(data: SettingsMap): Promise<void> {
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      await setSetting(key, value);
    }
  }
}

export async function ensureDefaultSettings(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.setting.create({ data: { key, value } });
    }
  }
}
