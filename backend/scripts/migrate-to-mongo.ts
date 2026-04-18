import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// MongoDB 连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mch-prc';

// 数据文件路径
const DATA_DIR = path.join(__dirname, '../../frontend/public/data');

async function migrate() {
  console.log('开始数据迁移...');

  // 连接 MongoDB
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB 连接成功');

  // 定义 Schema
  const PeriodSchema = new mongoose.Schema({
    name: String,
    years: String,
    startYear: Number,
    endYear: Number,
    color: String,
    description: String,
    order: Number,
  });

  const GroupSchema = new mongoose.Schema({
    name: String,
    color: String,
    parentId: mongoose.Schema.Types.ObjectId,
    type: String,
    description: String,
  });

  const PersonSchema = new mongoose.Schema({
    name: String,
    birthYear: Number,
    deathYear: Number,
    gender: String,
    bioSummary: String,
    groupIds: [mongoose.Schema.Types.ObjectId],
  });

  const EventSchema = new mongoose.Schema({
    title: String,
    startDate: Date,
    endDate: Date,
    eventType: String,
    location: String,
    summary: String,
    detail: {
      motive: String,
      process: String,
      result: String,
      impact: String,
    },
    impactFactor: Number,
    periodId: mongoose.Schema.Types.ObjectId,
    personIds: [mongoose.Schema.Types.ObjectId],
    subEvents: [{
      title: String,
      date: Date,
      content: String,
    }],
    source: String,
  });

  const Period = mongoose.model('Period', PeriodSchema);
  const Group = mongoose.model('Group', GroupSchema);
  const Person = mongoose.model('Person', PersonSchema);
  const Event = mongoose.model('Event', EventSchema);

  // 清空现有数据
  await Period.deleteMany({});
  await Group.deleteMany({});
  await Person.deleteMany({});
  await Event.deleteMany({});
  console.log('清空现有数据');

  // 迁移群体数据
  const groupsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'groups.json'), 'utf8'));
  const groups = await Group.insertMany(groupsData.groups);
  console.log(`迁移群体: ${groups.length} 条`);

  // 创建群体ID映射
  const groupMap = new Map();
  groups.forEach((g, i) => groupMap.set(groupsData.groups[i].id, g._id));

  // 迁移人物数据
  const personsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'persons.json'), 'utf8'));
  const persons = await Person.insertMany(
    personsData.persons.map(p => ({
      ...p,
      groupIds: p.groupIds?.map(gid => groupMap.get(gid)) || [],
    }))
  );
  console.log(`迁移人物: ${persons.length} 条`);

  // 创建人物ID映射
  const personMap = new Map();
  persons.forEach((p, i) => personMap.set(personsData.persons[i].id, p._id));

  // 迁移时期数据（预定义）
  const periodsData = [
    { name: '鸦片战争时期', years: '1839-1860', startYear: 1839, endYear: 1860, color: '#f5222d', order: 1 },
    { name: '洋务运动时期', years: '1861-1894', startYear: 1861, endYear: 1894, color: '#1890ff', order: 2 },
    { name: '甲午战后时期', years: '1895-1900', startYear: 1895, endYear: 1900, color: '#fa8c16', order: 3 },
    { name: '清末新政时期', years: '1901-1911', startYear: 1901, endYear: 1911, color: '#52c41a', order: 4 },
    { name: '民国初期', years: '1912-1926', startYear: 1912, endYear: 1926, color: '#722ed1', order: 5 },
    { name: '国民政府时期', years: '1927-1949', startYear: 1927, endYear: 1949, color: '#eb2f96', order: 6 },
  ];
  const periods = await Period.insertMany(periodsData);
  console.log(`迁移时期: ${periods.length} 条`);

  // 创建时期ID映射（按年份范围）
  const periodMap = new Map();
  periods.forEach(p => {
    for (let year = p.startYear; year <= p.endYear; year++) {
      periodMap.set(year, p._id);
    }
  });

  // 迁移事件数据
  const eventsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'events.json'), 'utf8'));
  const events = await Event.insertMany(
    eventsData.events.map(e => {
      const year = new Date(e.startDate).getFullYear();
      return {
        ...e,
        periodId: periodMap.get(year),
        personIds: e.personIds?.map(pid => personMap.get(pid)) || [],
      };
    })
  );
  console.log(`迁移事件: ${events.length} 条`);

  // 断开连接
  await mongoose.disconnect();
  console.log('数据迁移完成!');
}

migrate().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});