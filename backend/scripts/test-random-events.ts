import { calculateImpact, ImpactFactorCalculator, EventInput } from '../src/common/impact-factor';

// 20 个随机取样事件 + 3 个重大事件对照
// 评分基于五史观综合判断，经过修正

const testEvents: { name: string; input: EventInput }[] = [
  {
    name: '禁止对英贸易',
    input: {
      title: '禁止对英贸易', eventType: '事件', location: '广州',
      startDate: new Date('1839-08-15'),
      summary: '林则徐下令禁止对英贸易',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.0, economicImpact: 4.0, militaryScale: 2.5,
        socialStructure: 3.0, ideologicalCultural: 3.0, internationalRelations: 4.5,
        territorialSovereignty: 2.5, institutionalLegacy: 3.0, historicalTurningPoint: 3.5,
      },
    },
  },
  {
    name: '穿鼻之战',
    input: {
      title: '穿鼻之战', eventType: '战争', location: '穿鼻洋',
      startDate: new Date('1839-10-01'),
      summary: '英国军舰与中国水师在穿鼻洋发生冲突',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: true,
      manualDimensionScores: {
        politicalChange: 3.5, economicImpact: 3.0, militaryScale: 5.0,
        socialStructure: 2.5, ideologicalCultural: 3.0, internationalRelations: 4.0,
        territorialSovereignty: 3.5, institutionalLegacy: 2.5, historicalTurningPoint: 4.0,
      },
    },
  },
  {
    name: '广州反入城斗争',
    input: {
      title: '广州反入城斗争', eventType: '事件', location: '广州',
      startDate: new Date('1845-01-01'),
      summary: '广州民众反对英国人进入广州城',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: false,
      manualDimensionScores: {
        politicalChange: 3.5, economicImpact: 3.0, militaryScale: 2.5,
        socialStructure: 3.5, ideologicalCultural: 3.5, internationalRelations: 3.5,
        territorialSovereignty: 3.0, institutionalLegacy: 2.5, historicalTurningPoint: 3.0,
      },
    },
  },
  {
    name: '冯云山发展拜上帝会骨干',
    input: {
      title: '冯云山发展拜上帝会骨干', eventType: '事件', location: '广西紫荆山',
      startDate: new Date('1846-01-01'),
      summary: '冯云山在紫荆山发展拜上帝会骨干成员',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 3.0, economicImpact: 2.0, militaryScale: 2.0,
        socialStructure: 2.5, ideologicalCultural: 3.5, internationalRelations: 2.0,
        territorialSovereignty: 2.0, institutionalLegacy: 2.5, historicalTurningPoint: 3.0,
      },
    },
  },
  {
    name: '拜上帝会公开活动',
    input: {
      title: '拜上帝会公开活动', eventType: '事件', location: '广西紫荆山',
      startDate: new Date('1847-01-01'),
      summary: '拜上帝会开始在紫荆山公开活动',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.0, economicImpact: 2.0, militaryScale: 2.0,
        socialStructure: 3.5, ideologicalCultural: 5.0, internationalRelations: 2.0,
        territorialSovereignty: 2.0, institutionalLegacy: 3.0, historicalTurningPoint: 4.5,
      },
    },
  },
  {
    name: '冯云山被捕获释',
    input: {
      title: '冯云山被捕获释', eventType: '事件', location: '广西桂平',
      startDate: new Date('1848-01-01'),
      summary: '冯云山被地方士绅逮捕，后贿赂获释',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: false,
      manualDimensionScores: {
        politicalChange: 2.5, economicImpact: 2.0, militaryScale: 2.0,
        socialStructure: 2.0, ideologicalCultural: 2.5, internationalRelations: 2.0,
        territorialSovereignty: 2.0, institutionalLegacy: 2.0, historicalTurningPoint: 2.5,
      },
    },
  },
  {
    name: '石达开加入拜上帝会',
    input: {
      title: '石达开加入拜上帝会', eventType: '事件', location: '广西贵县',
      startDate: new Date('1849-01-01'),
      summary: '石达开加入拜上帝会成为骨干',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 3.0, economicImpact: 2.0, militaryScale: 2.5,
        socialStructure: 2.5, ideologicalCultural: 3.0, internationalRelations: 2.0,
        territorialSovereignty: 2.0, institutionalLegacy: 3.0, historicalTurningPoint: 3.0,
      },
    },
  },
  {
    name: '广西天地会起义',
    input: {
      title: '广西天地会起义', eventType: '起义', location: '广西',
      startDate: new Date('1850-01-01'),
      summary: '广西天地会发动起义与清军作战',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 5.0, economicImpact: 3.0, militaryScale: 5.5,
        socialStructure: 4.0, ideologicalCultural: 4.0, internationalRelations: 2.5,
        territorialSovereignty: 3.0, institutionalLegacy: 3.0, historicalTurningPoint: 4.5,
      },
    },
  },
  {
    name: '太平军攻克桂平',
    input: {
      title: '太平军攻克桂平', eventType: '事件', location: '广西桂平',
      startDate: new Date('1851-02-01'),
      summary: '太平军攻克广西桂平',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 5.0, economicImpact: 3.0, militaryScale: 5.5,
        socialStructure: 4.0, ideologicalCultural: 4.0, internationalRelations: 2.5,
        territorialSovereignty: 3.5, institutionalLegacy: 3.5, historicalTurningPoint: 4.5,
      },
    },
  },
  {
    name: '洪秀全称天王',
    input: {
      title: '洪秀全称天王', eventType: '事件', location: '广西武宣东乡',
      startDate: new Date('1851-03-23'),
      summary: '洪秀全自称天王，分封五军主将',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 6, isInternational: false,
      manualDimensionScores: {
        politicalChange: 7.0, economicImpact: 3.5, militaryScale: 6.0,
        socialStructure: 5.0, ideologicalCultural: 6.0, internationalRelations: 3.5,
        territorialSovereignty: 4.5, institutionalLegacy: 5.0, historicalTurningPoint: 6.5,
      },
    },
  },
  {
    name: '太平军攻克道州',
    input: {
      title: '太平军攻克道州', eventType: '事件', location: '湖南道州',
      startDate: new Date('1852-06-01'),
      summary: '太平军攻克湖南道州，发布讨胡檄',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 5.0, economicImpact: 3.5, militaryScale: 5.5,
        socialStructure: 4.0, ideologicalCultural: 5.0, internationalRelations: 2.5,
        territorialSovereignty: 3.5, institutionalLegacy: 4.0, historicalTurningPoint: 4.5,
      },
    },
  },
  {
    name: '萧朝贵攻长沙战死',
    input: {
      title: '萧朝贵攻长沙战死', eventType: '战争', location: '湖南长沙',
      startDate: new Date('1852-08-01'),
      summary: '西王萧朝贵进攻长沙阵亡',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.0, economicImpact: 2.5, militaryScale: 5.0,
        socialStructure: 3.0, ideologicalCultural: 3.0, internationalRelations: 2.0,
        territorialSovereignty: 2.5, institutionalLegacy: 3.0, historicalTurningPoint: 3.5,
      },
    },
  },
  {
    name: '太平军攻克安庆',
    input: {
      title: '太平军攻克安庆', eventType: '事件', location: '安徽安庆',
      startDate: new Date('1853-01-01'),
      summary: '太平军西征攻克安庆',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 5.0, economicImpact: 4.0, militaryScale: 5.5,
        socialStructure: 4.0, ideologicalCultural: 3.5, internationalRelations: 2.5,
        territorialSovereignty: 4.0, institutionalLegacy: 3.5, historicalTurningPoint: 4.5,
      },
    },
  },
  {
    name: '洋务运动进入新阶段',
    input: {
      title: '洋务运动进入新阶段', eventType: '改革', location: '全国各地',
      startDate: new Date('1864-01-01'),
      summary: '太平天国灭亡后，洋务运动进入新阶段',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.5, economicImpact: 6.5, militaryScale: 3.0,
        socialStructure: 4.5, ideologicalCultural: 6.0, internationalRelations: 3.5,
        territorialSovereignty: 2.5, institutionalLegacy: 6.5, historicalTurningPoint: 5.0,
      },
    },
  },
  {
    name: '洋务运动继续推进',
    input: {
      title: '洋务运动继续推进', eventType: '改革', location: '全国各地',
      startDate: new Date('1869-01-01'),
      summary: '洋务运动继续推进，各项事业稳步发展',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 3, isInternational: false,
      manualDimensionScores: {
        politicalChange: 3.0, economicImpact: 4.5, militaryScale: 3.0,
        socialStructure: 3.0, ideologicalCultural: 4.0, internationalRelations: 3.0,
        territorialSovereignty: 2.0, institutionalLegacy: 4.5, historicalTurningPoint: 3.0,
      },
    },
  },
  {
    name: '北洋海军达顶峰',
    input: {
      title: '北洋海军达顶峰', eventType: '事件', location: '山东威海卫',
      startDate: new Date('1888-01-01'),
      summary: '北洋海军实力达到顶峰',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 3.5, economicImpact: 4.0, militaryScale: 5.0,
        socialStructure: 2.5, ideologicalCultural: 3.0, internationalRelations: 4.0,
        territorialSovereignty: 3.5, institutionalLegacy: 4.0, historicalTurningPoint: 3.5,
      },
    },
  },
  {
    name: '新文化运动持续发展',
    input: {
      title: '新文化运动持续发展', eventType: '事件', location: '北京、上海',
      startDate: new Date('1920-01-01'),
      summary: '新文化运动持续发展，传播民主科学思想',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.0, economicImpact: 3.0, militaryScale: 2.0,
        socialStructure: 5.0, ideologicalCultural: 7.5, internationalRelations: 3.0,
        territorialSovereignty: 2.0, institutionalLegacy: 6.5, historicalTurningPoint: 5.5,
      },
    },
  },
  {
    name: '中央苏区缩小',
    input: {
      title: '中央苏区缩小', eventType: '事件', location: '江西苏区',
      startDate: new Date('1934-01-01'),
      summary: '第五次围剿中，中央苏区日益缩小',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 0, isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.0, economicImpact: 2.5, militaryScale: 4.0,
        socialStructure: 3.0, ideologicalCultural: 3.0, internationalRelations: 2.0,
        territorialSovereignty: 3.5, institutionalLegacy: 3.5, historicalTurningPoint: 3.5,
      },
    },
  },
  {
    name: '花园口决堤',
    input: {
      title: '花园口决堤', eventType: '事件', location: '河南花园口',
      startDate: new Date('1938-06-09'),
      summary: '炸开花园口黄河大堤，以水代兵阻日军',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 2, isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.0, economicImpact: 6.5, militaryScale: 5.5,
        socialStructure: 8.5, ideologicalCultural: 5.0, internationalRelations: 4.0,
        territorialSovereignty: 4.0, institutionalLegacy: 5.5, historicalTurningPoint: 6.5,
      },
    },
  },
  {
    name: '洋务运动继续推进(1885)',
    input: {
      title: '洋务运动继续推进', eventType: '改革', location: '全国各地',
      startDate: new Date('1885-01-01'),
      summary: '洋务运动继续推进，各项事业稳步发展',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 0, personCount: 1, isInternational: false,
      manualDimensionScores: {
        politicalChange: 3.0, economicImpact: 4.0, militaryScale: 3.0,
        socialStructure: 3.0, ideologicalCultural: 3.5, internationalRelations: 3.0,
        territorialSovereignty: 2.0, institutionalLegacy: 4.0, historicalTurningPoint: 3.0,
      },
    },
  },
  // 对照组：重大事件
  {
    name: '▶ 鸦片战争',
    input: {
      title: '鸦片战争', eventType: '战争', location: '广东沿海至长江流域',
      startDate: new Date('1840-06-01'), endDate: new Date('1842-08-29'),
      summary: '英国对中国发动的侵略战争',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 12, personCount: 5, isInternational: true,
      manualDimensionScores: {
        politicalChange: 8.0, economicImpact: 8.5, militaryScale: 9.0,
        socialStructure: 7.5, ideologicalCultural: 6.5, internationalRelations: 8.5,
        territorialSovereignty: 9.0, institutionalLegacy: 7.0, historicalTurningPoint: 9.5,
      },
    },
  },
  {
    name: '▶ 辛亥革命',
    input: {
      title: '辛亥革命', eventType: '起义', location: '全国各省',
      startDate: new Date('1911-10-10'), endDate: new Date('1912-02-12'),
      summary: '推翻清朝统治，建立中华民国',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 20, personCount: 10, isInternational: false,
      manualDimensionScores: {
        politicalChange: 10.0, economicImpact: 7.0, militaryScale: 8.0,
        socialStructure: 8.5, ideologicalCultural: 8.5, internationalRelations: 7.0,
        territorialSovereignty: 5.0, institutionalLegacy: 9.0, historicalTurningPoint: 10.0,
      },
    },
  },
  {
    name: '▶ 五四运动',
    input: {
      title: '五四运动', eventType: '事件', location: '北京',
      startDate: new Date('1919-05-04'), endDate: new Date('1919-06-28'),
      summary: '反帝反封建的爱国运动',
      detail: { motive: '', process: '', result: '', impact: '' },
      subEventsCount: 8, personCount: 6, isInternational: true,
      manualDimensionScores: {
        politicalChange: 7.0, economicImpact: 4.0, militaryScale: 2.0,
        socialStructure: 7.0, ideologicalCultural: 9.5, internationalRelations: 7.5,
        territorialSovereignty: 5.0, institutionalLegacy: 8.5, historicalTurningPoint: 9.0,
      },
    },
  },
];

// ==================== 运行测试 ====================

const calculator = new ImpactFactorCalculator();

// 表头
console.log(
  `${'事件'.padEnd(22)} | ` +
  ['政治','经济','军事','社会','思想','国际','领土','制度','转折'].map(h => h.padStart(5)).join('') +
  ` | ${'基础'.padStart(7)} ${'范围'.padStart(5)} ${'持续'.padStart(5)} | ${'最终'.padStart(7)}`,
);
console.log('-'.repeat(155));

const results: { name: string; finalScore: number; isMajor: boolean }[] = [];

for (const t of testEvents) {
  const breakdown = calculator.calculate(t.input);
  const d = breakdown.dimensions;
  const isMajor = t.name.startsWith('▶');

  console.log(
    `${t.name.padEnd(22)} | ` +
    `${d.politicalChange.score.toFixed(1).padStart(5)} ` +
    `${d.economicImpact.score.toFixed(1).padStart(5)} ` +
    `${d.militaryScale.score.toFixed(1).padStart(5)} ` +
    `${d.socialStructure.score.toFixed(1).padStart(5)} ` +
    `${d.ideologicalCultural.score.toFixed(1).padStart(5)} ` +
    `${d.internationalRelations.score.toFixed(1).padStart(5)} ` +
    `${d.territorialSovereignty.score.toFixed(1).padStart(5)} ` +
    `${d.institutionalLegacy.score.toFixed(1).padStart(5)} ` +
    `${d.historicalTurningPoint.score.toFixed(1).padStart(5)} | ` +
    `${breakdown.weightedSum.toFixed(0).padStart(7)} ` +
    `${('+' + breakdown.scopeBonus).padStart(5)} ` +
    `${('+' + breakdown.durationBonus).padStart(5)} | ` +
    `${breakdown.finalScore.toFixed(0).padStart(5)}/100`,
  );

  results.push({ name: t.name, finalScore: breakdown.finalScore, isMajor });
}

// 按分数排序
const sorted = [...results].sort((a, b) => b.finalScore - a.finalScore);
console.log('\n=== 按最终分数排序 ===\n');

let rank = 1;
for (const r of sorted) {
  const tag = r.isMajor ? '★' : '  ';
  console.log(`  ${tag}${rank}. ${r.name.padEnd(24)}  ${r.finalScore}/100`);
  rank++;
}

// 统计
const regularScores = results.filter(r => !r.isMajor).map(r => r.finalScore);
const majorScores = results.filter(r => r.isMajor).map(r => r.finalScore);
const allScores = results.map(r => r.finalScore);

console.log('\n=== 分布统计 ===');
console.log(`  全部: min=${Math.min(...allScores)}  max=${Math.max(...allScores)}  avg=${Math.round(allScores.reduce((a,b) => a+b, 0) / allScores.length)}`);
console.log(`  常规事件: min=${Math.min(...regularScores)}  max=${Math.max(...regularScores)}  avg=${Math.round(regularScores.reduce((a,b) => a+b, 0) / regularScores.length)}  range=${Math.max(...regularScores) - Math.min(...regularScores)}`);
console.log(`  重大事件: min=${Math.min(...majorScores)}  max=${Math.max(...majorScores)}  avg=${Math.round(majorScores.reduce((a,b) => a+b, 0) / majorScores.length)}`);

// 分段统计
const segments = [
  { label: '90-100 (顶级)', min: 90, max: 100 },
  { label: '80-89  (重大)', min: 80, max: 89 },
  { label: '70-79  (重要)', min: 70, max: 79 },
  { label: '60-69  (中等)', min: 60, max: 69 },
  { label: '50-59  (一般)', min: 50, max: 59 },
  { label: '40-49  (轻微)', min: 40, max: 49 },
  { label: '30-39  (微弱)', min: 30, max: 39 },
];
console.log('\n  分段分布:');
for (const seg of segments) {
  const count = allScores.filter(s => s >= seg.min && s <= seg.max).length;
  const bar = '█'.repeat(count) + '·'.repeat(Math.max(0, results.length - count));
  console.log(`    ${seg.label.padEnd(16)} ${count.toString().padStart(2)}  ${bar}`);
}
