/**
 * Storage quota threshold and usage helper for hosting accounts.
 * Parses cPanel / WHM disk usage strings (e.g. "1803M", "1.8G", "500K")
 * and calculates quota percentages, warnings (>= 80%) and critical limits (>= 90%).
 */

export interface DiskUsageInfo {
  usedMb: number;
  quotaMb: number | null;
  percentage: number | null;
  isWarning: boolean;   // >= 80% and < 90%
  isCritical: boolean;  // >= 90%
  remainingMb: number | null;
}

export function parseDiskUsedMb(diskused: string | null | undefined): number | null {
  if (!diskused || typeof diskused !== 'string') return null;
  const trimmed = diskused.trim().toUpperCase();

  // Megabytes: e.g. "1803M", "1803MB", "1803 M"
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s*M(?:B)?$/);
  if (m) return parseFloat(m[1]);

  // Gigabytes: e.g. "1.8G", "2GB"
  const g = trimmed.match(/^(\d+(?:\.\d+)?)\s*G(?:B)?$/);
  if (g) return parseFloat(g[1]) * 1024;

  // Kilobytes: e.g. "500K", "512KB"
  const k = trimmed.match(/^(\d+(?:\.\d+)?)\s*K(?:B)?$/);
  if (k) return parseFloat(k[1]) / 1024;

  const num = parseFloat(trimmed);
  return !isNaN(num) ? num : null;
}

export function getDiskUsageInfo(
  diskSpaceQuotaMb: number | null | undefined,
  diskUsed: string | null | undefined
): DiskUsageInfo {
  const usedMb = parseDiskUsedMb(diskUsed);

  // If no disk info or unlimited plan
  if (usedMb == null) {
    return {
      usedMb: 0,
      quotaMb: diskSpaceQuotaMb ?? null,
      percentage: null,
      isWarning: false,
      isCritical: false,
      remainingMb: null,
    };
  }

  const quotaMb = diskSpaceQuotaMb && diskSpaceQuotaMb > 0 ? diskSpaceQuotaMb : null;
  if (!quotaMb) {
    return {
      usedMb,
      quotaMb: null,
      percentage: null,
      isWarning: false,
      isCritical: false,
      remainingMb: null,
    };
  }

  const percentage = Math.min(100, Math.round((usedMb / quotaMb) * 100));
  const remainingMb = Math.max(0, quotaMb - usedMb);
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 80 && !isCritical;

  return {
    usedMb,
    quotaMb,
    percentage,
    isWarning,
    isCritical,
    remainingMb,
  };
}
