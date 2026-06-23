import { getChinaPeriodStartLimit } from '../src/common/utils/date.util';

function formatLocalAndUtc(d: Date): string {
  return `Local: ${d.toString()} | UTC: ${d.toISOString()}`;
}

function runTest() {
  console.log('=== 开始测试滚动周期（7天 / 30天）起始计算 ===\n');

  // 基准时间：2026-06-12 12:00:00 UTC (北京时间 2026-06-12 20:00:00)
  const baseDate = new Date('2026-06-12T12:00:00Z');
  console.log('基准时间 (北京时间 2026-06-12 20:00:00):', formatLocalAndUtc(baseDate));
  
  const weeklyLimit = getChinaPeriodStartLimit('weekly', baseDate);
  const monthlyLimit = getChinaPeriodStartLimit('monthly', baseDate);

  console.log('  近 7 天起始范围 (应为 2026-06-05 12:00:00 UTC):', formatLocalAndUtc(weeklyLimit));
  console.log('  近 30 天起始范围 (应为 2026-05-13 12:00:00 UTC):', formatLocalAndUtc(monthlyLimit));
  console.log();

  // 验证时间差
  const weeklyDiffHours = (baseDate.getTime() - weeklyLimit.getTime()) / (3600000);
  const monthlyDiffDays = (baseDate.getTime() - monthlyLimit.getTime()) / (3600000 * 24);
  
  console.log(`每周时长计算验证：${weeklyDiffHours} 小时 (应当等于 168 小时 / 7天)`);
  console.log(`每月时长计算验证：${monthlyDiffDays} 天 (应当等于 30 天)`);
  
  if (weeklyDiffHours === 168 && monthlyDiffDays === 30) {
    console.log('\n[PASS] 滚动时间范围边界校验成功！');
  } else {
    console.log('\n[FAIL] 滚动时间范围边界校验失败！');
  }

  console.log('\n=== 测试结束 ===');
}

runTest();
