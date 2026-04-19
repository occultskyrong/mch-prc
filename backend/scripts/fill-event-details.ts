/**
 * 填充事件详细描述 - 从百度百科获取史料并写入 MongoDB
 *
 * 使用方法:
 * MONGODB_URI=<连接串> npx ts-node backend/scripts/fill-event-details.ts
 */
import mongoose from 'mongoose';
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('请设置环境变量 MONGODB_URI');
  process.exit(1);
}
const DATA_FILE = path.join(process.cwd(), 'frontend/public/data/events.json');

// ==================== 百度百科获取 ====================

async function fetchBaikeContent(keyword: string, maxRetries = 5): Promise<string | null> {
  const url = `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?appid=379020&bk_key=${encodeURIComponent(keyword)}&bk_length=5000`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      const data = await res.json() as Record<string, unknown>;

      if (!('desc' in data)) {
        if (attempt < maxRetries - 1) {
          await sleep(2000);
          continue;
        }
        return null;
      }

      let abstract = String(data['abstract'] || '').trim();
      abstract = abstract.replace(/<[^>]+>/g, '');
      if (abstract.endsWith('...')) {
        abstract = abstract.slice(0, -3) + '。';
      }

      return abstract.length > 20 ? abstract : null;
    } catch {
      if (attempt < maxRetries - 1) await sleep(2000);
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 关键词映射 ====================

// 按时间段映射到百度百科关键词
const PERIOD_KEYWORDS: { start: number; end: number; keyword: string }[] = [
  { start: 1839, end: 1842, keyword: '鸦片战争' },
  { start: 1843, end: 1850, keyword: '南京条约' },
  { start: 1851, end: 1864, keyword: '太平天国' },
  { start: 1856, end: 1860, keyword: '第二次鸦片战争' },
  { start: 1861, end: 1894, keyword: '洋务运动' },
  { start: 1883, end: 1885, keyword: '中法战争' },
  { start: 1894, end: 1895, keyword: '甲午战争' },
  { start: 1898, end: 1898, keyword: '戊戌变法' },
  { start: 1899, end: 1900, keyword: '义和团运动' },
  { start: 1900, end: 1901, keyword: '八国联军' },
  { start: 1901, end: 1911, keyword: '清末新政' },
  { start: 1911, end: 1912, keyword: '辛亥革命' },
  { start: 1912, end: 1916, keyword: '中华民国' },
  { start: 1915, end: 1916, keyword: '护国运动' },
  { start: 1917, end: 1918, keyword: '护法运动' },
  { start: 1919, end: 1919, keyword: '五四运动' },
  { start: 1921, end: 1921, keyword: '中国共产党' },
  { start: 1924, end: 1927, keyword: '国民革命' },
  { start: 1926, end: 1928, keyword: '北伐战争' },
  { start: 1927, end: 1937, keyword: '国共内战' },
  { start: 1931, end: 1931, keyword: '九一八事变' },
  { start: 1934, end: 1936, keyword: '长征' },
  { start: 1937, end: 1945, keyword: '抗日战争' },
  { start: 1945, end: 1949, keyword: '解放战争' },
];

// 特定事件标题到百度百科关键词的精确映射
const TITLE_KEYWORDS: Record<string, string> = {
  // 鸦片战争时期
  '虎门销烟': '虎门销烟',
  '林则徐抵达广州': '林则徐',
  '发布禁烟令': '林则徐',
  '九龙之战': '鸦片战争',
  '穿鼻之战': '鸦片战争',
  '官涌之战': '鸦片战争',
  '虎门之战': '鸦片战争',
  '广州战役': '鸦片战争',
  '吴淞之战': '鸦片战争',
  '镇江之战': '鸦片战争',
  '南京条约签订': '南京条约',
  '虎门条约签订': '虎门条约',
  '中英五口通商章程签订': '南京条约',
  '上海开埠': '上海开埠',

  // 太平天国
  '金田起义': '金田起义',
  '永安建制': '太平天国',
  '定都天京': '太平天国',
  '北伐': '太平天国',
  '西征': '太平天国',
  '天京事变': '天京事变',
  '天京陷落': '太平天国',

  // 第二次鸦片战争
  '亚罗号事件': '亚罗号事件',
  '马神甫事件': '马神甫事件',
  '英法联军攻占广州': '第二次鸦片战争',
  '大沽口之战': '大沽口之战',
  '天津条约签订': '天津条约',
  '北京条约签订': '北京条约',
  '火烧圆明园': '火烧圆明园',
  '辛酉政变': '辛酉政变',

  // 中法战争
  '中法战争': '中法战争',
  '镇南关大捷': '镇南关大捷',
  '马尾海战': '马尾海战',

  // 甲午战争
  '丰岛海战': '甲午战争',
  '平壤战役': '甲午战争',
  '黄海海战': '黄海海战',
  '威海卫战役': '甲午战争',
  '马关条约签订': '马关条约',

  // 戊戌变法
  '公车上书': '公车上书',
  '百日维新': '戊戌变法',
  '戊戌政变': '戊戌变法',

  // 义和团
  '义和团运动爆发': '义和团运动',
  '八国联军侵华': '八国联军',
  '辛丑条约签订': '辛丑条约',

  // 清末新政
  '废科举': '废科举',
  '预备立宪': '清末立宪运动',
  '保路运动': '保路运动',

  // 辛亥革命
  '武昌起义': '武昌起义',
  '中华民国成立': '中华民国',
  '清帝退位': '清帝退位',

  // 民国
  '二次革命': '二次革命',
  '护国运动': '护国运动',
  '护法运动': '护法运动',
  '五四运动': '五四运动',

  // 中共早期
  '中共一大': '中国共产党第一次全国代表大会',
  '中共二大': '中国共产党第二次全国代表大会',
  '中共三大': '中国共产党第三次全国代表大会',
  '国民党一大': '中国国民党第一次全国代表大会',

  // 北伐
  '北伐开始': '北伐战争',
  '四一二政变': '四一二政变',
  '七一五分共': '七一五分共',

  // 国共内战
  '南昌起义': '南昌起义',
  '秋收起义': '秋收起义',
  '广州起义': '广州起义',
  '井冈山会师': '井冈山会师',

  // 长征
  '长征开始': '长征',
  '遵义会议': '遵义会议',
  '红军会师': '长征',

  // 九一八
  '九一八事变': '九一八事变',
  '一二八事变': '一二八事变',
  '华北事变': '华北事变',
  '西安事变': '西安事变',

  // 抗战
  '七七事变': '七七事变',
  '淞沪会战': '淞沪会战',
  '平型关大捷': '平型关大捷',
  '台儿庄战役': '台儿庄战役',
  '武汉会战': '武汉会战',
  '百团大战': '百团大战',
  '皖南事变': '皖南事变',
  '中共七大': '中国共产党第七次全国代表大会',
  '日本投降': '日本投降',

  // 解放战争
  '重庆谈判': '重庆谈判',
  '全面内战爆发': '解放战争',
  '三大战役': '三大战役',
  '渡江战役': '渡江战役',
  '新中国成立': '中华人民共和国中央人民政府',
};

function getKeywordForEvent(title: string, startDate: string): string {
  // 先尝试精确匹配
  for (const [key, kw] of Object.entries(TITLE_KEYWORDS)) {
    if (title.includes(key)) return kw;
  }

  // 再按时间段匹配
  const year = new Date(startDate).getFullYear();
  for (const period of PERIOD_KEYWORDS) {
    if (year >= period.start && year <= period.end) {
      return period.keyword;
    }
  }

  return '';
}

// ==================== 主要内容扩充 ====================

function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    '战争': '战争', '条约': '条约', '起义': '起义', '改革': '改革', '事件': '事件',
  };
  return labels[type] || '事件';
}

function expandFromBaike(title: string, summary: string, baike: string, type: string) {
  // 百科内容按原文拆分，不添加套话
  // 百度百科摘要一般是叙述性文字，直接按语义切分

  const motive = `${baike.slice(0, Math.floor(baike.length / 3))}`;
  const process = `${title}。${summary}`;
  const remaining = baike.slice(Math.floor(baike.length / 3));
  const result = `${remaining.slice(0, Math.floor(remaining.length / 2))}`;
  const impact = `${remaining.slice(Math.floor(remaining.length / 2))}`;

  return {
    motive: truncateSentence(motive, 250),
    process: truncateSentence(process, 280),
    result: truncateSentence(result, 250),
    impact: truncateSentence(impact, 250),
  };
}

function ensureLength(text: string, minChars: number, maxChars: number): string {
  if (text.length >= minChars && text.length <= maxChars) return text;

  if (text.length < minChars) {
    // 扩充到最小字数
    while (text.length < minChars) {
      text += '这一历史事件的发生，反映了当时社会的深刻变革与时代变迁。';
    }
    // 截断到最大字数
    if (text.length > maxChars) {
      text = text.slice(0, maxChars - 1) + '。';
    }
  } else if (text.length > maxChars) {
    // 截断到最大字数
    const lastPeriod = text.lastIndexOf('。', maxChars);
    if (lastPeriod > maxChars * 0.7) {
      text = text.slice(0, lastPeriod + 1);
    } else {
      text = text.slice(0, maxChars - 1) + '。';
    }
  }

  return text;
}

// ==================== 主流程 ====================

async function main() {
  console.log('连接 MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB 连接成功');

  // 读取 JSON 数据
  const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const jsonEvents = rawData.events || rawData;
  console.log(`JSON 数据共 ${jsonEvents.length} 条事件`);

  // 获取已有百科内容缓存
  const baikeCache: Record<string, string> = {};

  // 从 MongoDB 读取已有数据，只更新 detail 为空的
  const EventModel = mongoose.model('Event', new mongoose.Schema({}, { strict: false }));
  const dbEvents = await EventModel.find({}, '_id title startDate detail').lean() as unknown as Array<{ _id: string; title: string; startDate: string; detail?: Record<string, string> }>;
  console.log(`MongoDB 已有 ${dbEvents.length} 条事件`);

  // 构建 title 映射
  const dbEventMap = new Map<string, { _id: string; title: string; startDate: string; hasDetail: boolean }>();
  for (const ev of dbEvents) {
    const hasDetail = !!(ev.detail && (
      (ev.detail.motive && ev.detail.motive.length > 5) ||
      (ev.detail.process && ev.detail.process.length > 5) ||
      (ev.detail.result && ev.detail.result.length > 5) ||
      (ev.detail.impact && ev.detail.impact.length > 5)
    ));
    dbEventMap.set(ev.title, { _id: ev._id.toString(), title: ev.title, startDate: ev.startDate ? String(ev.startDate) : '', hasDetail });
  }

  // 统计
  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let baikeHitCount = 0;
  const keywordSet = new Set<string>();

  // 处理每个 JSON 事件
  for (const jsonEvent of jsonEvents) {
    const dbEvent = dbEventMap.get(jsonEvent.title);
    if (!dbEvent) {
      notFoundCount++;
      continue;
    }

    // 跳过已有详情的
    if (dbEvent.hasDetail) {
      skippedCount++;
      continue;
    }

    const keyword = getKeywordForEvent(jsonEvent.title, jsonEvent.startDate);
    if (!keyword) {
      skippedCount++;
      continue;
    }

    // 获取百科内容（带缓存和限流）
    let baikeContent: string | null = null;
    if (!baikeCache[keyword]) {
      baikeContent = await fetchBaikeContent(keyword);
      if (baikeContent) {
        baikeCache[keyword] = baikeContent;
        keywordSet.add(keyword);
        baikeHitCount++;
      }
      await sleep(3000); // 限流
    } else {
      baikeContent = baikeCache[keyword];
    }

    // 生成详细内容
    const detail = expandFromBaike(
      jsonEvent.title,
      jsonEvent.summary,
      baikeContent || '',
      eventTypeLabel(jsonEvent.eventType),
    );

    // 计算总字数
    const totalChars = (detail.motive?.length || 0) + (detail.process?.length || 0) +
                       (detail.result?.length || 0) + (detail.impact?.length || 0);

    // 更新 MongoDB
    await EventModel.findByIdAndUpdate(dbEvent._id, {
      $set: {
        'detail.motive': detail.motive,
        'detail.process': detail.process,
        'detail.result': detail.result,
        'detail.impact': detail.impact,
      },
    });

    updatedCount++;

    if (updatedCount % 20 === 0 || updatedCount === 1) {
      console.log(`  已更新 ${updatedCount} 条 | 跳过 ${skippedCount} 条 | 百科命中 ${baikeHitCount}/${keywordSet.size} | 当前: ${jsonEvent.title} (${totalChars} 字)`);
    }
  }

  console.log(`\n完成:`);
  console.log(`  更新: ${updatedCount} 条`);
  console.log(`  跳过: ${skippedCount} 条（已有详情或无关键词匹配）`);
  console.log(`  未找到: ${notFoundCount} 条（MongoDB 中不存在）`);
  console.log(`  百科关键词: ${keywordSet.size} 个 (${Array.from(keywordSet).join(', ')})`);

  await mongoose.disconnect();
  console.log('\n完成!');
}

main().catch(err => {
  console.error('失败:', err);
  process.exit(1);
});
