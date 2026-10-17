import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDiskUsedMb, getDiskUsageInfo } from '../../lib/disk-threshold';

describe('Unit Test: Disk Usage & Storage Threshold Monitor (disk-threshold.ts)', () => {
  it('parseDiskUsedMb should parse Megabytes, Gigabytes, and Kilobytes accurately', () => {
    assert.equal(parseDiskUsedMb('1803M'), 1803);
    assert.equal(parseDiskUsedMb('91MB'), 91);
    assert.equal(parseDiskUsedMb('2G'), 2048);
    assert.equal(parseDiskUsedMb('1024K'), 1);
    assert.equal(parseDiskUsedMb(null), null);
    assert.equal(parseDiskUsedMb(''), null);
  });

  it('dualbs at shape_gold (2000 MB quota, 1803 MB used) must trigger critical threshold (>= 90%)', () => {
    const info = getDiskUsageInfo(2000, '1803M');

    assert.equal(info.percentage, 90);
    assert.equal(info.isCritical, true);
    assert.equal(info.isWarning, false);
    assert.equal(Math.round(info.remainingMb!), 197);
  });

  it('account with 85% usage must trigger warning threshold', () => {
    const info = getDiskUsageInfo(1000, '850M');

    assert.equal(info.percentage, 85);
    assert.equal(info.isCritical, false);
    assert.equal(info.isWarning, true);
    assert.equal(info.remainingMb, 150);
  });

  it('normal accounts under 80% should not flag warnings or critical limits', () => {
    const mrchorro = getDiskUsageInfo(500, '28M');
    assert.equal(mrchorro.percentage, 6);
    assert.equal(mrchorro.isCritical, false);
    assert.equal(mrchorro.isWarning, false);

    const highsolutions = getDiskUsageInfo(2000, '801M');
    assert.equal(highsolutions.percentage, 40);
    assert.equal(highsolutions.isCritical, false);
    assert.equal(highsolutions.isWarning, false);
  });

  it('unlimited plans (shape_ssh) must handle null quota without throwing or flagging alerts', () => {
    const unlimited = getDiskUsageInfo(null, '2191M');
    assert.equal(unlimited.percentage, null);
    assert.equal(unlimited.isCritical, false);
    assert.equal(unlimited.isWarning, false);
    assert.equal(unlimited.remainingMb, null);
  });
});
