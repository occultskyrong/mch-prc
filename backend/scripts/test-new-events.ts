import { calculateImpact, ImpactFactorCalculator } from '../src/common/impact-factor';

const testEvents = [
  {
    name: '卢沟桥事变',
    input: {
      title: '卢沟桥事变',
      eventType: '事件',
      location: '北平卢沟桥',
      startDate: new Date('1937-07-07'),
      summary: '日军炮轰宛平城，中国守军奋起抵抗',
      detail: {
        motive: '日军借口士兵失踪，要求进入宛平城搜查',
        process: '日军炮轰宛平城，中国守军第29军奋起抵抗',
        result: '北平、天津相继沦陷',
        impact: '标志着中国全面抗战的爆发',
      },
      subEventsCount: 3,
      personCount: 4,
      isInternational: false,
      manualDimensionScores: {
        politicalChange: 7.5,       // 革命史观：促成国共合作，政治格局变化
        economicImpact: 6.0,        // 现代化史观：战区经济遭破坏
        militaryScale: 7.0,         // 全面战争的导火索，但事件本身是局部冲突
        socialStructure: 5.5,       // 社会史观：引发难民潮，但社会结构变化是长期抗战结果
        ideologicalCultural: 6.5,   // 民族意识觉醒的催化剂
        internationalRelations: 6.0,// 全球史观：亚洲全面战场的起点，但当天国际反应有限
        territorialSovereignty: 7.5,// 华北沦陷，主权严重受损
        institutionalLegacy: 5.5,   // 作为历史纪念符号，每年纪念
        historicalTurningPoint: 8.5,// 开启全面抗战时代
      },
    },
  },
  {
    name: '抗日战争',
    input: {
      title: '抗日战争',
      eventType: '战争',
      location: '全国各省',
      startDate: new Date('1937-07-07'),
      endDate: new Date('1945-09-02'),
      summary: '中国人民反抗日本侵略的全国性战争',
      detail: {
        motive: '日本帝国主义全面侵华，民族危机空前严重',
        process: '正面战场和敌后战场相互配合，历经战略防御、相持、反攻三个阶段',
        result: '日本无条件投降，中国取得抗战胜利',
        impact: '近代以来中国反抗外敌入侵的第一次完全胜利，国际地位显著提高',
      },
      subEventsCount: 50,
      personCount: 20,
      isInternational: true,
      manualDimensionScores: {
        politicalChange: 9.0,       // 革命史观：为新中国建立奠定基础
        economicImpact: 8.5,        // 现代化史观：经济遭受巨大破坏，战后重建
        militaryScale: 10.0,        // 全国性大规模战争，决定国家命运
        socialStructure: 8.0,       // 社会史观：3500万伤亡，人口大规模内迁
        ideologicalCultural: 8.5,   // 民族意识、爱国主义空前高涨
        internationalRelations: 9.0,// 全球史观：世界反法西斯战争东方主战场，大国地位确立
        territorialSovereignty: 9.5,// 收复失地，主权恢复
        institutionalLegacy: 8.5,   // 抗战精神延续至今
        historicalTurningPoint: 10.0,// 时代根本分水岭
      },
    },
  },
  {
    name: '东北易帜',
    input: {
      title: '东北易帜',
      eventType: '事件',
      location: '东北多省',
      startDate: new Date('1928-12-29'),
      summary: '张学良宣布东北服从南京国民政府',
      detail: {
        motive: '张作霖被炸死后，张学良面临日本压力和国内统一潮流',
        process: '张学良通电全国，宣布服从国民政府，改易旗帜',
        result: '东北归属国民政府，中国在形式上完成统一',
        impact: '标志着北洋政府统治结束，国民政府形式上统一全国',
      },
      subEventsCount: 2,
      personCount: 3,
      isInternational: false,
      manualDimensionScores: {
        politicalChange: 8.0,       // 革命史观：结束17年军阀割据，形式统一全国
        economicImpact: 2.0,        // 现代化史观：经济影响极小
        militaryScale: 2.5,         // 和平易帜，无军事冲突
        socialStructure: 3.0,       // 社会史观：政权更迭但基层未变
        ideologicalCultural: 4.5,   // 国家统一观念有所强化
        internationalRelations: 2.0,// 全球史观：纯内政事件
        territorialSovereignty: 6.5,// 东北主权归属国民政府
        institutionalLegacy: 6.0,   // 形式统一格局的历史意义
        historicalTurningPoint: 7.5,// 革命史观：北伐收官，旧民主主义革命收尾
      },
    },
  },
];

console.log('=== 中国近代史事件影响力因子计算 ===\n');
console.log(
  `${'事件'.padEnd(16)} | ${'政治'.padStart(5)} ${'经济'.padStart(5)} ${'军事'.padStart(5)} ${'社会'.padStart(5)} ${'思想'.padStart(5)} ${'国际'.padStart(5)} ${'领土'.padStart(5)} ${'制度'.padStart(5)} ${'转折'.padStart(5)} | ${'基础'.padStart(7)} ${'范围'.padStart(5)} ${'持续'.padStart(5)} | ${'最终'.padStart(7)}`,
);
console.log('-'.repeat(150));

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
    `${breakdown.weightedSum.toFixed(0).padStart(7)} ` +
    `${('+' + breakdown.scopeBonus).padStart(5)} ` +
    `${('+' + breakdown.durationBonus).padStart(5)} | ` +
    `${breakdown.finalScore.toFixed(0).padStart(5)}/100`,
  );
}

console.log('\n=== 详细输出 ===\n');

for (const t of testEvents) {
  const breakdown = calculator.calculate(t.input);
  const d = breakdown.dimensions;

  console.log(`【${t.name}】`);
  console.log(`  基础分: ${breakdown.weightedSum.toFixed(1)} | 范围加成 +${breakdown.scopeBonus} | 持续加成 +${breakdown.durationBonus} | 最终: ${breakdown.finalScore}/100`);
  console.log('');
  console.log('  各维度评分:');
  console.log(`    政治变革:         ${d.politicalChange.score.toFixed(1)}/10  ${d.politicalChange.rationale}`);
  console.log(`    经济影响:         ${d.economicImpact.score.toFixed(1)}/10  ${d.economicImpact.rationale}`);
  console.log(`    军事规模:         ${d.militaryScale.score.toFixed(1)}/10  ${d.militaryScale.rationale}`);
  console.log(`    社会结构:         ${d.socialStructure.score.toFixed(1)}/10  ${d.socialStructure.rationale}`);
  console.log(`    思想文化:         ${d.ideologicalCultural.score.toFixed(1)}/10  ${d.ideologicalCultural.rationale}`);
  console.log(`    国际关系:         ${d.internationalRelations.score.toFixed(1)}/10  ${d.internationalRelations.rationale}`);
  console.log(`    领土主权:         ${d.territorialSovereignty.score.toFixed(1)}/10  ${d.territorialSovereignty.rationale}`);
  console.log(`    制度遗产:         ${d.institutionalLegacy.score.toFixed(1)}/10  ${d.institutionalLegacy.rationale}`);
  console.log(`    历史转折:         ${d.historicalTurningPoint.score.toFixed(1)}/10  ${d.historicalTurningPoint.rationale}`);
  console.log('');

  // Top 3 dimensions
  const dimLabels: Record<string, string> = {
    politicalChange: '政治变革', economicImpact: '经济影响', militaryScale: '军事规模',
    socialStructure: '社会结构', ideologicalCultural: '思想文化', internationalRelations: '国际关系',
    territorialSovereignty: '领土主权', institutionalLegacy: '制度遗产', historicalTurningPoint: '历史转折',
  };
  const sorted = Object.entries(breakdown.dimensions)
    .map(([key, val]) => ({ label: dimLabels[key], score: val.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  console.log(`  最高维度: ${sorted.map(s => `${s.label}(${s.score.toFixed(1)})`).join('、')}`);
  console.log('─'.repeat(80));
  console.log('');
}
