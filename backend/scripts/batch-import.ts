/**
 * 批量分块导入事件数据到 MongoDB
 * 包含：HPIF 算法分析算分 + 百度百科详情补充
 *
 * 特性:
 * - 分块处理（每块 100 条事件），避免连接超时
 * - 断点续传（进度保存在 /tmp/import-progress.json）
 * - 块间重连 MongoDB
 *
 * 使用方法:
 * MONGODB_URI=<连接串> npx ts-node backend/scripts/batch-import.ts
 * MONGODB_URI=<连接串> npx ts-node backend/scripts/batch-import.ts --resume
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  console.error('请设置环境变量 MONGODB_URI');
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, '../../frontend/public/data/events.json');
const CONCURRENCY = 3;
const CHUNK_SIZE = 100;
const PROGRESS_FILE = '/tmp/import-progress.json';

const args = process.argv.slice(2);
const RESUME = args.includes('--resume');

// ==================== HPIF 算法 ====================

const DIMENSION_WEIGHTS: Record<string, number> = {
  politicalChange: 0.20, economicImpact: 0.15, militaryScale: 0.12,
  socialStructure: 0.12, ideologicalCultural: 0.10, internationalRelations: 0.10,
  territorialSovereignty: 0.08, institutionalLegacy: 0.08, historicalTurningPoint: 0.05,
};

const EVENT_TYPE_BASELINES: Record<string, Record<string, number>> = {
  '战争': { politicalChange: 7.5, economicImpact: 6.5, militaryScale: 9.5, socialStructure: 6.5, ideologicalCultural: 5.5, internationalRelations: 7.0, territorialSovereignty: 7.0, institutionalLegacy: 6.0, historicalTurningPoint: 7.5 },
  '条约': { politicalChange: 5.5, economicImpact: 6.5, militaryScale: 3.0, socialStructure: 5.0, ideologicalCultural: 5.0, internationalRelations: 7.5, territorialSovereignty: 8.0, institutionalLegacy: 6.5, historicalTurningPoint: 6.5 },
  '起义': { politicalChange: 7.0, economicImpact: 4.5, militaryScale: 7.5, socialStructure: 5.5, ideologicalCultural: 6.0, internationalRelations: 4.0, territorialSovereignty: 3.5, institutionalLegacy: 5.5, historicalTurningPoint: 7.0 },
  '改革': { politicalChange: 6.5, economicImpact: 7.0, militaryScale: 3.0, socialStructure: 6.5, ideologicalCultural: 6.5, internationalRelations: 4.5, territorialSovereignty: 2.5, institutionalLegacy: 7.5, historicalTurningPoint: 6.0 },
  '事件': { politicalChange: 3.0, economicImpact: 2.0, militaryScale: 2.0, socialStructure: 2.5, ideologicalCultural: 2.5, internationalRelations: 2.0, territorialSovereignty: 2.0, institutionalLegacy: 2.5, historicalTurningPoint: 2.5 },
};

const SCORING_CRITERIA: Record<string, Record<number, string>> = {
  politicalChange: { 10: '彻底政权更迭，建立全新政治体制', 9: '政权被推翻或建立，政体根本变革', 8: '重大政治改革，制度层面深刻变化', 7: '重要政治运动或变革，影响深远', 6: '政策重大调整，中层制度改革', 5: '政策明显变化，影响较大范围', 4: '一般性政治变动，影响有限', 3: '局部人事或政策调整', 2: '微小政治事件，影响面窄', 1: '无显著政治影响' },
  economicImpact: { 10: '经济结构根本转型', 9: '经济体制重大变革', 8: '经济格局深刻变化', 7: '重大经济变动', 6: '经济显著变化', 5: '经济中等变化', 4: '经济局部变化', 3: '经济轻微变化', 2: '经济影响甚微', 1: '无经济影响' },
  militaryScale: { 10: '全国性大规模战争，决定国家命运', 9: '重大战争或战役，决定战争走向', 8: '重要战役，战略意义深远', 7: '较大规模军事冲突或起义', 6: '中等规模军事行动', 5: '局部武装冲突或军事改革', 4: '小规模军事摩擦', 3: '零星武装事件', 2: '军事影响极小', 1: '无军事层面' },
  socialStructure: { 10: '社会阶级/阶层根本重构', 9: '社会结构深刻变化', 8: '社会制度重大变化', 7: '社会风气/结构显著变化', 6: '社会层面中等变化', 5: '社会局部变化', 4: '社会影响有限', 3: '社会轻微影响', 2: '社会影响甚微', 1: '无社会影响' },
  ideologicalCultural: { 10: '思想范式根本转换', 9: '新思想体系确立，深远影响', 8: '重大思想运动，影响一代人', 7: '重要思想传播或论战', 6: '文化/教育重大变化', 5: '思想文化中等变化', 4: '局部文化思想变化', 3: '轻微文化影响', 2: '文化影响甚微', 1: '无思想文化影响' },
  internationalRelations: { 10: '世界格局根本改变', 9: '国际秩序重大变化', 8: '重大外交转折', 7: '国际关系显著变化', 6: '外交政策重大调整', 5: '国际关系中等变化', 4: '局部外交事件', 3: '外交轻微事件', 2: '外交影响甚微', 1: '无国际关系影响' },
  territorialSovereignty: { 10: '大片领土割让或收复，主权根本变化', 9: '重要领土变更', 8: '主权重大受损或恢复', 7: '领土/主权重要变化', 6: '边界/主权中等变化', 5: '局部领土/主权问题', 4: '领土主权轻微变化', 3: '领土主权影响有限', 2: '领土主权影响甚微', 1: '无领土主权影响' },
  institutionalLegacy: { 10: '制度延续至今，成为国家基石', 9: '制度影响超50年', 8: '制度影响30-50年', 7: '制度影响20-30年', 6: '制度影响10-20年', 5: '制度影响5-10年', 4: '制度影响3-5年', 3: '制度影响1-3年', 2: '制度影响不足1年', 1: '无制度遗产' },
  historicalTurningPoint: { 10: '时代根本分水岭，历史进程完全改变', 9: '重大历史转折点', 8: '重要历史转折，影响历史走向', 7: '历史重要节点', 6: '历史阶段内重要事件', 5: '历史阶段内一般事件', 4: '历史阶段内小事件', 3: '历史进程中微不足道的节点', 2: '几乎不影响历史走向', 1: '无转折意义' },
};

function calcImpact(event: any) {
  const baselines = EVENT_TYPE_BASELINES[event.eventType] ?? EVENT_TYPE_BASELINES['事件'];
  const dimKeys = Object.keys(DIMENSION_WEIGHTS);
  const dimensions: Record<string, { score: number; rationale: string }> = {};

  for (const key of dimKeys) {
    let score = baselines[key];
    const subCount = event.subEvents?.length || 0;
    if (subCount > 0) score += Math.min(subCount * 0.08, 0.5);
    const personCount = event.personIds?.length || 0;
    if (personCount > 0 && ['politicalChange', 'socialStructure', 'ideologicalCultural', 'historicalTurningPoint'].includes(key)) {
      score += Math.min(personCount * 0.04, 0.3);
    }
    if (event.detail) {
      const dc = [event.detail.motive, event.detail.process, event.detail.result, event.detail.impact].filter(Boolean).length;
      if (dc >= 3) score += 0.15; else if (dc >= 2) score += 0.08;
    }
    score = Math.max(1, Math.min(10, score));
    const rounded = Math.round(score);
    dimensions[key] = { score: Math.round(score * 10) / 10, rationale: SCORING_CRITERIA[key]?.[rounded] || '' };
  }

  const weightedSum = Object.entries(dimensions).reduce((sum, [k, v]) => sum + v.score * DIMENSION_WEIGHTS[k], 0);
  const baseScore = weightedSum * 80 + 100;

  const loc = event.location || '';
  let scopeBonus = 0, scopeLabel = '';
  if (loc.includes('、')) { scopeBonus = 40; scopeLabel = '全国性'; }
  else if (/全国|各省|南北|多省|长江|沿海|沿江/.test(loc) && loc !== '全国各地') { scopeBonus = 20; scopeLabel = '多省区域'; }
  else { scopeBonus = 0; scopeLabel = '局部地区'; }

  let durationBonus = 0, durationLabel = '';
  const instScore = dimensions.institutionalLegacy.score;
  if (instScore >= 8) { durationBonus = 30; durationLabel = '影响>50年'; }
  else if (instScore >= 6) { durationBonus = 10; durationLabel = '影响20-50年'; }
  else { durationBonus = 0; durationLabel = '影响<20年'; }

  const finalScore = Math.min(1000, Math.round(baseScore + scopeBonus + durationBonus));

  return { dimensions, weightedSum: Math.round(baseScore * 100) / 100, scopeBonus, scopeLabel, durationBonus, durationLabel, finalScore };
}

// ==================== 百度百科 ====================

const PERIOD_KEYWORDS: Array<{ start: number; end: number; keyword: string }> = [
  { start: 1839, end: 1842, keyword: '鸦片战争' }, { start: 1843, end: 1850, keyword: '南京条约' },
  { start: 1851, end: 1864, keyword: '太平天国' }, { start: 1856, end: 1860, keyword: '第二次鸦片战争' },
  { start: 1861, end: 1894, keyword: '洋务运动' }, { start: 1883, end: 1885, keyword: '中法战争' },
  { start: 1894, end: 1895, keyword: '甲午战争' }, { start: 1898, end: 1898, keyword: '戊戌变法' },
  { start: 1899, end: 1900, keyword: '义和团运动' }, { start: 1900, end: 1901, keyword: '八国联军' },
  { start: 1901, end: 1911, keyword: '清末新政' }, { start: 1911, end: 1912, keyword: '辛亥革命' },
  { start: 1912, end: 1916, keyword: '中华民国' }, { start: 1915, end: 1916, keyword: '护国运动' },
  { start: 1917, end: 1918, keyword: '护法运动' }, { start: 1919, end: 1919, keyword: '五四运动' },
  { start: 1921, end: 1921, keyword: '中国共产党' }, { start: 1924, end: 1927, keyword: '国民革命' },
  { start: 1926, end: 1928, keyword: '北伐战争' }, { start: 1931, end: 1931, keyword: '九一八事变' },
  { start: 1934, end: 1936, keyword: '长征' }, { start: 1937, end: 1945, keyword: '抗日战争' },
  { start: 1945, end: 1949, keyword: '解放战争' },
];

const TITLE_KEYWORDS: Record<string, string> = {
  '虎门销烟': '虎门销烟', '林维喜案': '林维喜事件',
  '九龙之战': '九龙之战', '穿鼻之战': '穿鼻之战', '官涌之战': '官涌之战',
  '虎门之战': '虎门之战', '广州战役': '第一次广州战役',
  '吴淞之战': '吴淞战役', '镇江之战': '镇江之战', '镇海之战': '镇海战役',
  '南京条约签订': '南京条约', '虎门条约签订': '虎门条约',
  '中美望厦条约签订': '望厦条约', '中法黄埔条约签订': '黄埔条约',
  '金田起义': '金田起义', '天京事变': '天京事变',
  '蓑衣渡之战': '蓑衣渡之战', '湖口之战': '湖口之战',
  '太平军北伐': '太平天国北伐', '太平军西征': '太平天国西征',
  '天京陷落': '天京保卫战',
  '亚罗号事件': '亚罗号事件', '马神甫事件': '马神甫事件',
  '大沽口之战清军胜利': '大沽口之战', '火烧圆明园': '火烧圆明园',
  '八里桥之战': '八里桥之战',
  '中英北京条约签订': '北京条约', '中法北京条约签订': '北京条约',
  '中俄北京条约签订': '中俄北京条约',
  '辛酉政变': '辛酉政变',
  '福州船政局': '福州船政局', '江南制造总局': '江南制造总局',
  '北洋水师': '北洋水师', '京师同文馆': '京师同文馆',
  '马尾海战': '马尾海战', '镇南关大捷': '镇南关大捷',
  '基隆战役': '基隆战役',
  '中法新约': '中法新约',
  '丰岛海战': '丰岛海战', '平壤战役': '平壤战役',
  '黄海海战': '黄海海战', '威海卫之战': '威海卫战役',
  '《马关条约》签订': '马关条约',
  '公车上书': '公车上书', '百日维新': '戊戌变法',
  '戊戌政变': '戊戌政变',
  '义和团运动开始': '义和团运动', '朱红灯起义': '朱红灯起义',
  '《辛丑条约》签订': '辛丑条约',
  '清末新政': '清末新政', '废科举': '废科举',
  '四川保路运动': '保路运动', '萍浏醴起义': '萍浏醴起义',
  '徐锡麟起义': '徐锡麟起义', '秋瑾就义': '秋瑾',
  '广州新军起义': '广州新军起义', '黄花岗起义': '黄花岗起义',
  '武昌起义': '武昌起义',
  '辛亥革命': '辛亥革命', '中华民国临时政府成立': '中华民国',
  '清帝退位': '清帝退位',
  '二次革命': '二次革命', '护国运动': '护国战争',
  '护法运动': '护法运动', '张勋复辟': '张勋复辟',
  '冯玉祥北京政变': '北京政变',
  '五四运动': '五四运动', '新文化运动': '新文化运动',
  '一二九运动': '一二·九运动', '五卅运动': '五卅运动',
  '中共一大': '中国共产党第一次全国代表大会',
  '中共二大': '中国共产党第二次全国代表大会',
  '中共三大': '中国共产党第三次全国代表大会',
  '国民党一大': '中国国民党第一次全国代表大会',
  '中山舰事件': '中山舰事件', '四一二政变': '四一二政变',
  '七一五分共': '七一五分共',
  '南昌起义': '南昌起义', '秋收起义': '秋收起义',
  '广州起义': '广州起义', '古田会议': '古田会议',
  '湘江战役': '湘江战役', '遵义会议': '遵义会议',
  '四渡赤水': '四渡赤水', '飞夺泸定桥': '飞夺泸定桥',
  '红军长征': '长征',
  '九一八事变': '九一八事变', '一二八事变': '一·二八事变',
  '福建事变': '福建事变', '华北事变': '华北事变',
  '西安事变': '西安事变',
  '七七事变': '七七事变', '淞沪会战': '淞沪会战',
  '太原会战': '太原会战', '平型关战役': '平型关大捷',
  '徐州会战': '徐州会战', '台儿庄战役': '台儿庄战役',
  '武汉会战': '武汉会战', '兰封会战': '兰封会战',
  '随枣会战': '随枣会战', '第一次长沙会战': '长沙会战',
  '枣宜会战': '枣宜会战', '中条山战役': '中条山战役',
  '黄桥战役': '黄桥战役', '第二次长沙会战': '长沙会战',
  '皖南事变': '皖南事变', '豫南会战': '豫南会战',
  '上高会战': '上高会战', '第三次长沙会战': '长沙会战',
  '浙赣会战': '浙赣会战', '鄂西会战': '鄂西会战',
  '常德会战': '常德会战', '豫中会战': '豫中会战',
  '豫湘桂战役': '豫湘桂战役', '桂柳会战': '桂柳会战',
  '松山战役': '松山战役', '开罗会议': '开罗会议',
  '波茨坦会议': '波茨坦公告', '日本投降': '日本投降',
  '重庆谈判': '重庆谈判', '政治协商会议': '政治协商会议',
  '苏中战役': '苏中战役', '定陶战役': '定陶战役',
  '孟良崮战役': '孟良崮战役', '莱芜战役': '莱芜战役',
  '石家庄战役': '石家庄战役', '济南战役': '济南战役',
  '辽沈战役': '辽沈战役', '淮海战役': '淮海战役',
  '平津战役': '平津战役', '渡江战役': '渡江战役',
  '新政协筹备会议': '中国人民政治协商会议',
};

function getKeyword(title: string, startDate: string): string {
  for (const [key, kw] of Object.entries(TITLE_KEYWORDS)) {
    if (title.includes(key)) return kw;
  }
  if (title.length >= 3 && title.length <= 15) return title;
  const year = new Date(startDate).getFullYear();
  for (const p of PERIOD_KEYWORDS) {
    if (year >= p.start && year <= p.end) return p.keyword;
  }
  return '';
}

const baikeCache = new Map<string, string>();

async function fetchBaike(keyword: string): Promise<string | null> {
  if (baikeCache.has(keyword)) return baikeCache.get(keyword)!;

  const url = `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?appid=379020&bk_key=${encodeURIComponent(keyword)}&bk_length=5000`;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      const data = await res.json() as Record<string, unknown>;
      if (!('desc' in data)) { if (attempt < 4) await sleep(2000); continue; }
      let abstract = String(data['abstract'] || '').trim().replace(/<[^>]+>/g, '');
      if (abstract.endsWith('...')) abstract = abstract.slice(0, -3) + '。';
      if (abstract.length > 20) { baikeCache.set(keyword, abstract); return abstract; }
      if (attempt < 4) await sleep(2000);
    } catch { if (attempt < 4) await sleep(2000); }
  }
  return null;
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

function buildDetail(title: string, summary: string, baike: string | null, _eventType: string, matchedKeyword: string): { motive: string; process: string; result: string; impact: string } {
  const process = summary || '';
  if (!baike) return { motive: '', process, result: '', impact: '' };

  const parts = baike.split(/[,，;；。、]/).filter(s => s.trim().length > 3);
  if (parts.length === 0) return { motive: '', process, result: '', impact: '' };

  const isExactMatch = title === matchedKeyword || TITLE_KEYWORDS[title] === matchedKeyword;
  if (isExactMatch) {
    const third = Math.ceil(parts.length / 3);
    const motive = parts.slice(0, third).join('，') + '。';
    const result = parts.slice(third, third * 2).join('，') + '。';
    const impact = parts.slice(third * 2).join('，') + '。';
    return { motive, process, result, impact };
  }

  const titleWords = title.replace(/[之战|战役|签订|爆发|开始|失败|成功|正式|继续|进一步|运动]/g, '').split(/[,，、\s]/);
  const relevantParts = parts.filter(p => titleWords.some(w => p.includes(w) && w.length >= 2));

  if (relevantParts.length >= 3) {
    const third = Math.ceil(relevantParts.length / 3);
    return {
      motive: relevantParts.slice(0, third).join('，') + '。',
      process,
      result: relevantParts.slice(third, third * 2).join('，') + '。',
      impact: relevantParts.slice(third * 2).join('，') + '。',
    };
  }

  const half = Math.ceil(parts.length / 2);
  return {
    motive: parts.slice(0, half).join('，') + '。',
    process,
    result: parts.slice(half).join('，') + '。',
    impact: '',
  };
}

// ==================== 主流程 ====================

async function processEvent(e: any, Event: any): Promise<'inserted' | 'updated' | 'skipped'> {
  const existing = await Event.findOne({ title: e.title }).lean() as any;

  // 检查 events.json 中是否有优质详情（来自 raw markdown 或蒋廷黻史料）
  const hasExistingDetail = e.detail && ((e.detail.process || '').length > 50 || (e.detail.motive || '').length > 50);
  const hasBookSource = e.source && e.source.includes('蒋廷黻');

  // 如果已有记录且已有详情，但 events.json 中有更好的内容（蒋廷黻史料或更长的详情），则更新
  if (existing && existing.detail && (existing.detail.process || '').length > 10) {
    const existingDetailLen = (existing.detail.process || '').length + (existing.detail.motive || '').length;
    const newDetailLen = (e.detail?.process || '').length + (e.detail?.motive || '').length;
    // 如果新内容更好或有蒋廷黻来源，更新
    if (hasBookSource || newDetailLen > existingDetailLen + 20) {
      // fall through to update
    } else {
      return 'skipped';
    }
  }

  let detail: { motive: string; process: string; result: string; impact: string };
  if (hasExistingDetail) {
    detail = {
      motive: e.detail.motive || '',
      process: e.detail.process || '',
      result: e.detail.result || '',
      impact: e.detail.impact || '',
    };
  } else {
    // 否则用百度百科补充
    const keyword = getKeyword(e.title, e.startDate);
    let baike: string | null = null;
    if (keyword) {
      baike = await fetchBaike(keyword);
      await sleep(200);
    }
    detail = buildDetail(e.title, e.summary, baike, e.eventType, keyword);
  }

  const impact = calcImpact(e);

  const doc = {
    title: e.title,
    startDate: new Date(e.startDate),
    endDate: e.endDate ? new Date(e.endDate) : null,
    isInstant: e.isInstant ?? true,
    eventType: e.eventType || '事件',
    location: e.location || '',
    summary: e.summary || '',
    detail,
    impactFactor: impact,
    subEvents: e.subEvents || [],
    relatedEvents: e.relatedEvents || [],
    personIds: e.personIds || [],
    source: e.source || '',
  };

  if (existing) {
    await Event.updateOne({ _id: existing._id }, { $set: doc });
    return 'updated';
  } else {
    await Event.create(doc);
    return 'inserted';
  }
}

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
  });
}

function saveProgress(chunkIndex: number, processed: number) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ chunkIndex, processed, timestamp: Date.now() }), 'utf8');
}

function loadProgress(): { chunkIndex: number; processed: number } | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch { /* ignore */ }
  return null;
}

async function main() {
  console.log('=== 批量分块导入 events.json 到 MongoDB ===\n');
  console.log(`分块大小: ${CHUNK_SIZE} 条/块`);
  console.log(`并发数: ${CONCURRENCY}`);
  if (RESUME) {
    const progress = loadProgress();
    if (progress) {
      console.log(`断点续传: 从第 ${progress.chunkIndex} 块开始 (已处理 ${progress.processed} 条)\n`);
    } else {
      console.log('未找到进度文件，从头开始\n');
    }
  } else {
    console.log();
  }

  const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const jsonEvents = rawData.events || rawData;
  console.log(`JSON 数据共 ${jsonEvents.length} 条事件`);

  const EventSchema = new mongoose.Schema({}, { strict: false });

  // 时期数据
  const periods = [
    { name: '鸦片战争时期', startYear: 1839, endYear: 1860, color: '#f5222d', order: 1 },
    { name: '洋务运动时期', startYear: 1861, endYear: 1894, color: '#1890ff', order: 2 },
    { name: '甲午战后时期', startYear: 1895, endYear: 1900, color: '#fa8c16', order: 3 },
    { name: '清末新政时期', startYear: 1901, endYear: 1911, color: '#52c41a', order: 4 },
    { name: '民国初期', startYear: 1912, endYear: 1926, color: '#722ed1', order: 5 },
    { name: '国民政府时期', startYear: 1927, endYear: 1949, color: '#eb2f96', order: 6 },
  ];

  // 分块处理
  const chunks: any[][] = [];
  for (let i = 0; i < jsonEvents.length; i += CHUNK_SIZE) {
    chunks.push(jsonEvents.slice(i, i + CHUNK_SIZE));
  }
  console.log(`分为 ${chunks.length} 块\n`);

  let startChunk = 0;
  let globalProcessed = 0;

  if (RESUME) {
    const progress = loadProgress();
    if (progress) {
      startChunk = progress.chunkIndex;
      globalProcessed = progress.processed;
    }
  }

  let totalInserted = 0, totalUpdated = 0, totalSkipped = 0;
  const startTime = Date.now();

  for (let ci = startChunk; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    console.log(`--- 块 ${ci + 1}/${chunks.length} (${chunk.length} 条事件) ---`);

    try {
      await connectMongo();
      console.log('MongoDB 连接成功');

      // 在循环外创建 model，避免重复注册
      const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
      const Period = mongoose.models.Period || mongoose.model('Period', new mongoose.Schema({}, { strict: false }));

      // 时期映射
      const periodMap: Record<number, any> = {};
      for (const p of periods) {
        let doc = await Period.findOne({ name: p.name });
        if (!doc) doc = await Period.create(p);
        for (let y = p.startYear; y <= p.endYear; y++) periodMap[y] = doc._id;
      }

      let inserted = 0, updated = 0, skipped = 0;

      async function worker() {
        while (chunk.length > 0) {
          const e = chunk.shift()!;
          const year = new Date(e.startDate).getFullYear();
          const periodId = periodMap[year] || null;
          if (periodId) e.periodId = periodId.toString();

          const result = await processEvent(e, Event);
          if (result === 'inserted') inserted++;
          else if (result === 'updated') updated++;
          else skipped++;
        }
      }

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

      totalInserted += inserted;
      totalUpdated += updated;
      totalSkipped += skipped;
      globalProcessed += chunk.length > 0 ? 0 : (chunks[ci] || []).length;
      // Recalculate: the chunk was shifted, so track original size
      console.log(`  新增: ${inserted} | 更新: ${updated} | 跳过: ${skipped}`);

      saveProgress(ci + 1, globalProcessed);

    } catch (err: any) {
      console.error(`  块 ${ci + 1} 失败: ${err.message}`);
      console.log('  保存进度，可 --resume 重试');
      saveProgress(ci, globalProcessed);
      throw err;
    }

    await mongoose.disconnect();
    // 块间短暂暂停
    if (ci < chunks.length - 1) await sleep(2000);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== 完成 (${elapsed}s) ===`);
  console.log(`  新增: ${totalInserted}`);
  console.log(`  更新: ${totalUpdated}`);
  console.log(`  跳过: ${totalSkipped}`);
  console.log(`  百科缓存: ${baikeCache.size} 个词条`);

  await connectMongo();
  const EventFinal = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({}, { strict: false }));
  console.log(`  数据库总数: ${await EventFinal.countDocuments()}`);
  await mongoose.disconnect();

  // 清理进度文件
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
}

main().catch(err => { console.error('失败:', err); process.exit(1); });
