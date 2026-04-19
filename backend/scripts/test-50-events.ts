import { ImpactFactorCalculator, EventInput } from '../src/common/impact-factor';
import * as fs from 'fs';

// 从 sampled data 自动生成分数
function generateScores(event: any): Record<string, number> {
  const type = event.eventType;
  const loc = event.location || '';
  const summary = event.summary || '';
  const title = event.title || '';
  const detail = event.detail || {};
  const personCount = event.personIds?.length || 0;
  const subCount = event.subEvents?.length || 0;
  const fullText = `${title} ${summary} ${detail.motive || ''} ${detail.process || ''} ${detail.result || ''} ${detail.impact || ''}`.toLowerCase();

  // 基础分：按事件类型（降低基线差异，让规则修正发挥更大作用）
  const baseScores: Record<string, Record<string, number>> = {
    '战争': { p: 5.0, e: 4.0, m: 7.0, s: 4.0, i: 3.5, ir: 4.5, t: 4.0, l: 3.5, h: 4.5 },
    '条约': { p: 4.0, e: 4.5, m: 2.0, s: 3.5, i: 3.0, ir: 5.5, t: 6.0, l: 5.0, h: 4.5 },
    '起义': { p: 5.0, e: 3.0, m: 5.5, s: 3.5, i: 3.5, ir: 2.5, t: 3.0, l: 3.0, h: 4.5 },
    '改革': { p: 4.5, e: 5.0, m: 2.0, s: 4.0, i: 4.5, ir: 3.0, t: 2.0, l: 5.5, h: 4.0 },
    '事件': { p: 2.5, e: 1.5, m: 1.5, s: 2.0, i: 2.0, ir: 1.5, t: 1.5, l: 2.0, h: 2.0 },
  };
  const base = baseScores[type] || baseScores['事件'];

  let { p, e, m, s, i, ir, t, l, h } = base;

  // ==================== 关键词规则引擎 ====================
  // 每条规则：匹配条件 → 维度调整
  // 匹配范围：title + summary + detail

  // --- 革命史观规则 ---

  // 政权更迭 / 政变 / 皇帝
  if (/(政变|登基|即位|称帝|称王|退位|禅让|篡位|夺位|皇帝|天王|总统|总理|首相|政府成立|政府灭亡)/.test(fullText)) {
    p += 2.5; h += 2.0; l += 1.5;
  }
  // 起义 / 革命 / 暴动
  if (/(起义|革命|暴动|暴乱|造反|反抗|独立|解放)/.test(fullText)) {
    p += 2.0; m += 1.5; h += 1.5; s += 1.0;
  }
  // 檄文 / 号召 / 宣言
  if (/(檄文|号召|宣言|通电|宣布|发表)/.test(title)) {
    p += 1.0; i += 1.0;
  }

  // --- 现代化史观规则 ---

  // 工业 / 经济 / 实业
  if (/(制造|矿务|船政|招商|工厂|铁路|矿山|轮船|电报|电话|银行|货币|税制|海关|贸易|工业|实业|公司|局|厂)/.test(fullText)) {
    e += 2.0; l += 1.0;
  }
  // 海军 / 军事现代化
  if (/(海军|舰队|军舰|炮舰|造船|兵工厂|军火|武器|枪炮|练兵|新军|练新军|军事学堂)/.test(fullText)) {
    m += 1.5; e += 1.0;
  }
  // 教育 / 文化 / 思想
  if (/(教育|学堂|学校|书院|大学|留学|方言|编译|出版|报纸|杂志|新文化|思想|文化|科学|民主)/.test(fullText)) {
    i += 2.0; l += 1.0; s += 0.5;
  }
  // 交通 / 基础设施
  if (/(铁路|公路|桥梁|港口|机场|电报|电话|邮政|通讯)/.test(fullText)) {
    e += 1.5; l += 0.5;
  }

  // --- 全球史观规则 ---

  // 条约 / 外交 / 对外关系
  if (/(条约|签订|谈判|外交|租界|开埠|公使|领事|割地|赔款|通商|口岸|最惠国|协定关税)/.test(fullText)) {
    ir += 2.5; t += 1.5; e += 0.5;
  }
  // 外国地名 / 国际性
  if (/(英国|法国|俄国|德国|日本|朝鲜|越南|新疆|澳门|美国|意大利|奥匈|西班牙|葡萄牙|荷兰|俄国|沙俄|苏联)/.test(loc)) {
    ir += 1.5;
    if (/(战争|冲突|抵抗|战|侵略|进攻|攻占|占领|炮轰)/.test(title)) {
      ir += 1.0; m += 1.0;
    }
  }
  // 传教 / 宗教
  if (/(传教|教案|宗教|教会|天主|基督|上帝|拜上帝)/.test(fullText)) {
    i += 1.5; ir += 0.5; s += 0.5;
  }

  // --- 社会史观规则 ---

  // 人口 / 灾难 / 屠杀
  if (/(屠杀|大屠杀|死亡|伤亡|灾|荒|饥荒|瘟疫|难民|流民|移民|迁徙|决堤|炸毁|烧毁)/.test(fullText)) {
    s += 2.5; e += 1.0; h += 1.0;
  }
  // 收复 / 攻克 / 防守
  if (/(收复|攻克|防守|攻占|占领|陷落|沦陷|失守|弃守|弃城)/.test(fullText)) {
    m += 1.5; s += 1.0; h += 0.5;
  }
  // 阶级 / 社会制度
  if (/(阶级|农民|工人|市民|妇女|儿童|奴隶|封建|地主|土豪|士绅|科举|废科举)/.test(fullText)) {
    s += 1.5; p += 1.0;
  }

  // --- 唯物史观规则 ---

  // 制度变革
  if (/(改革|变法|维新|立宪|宪政|制度|体制|缩短|共和|君主|帝制|民国)/.test(fullText)) {
    p += 2.0; i += 1.0; l += 1.5; h += 1.0;
  }
  // 土地 / 农业
  if (/(土地|农业|农民|农村|公社|均田|平均|分配|没收|私有|公有|集体)/.test(fullText)) {
    e += 1.0; s += 1.5; p += 0.5;
  }

  // --- 特殊事件识别（高权重） ---

  if (title.includes('中俄北京条约')) {
    t += 2.5; ir += 1.5; h += 1.5;
  }
  if (title.includes('辛酉政变')) {
    p += 2.5; h += 2.5; s += 1.0;
  }
  if (title.includes('捻军')) {
    m += 1.5; h += 1.0; s += 0.5;
  }
  if (title.includes('台儿庄')) {
    m += 3.0; p += 2.0; h += 2.5; s += 1.5; ir += 1.0;
  }
  if (title.includes('中法战争')) {
    m += 2.5; ir += 2.0; h += 2.0;
  }
  if (title.includes('阿古柏')) {
    t += 1.5; ir += 1.5;
  }
  if (title.includes('海关总税务司')) {
    ir += 1.5; e += 1.5; l += 1.5;
  }
  if (title.includes('鸦片战争') || title.includes('英法联军')) {
    m += 2.0; ir += 1.5; t += 1.0; h += 1.5;
  }
  if (title.includes('太平') || title.includes('天京')) {
    p += 1.5; m += 1.0; s += 1.5; h += 1.0;
  }
  if (title.includes('洋务')) {
    e += 2.0; m += 1.0; l += 1.5; i += 1.0;
  }
  if (title.includes('戊戌') || title.includes('维新')) {
    p += 1.5; i += 2.0; l += 1.0; h += 1.0;
  }
  if (title.includes('五四')) {
    i += 3.0; p += 1.5; s += 1.5; h += 2.0;
  }
  if (title.includes('甲午') || title.includes('马关')) {
    m += 2.0; ir += 2.0; t += 2.0; h += 1.5;
  }
  if (title.includes('义和团')) {
    m += 1.5; s += 2.0; ir += 1.5; i += 1.0;
  }
  if (title.includes('辛亥革命') || title.includes('武昌起义')) {
    p += 3.0; h += 3.0; l += 2.0; s += 1.5;
  }
  if (title.includes('南昌')) {
    m += 2.0; p += 1.5; h += 2.0; l += 1.5;
  }
  if (title.includes('卢沟桥') || title.includes('七七') || title.includes('全面抗战')) {
    m += 2.0; p += 1.5; h += 2.5; ir += 1.0;
  }
  if (title.includes('抗日') || title.includes('抗战')) {
    m += 2.5; p += 2.0; s += 1.5; ir += 2.0; h += 2.5;
  }
  if (title.includes('虎门销烟') || title.includes('禁烟') || title.includes('鸦片')) {
    ir += 1.5; p += 1.0; h += 1.5; i += 1.0;
  }

  // --- 人物数量信号 ---
  // 重要人物越多，政治/社会影响越大
  if (personCount >= 5) { p += 1.5; s += 1.0; h += 1.0; }
  else if (personCount >= 3) { p += 1.0; s += 0.5; }
  else if (personCount >= 1) { p += 0.3; }

  // --- 子事件数量信号 ---
  if (subCount >= 10) { m += 1.0; h += 1.0; p += 0.5; }
  else if (subCount >= 5) { m += 0.5; h += 0.5; }
  else if (subCount >= 2) { m += 0.3; }

  // --- 战场范围修正 ---
  if (/(越南|中国沿海|台湾|东北|华北|华南|西南|西北|华中|华东|长江|黄河)/.test(loc)) {
    ir += 1.0; m += 0.5;
  }

  // Clamp 1-10
  const clamp = (v: number) => Math.max(1, Math.min(10, Math.round(v * 10) / 10));

  return {
    politicalChange: clamp(p),
    economicImpact: clamp(e),
    militaryScale: clamp(m),
    socialStructure: clamp(s),
    ideologicalCultural: clamp(i),
    internationalRelations: clamp(ir),
    territorialSovereignty: clamp(t),
    institutionalLegacy: clamp(l),
    historicalTurningPoint: clamp(h),
  };
}

// ==================== 加载数据 ====================

const eventsData = JSON.parse(fs.readFileSync('/tmp/sampled-events.json', 'utf8'));

const calculator = new ImpactFactorCalculator();

// ==================== 测试运行 ====================

console.log('=== 50 个随机事件影响力因子计算 ===\n');

const headers = ['事件', '类型', '政治', '经济', '军事', '社会', '思想', '国际', '领土', '制度', '转折', '基础', '范围', '持续', '最终'];
const colWidths = [20, 3, 5, 5, 5, 5, 5, 5, 5, 5, 5, 7, 7, 7, 7];
const line = colWidths.reduce((acc, w) => acc + '-'.repeat(w) + '-+-', '').slice(0, -3);

// Header
let headerLine = '';
headers.forEach((h, i) => {
  headerLine += h.padStart(colWidths[i]) + ' | ';
});
console.log(headerLine.slice(0, -3));
console.log(line);

const results: { name: string; type: string; finalScore: number; weightedSum: number }[] = [];

for (const event of eventsData) {
  const scores = generateScores(event);
  const input: EventInput = {
    title: event.title,
    eventType: event.eventType,
    location: event.location,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    summary: event.summary,
    detail: event.detail,
    subEventsCount: event.subEvents?.length || 0,
    personCount: event.personIds?.length || 0,
    isInternational: false,
    manualDimensionScores: scores,
  };

  const breakdown = calculator.calculate(input);
  const d = breakdown.dimensions;

  const typeAbbr = { '战争': '战', '条约': '约', '起义': '起', '改革': '改', '事件': '事' }[event.eventType] || '?';

  let row = '';
  row += event.title.padEnd(colWidths[0]) + ' | ';
  row += typeAbbr.padStart(colWidths[1]) + ' | ';
  row += d.politicalChange.score.toFixed(0).padStart(colWidths[2]) + ' | ';
  row += d.economicImpact.score.toFixed(0).padStart(colWidths[3]) + ' | ';
  row += d.militaryScale.score.toFixed(0).padStart(colWidths[4]) + ' | ';
  row += d.socialStructure.score.toFixed(0).padStart(colWidths[5]) + ' | ';
  row += d.ideologicalCultural.score.toFixed(0).padStart(colWidths[6]) + ' | ';
  row += d.internationalRelations.score.toFixed(0).padStart(colWidths[7]) + ' | ';
  row += d.territorialSovereignty.score.toFixed(0).padStart(colWidths[8]) + ' | ';
  row += d.institutionalLegacy.score.toFixed(0).padStart(colWidths[9]) + ' | ';
  row += d.historicalTurningPoint.score.toFixed(0).padStart(colWidths[10]) + ' | ';
  row += breakdown.weightedSum.toFixed(0).padStart(colWidths[11]) + ' | ';
  row += ('+' + breakdown.scopeBonus).padStart(colWidths[12]) + ' | ';
  row += ('+' + breakdown.durationBonus).padStart(colWidths[13]) + ' | ';
  row += breakdown.finalScore.toString().padStart(colWidths[14]);

  console.log(row);
  results.push({ name: event.title, type: typeAbbr, finalScore: breakdown.finalScore, weightedSum: breakdown.weightedSum });
}

// 排序
const sorted = [...results].sort((a, b) => b.finalScore - a.finalScore);

console.log('\n=== 按最终分数排序 ===\n');
sorted.forEach((r, i) => {
  const tag = r.type;
  console.log(`  ${String(i + 1).padStart(2)}. [${tag}] ${r.name.padEnd(22)}  ${r.finalScore}/1000  (基础${r.weightedSum})`);
});

// 统计
const scores = results.map(r => r.finalScore);
const min = Math.min(...scores);
const max = Math.max(...scores);
const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
const median = scores.sort((a, b) => a - b)[25];

console.log('\n=== 分布统计 ===');
console.log(`  全部: min=${min}  max=${max}  avg=${avg}  median=${median}  range=${max - min}`);

const segments = [
  { label: '900-1000 (顶级)', min: 900, max: 1000 },
  { label: '800-899  (重大)', min: 800, max: 899 },
  { label: '700-799  (重要)', min: 700, max: 799 },
  { label: '600-699  (较高)', min: 600, max: 699 },
  { label: '500-599  (中等)', min: 500, max: 599 },
  { label: '400-499  (一般)', min: 400, max: 499 },
  { label: '300-399  (轻微)', min: 300, max: 399 },
  { label: '200-299  (微弱)', min: 200, max: 299 },
  { label: '100-199  (极微)', min: 100, max: 199 },
];

console.log('\n  分段分布:');
for (const seg of segments) {
  const count = scores.filter(s => s >= seg.min && s <= seg.max).length;
  const bar = '█'.repeat(count) + '·'.repeat(50 - count);
  console.log(`    ${seg.label.padEnd(16)} ${count.toString().padStart(2)}  ${bar}`);
}

// 类型分布
console.log('\n  按事件类型:');
const typeGroups: Record<string, number[]> = {};
results.forEach(r => {
  if (!typeGroups[r.type]) typeGroups[r.type] = [];
  typeGroups[r.type].push(r.finalScore);
});
for (const [type, sc] of Object.entries(typeGroups).sort((a, b) => a[0].localeCompare(b[0]))) {
  const typeAvg = Math.round(sc.reduce((a, b) => a + b, 0) / sc.length);
  const typeMin = Math.min(...sc);
  const typeMax = Math.max(...sc);
  console.log(`    ${type}: count=${sc.length}  avg=${typeAvg}  range=[${typeMin}-${typeMax}]`);
}
