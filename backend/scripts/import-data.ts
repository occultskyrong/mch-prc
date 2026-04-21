/**
 * 将 public/data/ 下的所有 JSON 数据持久化到 MongoDB
 * 导入顺序：Groups → Persons → Events（依赖递增）
 *
 * 使用方法:
 * cd backend && MONGODB_URI='你的连接串' npx ts-node scripts/import-data.ts
 *
 * 或者不传 MONGODB_URI，脚本会尝试从 environment.local.ts 读取
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../frontend/public/data');

// 尝试获取 MongoDB URI
function getMongoUri(): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI_PROD) return process.env.MONGODB_URI_PROD;

  console.error('请设置环境变量 MONGODB_URI，例如:');
  console.error('  MONGODB_URI="mongodb://user:pass@host:port/mch-prc" npx ts-node scripts/import-all-data.ts');
  process.exit(1);
}

async function main() {
  console.log('连接 MongoDB...');
  await mongoose.connect(getMongoUri());
  console.log('MongoDB 连接成功\n');

  try {
    // 1. Groups（无依赖）
    console.log('===== 1/3 导入 Groups =====');
    const groupIdMap = await importGroups();
    console.log('');

    // 2. Persons（依赖 Groups）
    console.log('===== 2/3 导入 Persons =====');
    const personIdMap = await importPersons(groupIdMap);
    console.log('');

    // 3. Events（依赖 Persons + 需要创建 Periods）
    console.log('===== 3/3 导入 Events =====');
    await importEvents(personIdMap);
    console.log('');

    // 统计（直接使用底层 driver 避免模型名冲突）
    console.log('===== 数据库统计 =====');
    const db = mongoose.connection.db;
    console.log(`Events:  ${await db.collection('events').countDocuments()}`);
    console.log(`Persons: ${await db.collection('persons').countDocuments()}`);
    console.log(`Groups:  ${await db.collection('groups').countDocuments()}`);

    const eventsWithPersons = await db.collection('events').countDocuments({ personIds: { $exists: true, $not: { $size: 0 } } });
    console.log(`有事件关联人物的: ${eventsWithPersons}`);
  } finally {
    await mongoose.disconnect();
    console.log('\n完成!');
  }
}

// ==================== 工具函数 ====================

function getModel(collectionName: string) {
  return mongoose.model(collectionName, new mongoose.Schema({}, { strict: false }), collectionName);
}

function readJson(filename: string): any[] {
  const filePath = path.join(DATA_DIR, filename);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // 支持 { events: [...] } 或直接 [...]
  const key = filename.replace('.json', '');
  return Array.isArray(raw) ? raw : (raw[key] || raw.events || raw.persons || raw.groups || []);
}

// ==================== Groups 导入 ====================

async function importGroups(): Promise<Record<number, string>> {
  const groups = readJson('groups.json');
  console.log(`JSON 数据共 ${groups.length} 条群体`);

  const Group = getModel('groups');
  const idMap: Record<number, string> = {};
  let inserted = 0;
  let skipped = 0;

  for (const g of groups) {
    const existing = await Group.findOne({ name: g.name });
    if (existing) {
      skipped++;
      idMap[g.id] = existing._id.toString();
    } else {
      const doc: any = {
        name: g.name,
        description: g.description || '',
        color: g.color || '',
        order: g.order || 0,
      };
      // parentId 需要先导入父群体
      if (g.parentId !== undefined && g.parentId !== null) {
        const parentDoc = await Group.findById(idMap[g.parentId]);
        if (parentDoc) {
          doc.parentId = parentDoc._id;
        }
      }
      const result = await Group.create(doc);
      inserted++;
      idMap[g.id] = result._id.toString();
    }
  }

  console.log(`Groups: 新增 ${inserted}, 跳过 ${skipped}`);
  return idMap;
}

// ==================== Persons 导入 ====================

async function importPersons(groupIdMap: Record<number, string>): Promise<Record<number, string>> {
  const persons = readJson('persons.json');
  console.log(`JSON 数据共 ${persons.length} 条人物`);

  const Person = getModel('persons');
  const idMap: Record<number, string> = {};
  let inserted = 0;
  let skipped = 0;

  for (const p of persons) {
    const existing = await Person.findOne({ name: p.name });
    if (existing) {
      skipped++;
      idMap[p.id] = existing._id.toString();
    } else {
      const doc: any = {
        name: p.name,
        description: p.description || '',
        birthYear: p.birthYear || null,
        deathYear: p.deathYear || null,
        birthPlace: p.birthPlace || '',
        avatar: p.avatar || '',
        summary: p.summary || '',
      };
      // 关联群体
      if (p.groupIds && p.groupIds.length > 0) {
        doc.groupIds = p.groupIds
          .map((gid: number) => groupIdMap[gid])
          .filter(Boolean);
      }
      const result = await Person.create(doc);
      inserted++;
      idMap[p.id] = result._id.toString();
    }

    if ((inserted + skipped) % 50 === 0 || inserted + skipped === 1) {
      console.log(`  已处理 ${inserted + skipped}/${persons.length} | 新增 ${inserted} | 跳过 ${skipped}`);
    }
  }

  console.log(`Persons: 新增 ${inserted}, 跳过 ${skipped}`);
  return idMap;
}

// ==================== Events 导入 ====================

// eventType 数字映射: 1=战争, 2=条约, 3=起义, 4=改革, 5=事件
const EVENT_TYPE_MAP: Record<string, number> = {
  '战争': 1,
  '条约': 2,
  '起义': 3,
  '改革': 4,
  '事件': 5,
};

async function importEvents(personIdMap: Record<number, string>) {
  const events = readJson('events.json');
  console.log(`JSON 数据共 ${events.length} 条事件`);

  // 创建时期数据
  const Period = getModel('periods');
  const periods = [
    { name: '鸦片战争时期', startYear: 1839, endYear: 1860, color: '#f5222d', order: 1 },
    { name: '洋务运动时期', startYear: 1861, endYear: 1894, color: '#1890ff', order: 2 },
    { name: '甲午战后时期', startYear: 1895, endYear: 1900, color: '#fa8c16', order: 3 },
    { name: '清末新政时期', startYear: 1901, endYear: 1911, color: '#52c41a', order: 4 },
    { name: '民国初期', startYear: 1912, endYear: 1926, color: '#722ed1', order: 5 },
    { name: '国民政府时期', startYear: 1927, endYear: 1949, color: '#eb2f96', order: 6 },
  ];

  const periodMap: Record<number, string> = {};
  for (const p of periods) {
    let doc = await Period.findOne({ name: p.name });
    if (!doc) {
      doc = await Period.create(p);
      console.log(`  创建时期: ${p.name}`);
    }
    for (let y = p.startYear; y <= p.endYear; y++) {
      periodMap[y] = doc._id.toString();
    }
  }
  console.log(`时期数据: ${Object.keys(periodMap).length} 个年份`);

  const Event = getModel('events');
  let inserted = 0;
  let skipped = 0;

  // 第一遍：创建所有事件（不处理关联）
  for (const e of events) {
    const existing = await Event.findOne({ title: e.title });
    if (existing) {
      skipped++;
      continue;
    }

    const year = new Date(e.startDate).getFullYear();
    const doc: any = {
      title: e.title,
      startDate: new Date(e.startDate),
      endDate: e.endDate ? new Date(e.endDate) : null,
      isInstant: e.isInstant ?? true,
      eventType: EVENT_TYPE_MAP[e.eventType] ?? 5,
      eventLevel: e.eventLevel ?? 0,
      location: e.location || '',
      summary: e.summary || '',
      periodId: periodMap[year] || null,
      sourceIds: e.sourceIds || [],
    };

    // detail — 兼容新旧格式
    if (e.detail) {
      doc.detail = {};
      for (const key of ['motive', 'process', 'result', 'impact'] as const) {
        const field = e.detail[key];
        if (!field) continue;
        if (typeof field === 'object' && field.content) {
          doc.detail[key] = { content: field.content, sourceIds: field.sourceIds || [] };
        } else {
          doc.detail[key] = field;
        }
      }
    }

    // impactFactor
    if (e.impactFactor) {
      doc.impactFactor = {
        dimensions: e.impactFactor.dimensions || {},
        weightedSum: e.impactFactor.weightedSum || 0,
        scopeBonus: e.impactFactor.scopeBonus || 0,
        scopeLabel: e.impactFactor.scopeLabel || '',
        durationBonus: e.impactFactor.durationBonus || 0,
        durationLabel: e.impactFactor.durationLabel || '',
        finalScore: e.impactFactor.finalScore || 0,
      };
    }

    await Event.create(doc);
    inserted++;

    if ((inserted + skipped) % 100 === 0 || inserted + skipped === 1) {
      console.log(`  已处理 ${inserted + skipped}/${events.length} | 新增 ${inserted} | 跳过 ${skipped}`);
    }
  }

  console.log(`Events: 新增 ${inserted}, 跳过 ${skipped}`);

  // 第二遍：更新人物关联
  console.log('  更新人物关联...');
  let updatedPersonRefs = 0;
  for (const e of events) {
    if (!e.personIds || e.personIds.length === 0) continue;

    const mongoPersonIds = e.personIds
      .map((pid: number) => personIdMap[pid])
      .filter(Boolean);

    if (mongoPersonIds.length === 0) continue;

    const event = await Event.findOne({ title: e.title });
    if (event) {
      await Event.updateOne(
        { _id: event._id },
        { $set: { personIds: mongoPersonIds } }
      );
      updatedPersonRefs++;
    }
  }
  console.log(`  更新了 ${updatedPersonRefs} 条事件的人物关联`);
}

main().catch(err => {
  console.error('失败:', err);
  process.exit(1);
});
