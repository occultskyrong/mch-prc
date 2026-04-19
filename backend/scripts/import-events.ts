/**
 * 将 JSON 原始事件数据写入 MongoDB
 * 按 title 去重，已存在的记录只更新不存在的字段
 *
 * 使用方法:
 * cd backend && npx ts-node scripts/import-events.ts
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('请设置环境变量 MONGODB_URI');
  process.exit(1);
}
const DATA_FILE = path.join(__dirname, '../../frontend/public/data/events.json');

async function main() {
  console.log('连接 MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB 连接成功');

  // 读取 JSON 数据
  const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const jsonEvents = rawData.events || rawData;
  console.log(`JSON 数据共 ${jsonEvents.length} 条事件`);

  const EventSchema = new mongoose.Schema({}, { strict: false });
  const Event = mongoose.model('Event', EventSchema);

  // 时期映射
  const periods = [
    { name: '鸦片战争时期', startYear: 1839, endYear: 1860, color: '#f5222d', order: 1 },
    { name: '洋务运动时期', startYear: 1861, endYear: 1894, color: '#1890ff', order: 2 },
    { name: '甲午战后时期', startYear: 1895, endYear: 1900, color: '#fa8c16', order: 3 },
    { name: '清末新政时期', startYear: 1901, endYear: 1911, color: '#52c41a', order: 4 },
    { name: '民国初期', startYear: 1912, endYear: 1926, color: '#722ed1', order: 5 },
    { name: '国民政府时期', startYear: 1927, endYear: 1949, color: '#eb2f96', order: 6 },
  ];

  // 先确保时期数据存在
  const PeriodSchema = new mongoose.Schema({}, { strict: false });
  const Period = mongoose.model('Period', PeriodSchema);

  const periodMap = {};
  for (const p of periods) {
    let doc = await Period.findOne({ name: p.name });
    if (!doc) {
      doc = await Period.create(p);
    }
    for (let y = p.startYear; y <= p.endYear; y++) {
      periodMap[y] = doc._id.toString();
    }
  }
  console.log(`时期数据: ${Object.keys(periodMap).length} 个年份`);

  // 写入事件
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const e of jsonEvents) {
    const year = new Date(e.startDate).getFullYear();
    const doc = {
      title: e.title,
      startDate: new Date(e.startDate),
      endDate: e.endDate ? new Date(e.endDate) : null,
      isInstant: e.isInstant ?? true,
      eventType: e.eventType || '事件',
      location: e.location || '',
      summary: e.summary || '',
      detail: e.detail || { motive: '', process: '', result: '', impact: '' },
      impactFactor: e.impactFactor || { score: 0, description: '' },
      periodId: periodMap[year] || null,
      personIds: e.personIds || [],
      subEvents: e.subEvents || [],
      relatedEvents: e.relatedEvents || [],
      source: e.source || '',
    };

    const existing = await Event.findOne({ title: e.title }) as any;
    if (existing) {
      // 更新已存在的事件（只更新 detail 为空的字段）
      const updates: Record<string, any> = {};
      if (!existing.startDate) updates.startDate = doc.startDate;
      if (!existing.endDate && doc.endDate) updates.endDate = doc.endDate;
      if (!existing.eventType) updates.eventType = doc.eventType;
      if (!existing.location) updates.location = doc.location;
      if (!existing.summary || existing.summary.length < 5) updates.summary = doc.summary;
      if (!existing.periodId) updates.periodId = doc.periodId;

      if (Object.keys(updates).length > 0) {
        await Event.updateOne({ _id: existing._id }, { $set: updates });
        updated++;
      } else {
        skipped++;
      }
    } else {
      await Event.create(doc);
      inserted++;
    }

    if ((inserted + updated) % 50 === 0 || inserted + updated === 1) {
      console.log(`  已处理 ${inserted + updated}/${jsonEvents.length} | 新增 ${inserted} | 更新 ${updated} | 跳过 ${skipped}`);
    }
  }

  console.log(`\n完成:`);
  console.log(`  新增: ${inserted}`);
  console.log(`  更新: ${updated}`);
  console.log(`  跳过: ${skipped}`);

  // 验证
  const count = await Event.countDocuments();
  console.log(`\n数据库中共 ${count} 条事件`);

  await mongoose.disconnect();
  console.log('完成!');
}

main().catch(err => {
  console.error('失败:', err);
  process.exit(1);
});
