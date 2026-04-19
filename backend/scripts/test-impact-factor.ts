import { calculateImpact, ImpactFactorCalculator } from '../src/common/impact-factor';

// 中国近代史典型事件测试

const testEvents = [
  {
    name: '鸦片战争',
    input: {
      title: '鸦片战争',
      eventType: '战争',
      location: '广东沿海至长江流域',
      startDate: new Date('1840-06-01'),
      endDate: new Date('1842-08-29'),
      summary: '英国对中国发动的侵略战争，中国战败签订《南京条约》',
      detail: {
        motive: '英国为打开中国市场，倾销鸦片',
        process: '英军攻占广州、厦门、定海、镇江等地',
        result: '中国战败，签订《南京条约》，割让香港岛',
        impact: '中国开始沦为半殖民地半封建社会，是中国近代史的开端',
      },
      subEventsCount: 12,
      personCount: 5,
      isInternational: true,
      manualDimensionScores: {
        politicalChange: 8.0,
        economicImpact: 8.5,
        militaryScale: 9.0,
        socialStructure: 7.5,
        ideologicalCultural: 6.5,
        internationalRelations: 8.5,
        territorialSovereignty: 9.0,
        institutionalLegacy: 7.0,
        historicalTurningPoint: 9.5,
      },
    },
  },
  {
    name: '辛亥革命',
    input: {
      title: '辛亥革命',
      eventType: '起义',
      location: '全国各省',
      startDate: new Date('1911-10-10'),
      endDate: new Date('1912-02-12'),
      summary: '推翻清朝统治，建立中华民国',
      detail: {
        motive: '推翻满清帝制，建立共和',
        process: '武昌起义后各省纷纷宣布独立',
        result: '清帝退位，中华民国成立',
        impact: '结束了两千多年的封建帝制，民主共和观念深入人心',
      },
      subEventsCount: 20,
      personCount: 10,
      isInternational: false,
      manualDimensionScores: {
        politicalChange: 10.0,
        economicImpact: 7.0,
        militaryScale: 8.0,
        socialStructure: 8.5,
        ideologicalCultural: 8.5,
        internationalRelations: 7.0,
        territorialSovereignty: 5.0,
        institutionalLegacy: 9.0,
        historicalTurningPoint: 10.0,
      },
    },
  },
  {
    name: '《马关条约》',
    input: {
      title: '马关条约',
      eventType: '条约',
      location: '日本马关',
      startDate: new Date('1895-04-17'),
      summary: '甲午战败后与日本签订的不平等条约',
      detail: {
        motive: '甲午战争中国战败，被迫议和',
        process: '李鸿章赴日谈判',
        result: '割让台湾、澎湖及辽东半岛，赔款2亿两白银',
        impact: '大大加深了中国半殖民地化程度，刺激列强瓜分中国',
      },
      subEventsCount: 5,
      personCount: 3,
      isInternational: true,
      manualDimensionScores: {
        politicalChange: 7.0,
        economicImpact: 8.0,
        militaryScale: 4.0,
        socialStructure: 5.5,
        ideologicalCultural: 6.0,
        internationalRelations: 8.5,
        territorialSovereignty: 9.5,
        institutionalLegacy: 6.0,
        historicalTurningPoint: 8.0,
      },
    },
  },
  {
    name: '洋务运动',
    input: {
      title: '洋务运动',
      eventType: '改革',
      location: '全国多地',
      startDate: new Date('1861-01-01'),
      endDate: new Date('1895-01-01'),
      summary: '清朝统治集团的自强求富改革',
      detail: {
        motive: '内忧外患，自强求富',
        process: '创办近代军事工业和民用企业，建立新式海军',
        result: '甲午战败标志洋务运动破产',
        impact: '中国近代化的开端，培养了一批技术人才',
      },
      subEventsCount: 15,
      personCount: 8,
      isInternational: false,
      manualDimensionScores: {
        politicalChange: 5.0,
        economicImpact: 7.5,
        militaryScale: 4.0,
        socialStructure: 5.5,
        ideologicalCultural: 7.0,
        internationalRelations: 4.0,
        territorialSovereignty: 2.0,
        institutionalLegacy: 8.0,
        historicalTurningPoint: 7.0,
      },
    },
  },
  {
    name: '五四运动',
    input: {
      title: '五四运动',
      eventType: '事件',
      location: '北京',
      startDate: new Date('1919-05-04'),
      endDate: new Date('1919-06-28'),
      summary: '反帝反封建的爱国运动',
      detail: {
        motive: '巴黎和会中国外交失败',
        process: '学生罢课、工人罢工、商人罢市',
        result: '拒绝在和约上签字',
        impact: '新民主主义革命的开端，马克思主义广泛传播',
      },
      subEventsCount: 8,
      personCount: 6,
      isInternational: true,
      manualDimensionScores: {
        politicalChange: 7.0,
        economicImpact: 4.0,
        militaryScale: 2.0,
        socialStructure: 7.0,
        ideologicalCultural: 9.5,
        internationalRelations: 7.5,
        territorialSovereignty: 5.0,
        institutionalLegacy: 8.5,
        historicalTurningPoint: 9.0,
      },
    },
  },
  {
    name: '南昌起义',
    input: {
      title: '南昌起义',
      eventType: '起义',
      location: '江西南昌',
      startDate: new Date('1927-08-01'),
      summary: '中国共产党领导的武装起义',
      detail: {
        motive: '反抗国民党反动派的屠杀政策',
        process: '周恩来、贺龙等领导起义军占领南昌城',
        result: '起义成功后撤离南昌',
        impact: '打响了武装反抗国民党反动派的第一枪',
      },
      subEventsCount: 4,
      personCount: 5,
      isInternational: false,
      manualDimensionScores: {
        politicalChange: 7.5,
        economicImpact: 3.0,
        militaryScale: 7.5,
        socialStructure: 4.5,
        ideologicalCultural: 6.0,
        internationalRelations: 3.0,
        territorialSovereignty: 2.5,
        institutionalLegacy: 8.5,
        historicalTurningPoint: 8.5,
      },
    },
  },
  {
    name: '虎门销烟',
    input: {
      title: '虎门销烟',
      eventType: '事件',
      location: '广东虎门',
      startDate: new Date('1839-06-03'),
      endDate: new Date('1839-06-25'),
      summary: '林则徐在虎门集中销毁鸦片',
      detail: {
        motive: '禁烟运动，维护国家主权',
        process: '在虎门海滩当众销毁鸦片237万余斤',
        result: '鸦片全部销毁',
        impact: '显示了中国人民反抗侵略的决心，成为鸦片战争的导火索',
      },
      subEventsCount: 2,
      personCount: 2,
      isInternational: false,
      manualDimensionScores: {
        politicalChange: 4.5,
        economicImpact: 4.0,
        militaryScale: 3.0,
        socialStructure: 4.0,
        ideologicalCultural: 6.0,
        internationalRelations: 5.5,
        territorialSovereignty: 3.5,
        institutionalLegacy: 4.0,
        historicalTurningPoint: 6.5,
      },
    },
  },
  {
    name: '戊戌变法',
    input: {
      title: '戊戌变法',
      eventType: '改革',
      location: '北京',
      startDate: new Date('1898-06-11'),
      endDate: new Date('1898-09-21'),
      summary: '光绪帝支持的变法维新运动',
      detail: {
        motive: '甲午战败后民族危机加深，变法图强',
        process: '颁布变法诏书，涉及政治、经济、军事、文化教育',
        result: '慈禧发动政变，变法失败',
        impact: '虽然失败但起到思想启蒙作用',
      },
      subEventsCount: 10,
      personCount: 6,
      isInternational: false,
      manualDimensionScores: {
        politicalChange: 6.5,
        economicImpact: 4.0,
        militaryScale: 2.0,
        socialStructure: 4.0,
        ideologicalCultural: 8.0,
        internationalRelations: 3.0,
        territorialSovereignty: 2.0,
        institutionalLegacy: 5.5,
        historicalTurningPoint: 6.5,
      },
    },
  },
];

console.log('=== 中国近代史事件影响力因子计算 ===\n');
console.log(
  `${'事件'.padEnd(16)} | ${'政治'.padStart(5)} ${'经济'.padStart(5)} ${'军事'.padStart(5)} ${'社会'.padStart(5)} ${'思想'.padStart(5)} ${'国际'.padStart(5)} ${'领土'.padStart(5)} ${'制度'.padStart(5)} ${'转折'.padStart(5)} | ${'加权'.padStart(5)} ${'范围'.padStart(5)} ${'持续'.padStart(5)} | ${'最终'.padStart(5)}`,
);
console.log('-'.repeat(140));

const calculator = new ImpactFactorCalculator();

for (const t of testEvents) {
  const breakdown = calculator.calculate(t.input);
  const d = breakdown.dimensions;

  console.log(
    `${t.name.padEnd(16)} | ` +
    `${d.politicalChange.score.toFixed(1).padStart(5)} ` +
    `${d.economicImpact.score.toFixed(1).padStart(5)} ` +
    `${d.militaryScale.score.toFixed(1).padStart(5)} ` +
    `${d.socialStructure.score.toFixed(1).padStart(5)} ` +
    `${d.ideologicalCultural.score.toFixed(1).padStart(5)} ` +
    `${d.internationalRelations.score.toFixed(1).padStart(5)} ` +
    `${d.territorialSovereignty.score.toFixed(1).padStart(5)} ` +
    `${d.institutionalLegacy.score.toFixed(1).padStart(5)} ` +
    `${d.historicalTurningPoint.score.toFixed(1).padStart(5)} | ` +
    `${breakdown.weightedSum.toFixed(0).padStart(3)}/100 ` +
    `${('+' + breakdown.scopeBonus).padStart(5)} ` +
    `${('+' + breakdown.durationBonus).padStart(5)} | ` +
    `${breakdown.finalScore.toFixed(0).padStart(3)}/100`,
  );
}

console.log('\n=== 详细输出示例（辛亥革命） ===\n');
const xhBreakdown = calculator.calculate(testEvents[1].input);
console.log(JSON.stringify({
  dimensions: Object.fromEntries(
    Object.entries(xhBreakdown.dimensions).map(([k, v]) => [k, { score: v.score, rationale: v.rationale }])
  ),
  weightedSum: xhBreakdown.weightedSum,
  scopeBonus: xhBreakdown.scopeBonus,
  durationBonus: xhBreakdown.durationBonus,
  finalScore: xhBreakdown.finalScore,
}, null, 2));
