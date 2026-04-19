// 史观影响力因子算法 (HPIF) — 前端工具
// 从 backend/src/common/impact-factor.ts 移植

export interface DimensionScore {
  score: number;
  rationale: string;
}

export interface ImpactBreakdown {
  dimensions: Record<string, DimensionScore>;
  weightedSum: number;
  scopeBonus: number;
  durationBonus: number;
  finalScore: number;
}

const DIMENSION_WEIGHTS: Record<string, number> = {
  politicalChange: 0.20,
  economicImpact: 0.15,
  militaryScale: 0.12,
  socialStructure: 0.12,
  ideologicalCultural: 0.10,
  internationalRelations: 0.10,
  territorialSovereignty: 0.08,
  institutionalLegacy: 0.08,
  historicalTurningPoint: 0.05,
};

const EVENT_TYPE_BASELINES: Record<string, Record<string, number>> = {
  '战争': { politicalChange: 7.5, economicImpact: 6.5, militaryScale: 9.5, socialStructure: 6.5, ideologicalCultural: 5.5, internationalRelations: 7.0, territorialSovereignty: 7.0, institutionalLegacy: 6.0, historicalTurningPoint: 7.5 },
  '条约': { politicalChange: 5.5, economicImpact: 6.5, militaryScale: 3.0, socialStructure: 5.0, ideologicalCultural: 5.0, internationalRelations: 7.5, territorialSovereignty: 8.0, institutionalLegacy: 6.5, historicalTurningPoint: 6.5 },
  '起义': { politicalChange: 7.0, economicImpact: 4.5, militaryScale: 7.5, socialStructure: 5.5, ideologicalCultural: 6.0, internationalRelations: 4.0, territorialSovereignty: 3.5, institutionalLegacy: 5.5, historicalTurningPoint: 7.0 },
  '改革': { politicalChange: 6.5, economicImpact: 7.0, militaryScale: 3.0, socialStructure: 6.5, ideologicalCultural: 6.5, internationalRelations: 4.5, territorialSovereignty: 2.5, institutionalLegacy: 7.5, historicalTurningPoint: 6.0 },
  '事件': { politicalChange: 3.0, economicImpact: 2.0, militaryScale: 2.0, socialStructure: 2.5, ideologicalCultural: 2.5, internationalRelations: 2.0, territorialSovereignty: 2.0, institutionalLegacy: 2.5, historicalTurningPoint: 2.5 },
};

const SCORING_CRITERIA: Record<string, Record<string, string>> = {
  politicalChange: {
    level10: '彻底政权更迭，建立全新政治体制', level9: '政权被推翻或建立，政体根本变革',
    level8: '重大政治改革，制度层面深刻变化', level7: '重要政治运动或变革，影响深远',
    level6: '政策重大调整，中层制度改革', level5: '政策明显变化，影响较大范围',
    level4: '一般性政治变动，影响有限', level3: '局部人事或政策调整',
    level2: '微小政治事件，影响面窄', level1: '无显著政治影响',
  },
  economicImpact: {
    level10: '经济结构根本转型', level9: '经济体制重大变革',
    level8: '经济格局深刻变化', level7: '重大经济变动',
    level6: '经济显著变化', level5: '经济中等变化',
    level4: '经济局部变化', level3: '经济轻微变化',
    level2: '经济影响甚微', level1: '无经济影响',
  },
  militaryScale: {
    level10: '全国性大规模战争，决定国家命运', level9: '重大战争或战役，决定战争走向',
    level8: '重要战役，战略意义深远', level7: '较大规模军事冲突或起义',
    level6: '中等规模军事行动', level5: '局部武装冲突或军事改革',
    level4: '小规模军事摩擦', level3: '零星武装事件',
    level2: '军事影响极小', level1: '无军事层面',
  },
  socialStructure: {
    level10: '社会阶级/阶层根本重构', level9: '社会结构深刻变化',
    level8: '社会制度重大变化', level7: '社会风气/结构显著变化',
    level6: '社会层面中等变化', level5: '社会局部变化',
    level4: '社会影响有限', level3: '社会轻微影响',
    level2: '社会影响甚微', level1: '无社会影响',
  },
  ideologicalCultural: {
    level10: '思想范式根本转换', level9: '新思想体系确立，深远影响',
    level8: '重大思想运动，影响一代人', level7: '重要思想传播或论战',
    level6: '文化/教育重大变化', level5: '思想文化中等变化',
    level4: '局部文化思想变化', level3: '轻微文化影响',
    level2: '文化影响甚微', level1: '无思想文化影响',
  },
  internationalRelations: {
    level10: '世界格局根本改变', level9: '国际秩序重大变化',
    level8: '重大外交转折', level7: '国际关系显著变化',
    level6: '外交政策重大调整', level5: '国际关系中等变化',
    level4: '局部外交事件', level3: '外交轻微事件',
    level2: '外交影响甚微', level1: '无国际关系影响',
  },
  territorialSovereignty: {
    level10: '大片领土割让或收复，主权根本变化', level9: '重要领土变更',
    level8: '主权重大受损或恢复', level7: '领土/主权重要变化',
    level6: '边界/主权中等变化', level5: '局部领土/主权问题',
    level4: '领土主权轻微变化', level3: '领土主权影响有限',
    level2: '领土主权影响甚微', level1: '无领土主权影响',
  },
  institutionalLegacy: {
    level10: '制度延续至今，成为国家基石', level9: '制度影响超50年',
    level8: '制度影响30-50年', level7: '制度影响20-30年',
    level6: '制度影响10-20年', level5: '制度影响5-10年',
    level4: '制度影响3-5年', level3: '制度影响1-3年',
    level2: '制度影响不足1年', level1: '无制度遗产',
  },
  historicalTurningPoint: {
    level10: '时代根本分水岭，历史进程完全改变', level9: '重大历史转折点',
    level8: '重要历史转折，影响历史走向', level7: '历史重要节点',
    level6: '历史阶段内重要事件', level5: '历史阶段内一般事件',
    level4: '历史阶段内小事件', level3: '历史进程中微不足道的节点',
    level2: '几乎不影响历史走向', level1: '无转折意义',
  },
};

const DIMENSION_LABELS: Record<string, string> = {
  politicalChange: '政治变革', economicImpact: '经济影响', militaryScale: '军事规模',
  socialStructure: '社会结构', ideologicalCultural: '思想文化', internationalRelations: '国际关系',
  territorialSovereignty: '领土主权', institutionalLegacy: '制度遗产', historicalTurningPoint: '历史转折',
};

function detectScope(location: string): string {
  const nationwidePatterns = ['全国', '各省', '南北', '多省', '长江', '沿海', '沿江'];
  for (const kw of nationwidePatterns) {
    if (location.includes(kw)) {
      if (location === '全国各地') continue;
      return 'multiRegion';
    }
  }
  if (location.includes('、')) return 'nationwide';
  return 'regional';
}

function detectDuration(startDate: string, endDate?: string | null, institutionalLegacyScore = 1): string {
  if (endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const yearsDiff = (end - start) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsDiff >= 3) return 'longTerm';
    if (yearsDiff >= 1) return 'midTerm';
  }
  if (institutionalLegacyScore >= 8) return 'longTerm';
  if (institutionalLegacyScore >= 6) return 'midTerm';
  return 'shortTerm';
}

function getScopeBonus(scope: string): number {
  if (scope === 'nationwide') return 40;
  if (scope === 'multiRegion') return 20;
  return 0;
}

function getDurationBonus(duration: string): number {
  if (duration === 'longTerm') return 30;
  if (duration === 'midTerm') return 10;
  return 0;
}

function getRationale(criteria: Record<string, string>, score: number): string {
  const rounded = Math.round(score);
  const levelKey = `level${Math.max(1, Math.min(10, rounded))}`;
  return criteria[levelKey] || '';
}

function adjustScore(dimension: string, base: number, event: any): number {
  let score = base;
  const subCount = event.subEvents?.length || 0;
  if (subCount > 0) score += Math.min(subCount * 0.08, 0.5);

  const personCount = event.personIds?.length || 0;
  if (personCount > 0 && ['politicalChange', 'socialStructure', 'ideologicalCultural', 'historicalTurningPoint'].includes(dimension)) {
    score += Math.min(personCount * 0.04, 0.3);
  }

  if (event.isInternational && ['internationalRelations', 'economicImpact', 'politicalChange', 'territorialSovereignty'].includes(dimension)) {
    score += 0.2;
  }

  if (event.detail) {
    let detailCount = 0;
    if (event.detail.motive) detailCount++;
    if (event.detail.process) detailCount++;
    if (event.detail.result) detailCount++;
    if (event.detail.impact) detailCount++;
    if (detailCount >= 3) score += 0.15;
    else if (detailCount >= 2) score += 0.08;
  }

  return score;
}

function weightedSum(dimensions: Record<string, DimensionScore>): number {
  return (
    dimensions.politicalChange.score * DIMENSION_WEIGHTS.politicalChange +
    dimensions.economicImpact.score * DIMENSION_WEIGHTS.economicImpact +
    dimensions.militaryScale.score * DIMENSION_WEIGHTS.militaryScale +
    dimensions.socialStructure.score * DIMENSION_WEIGHTS.socialStructure +
    dimensions.ideologicalCultural.score * DIMENSION_WEIGHTS.ideologicalCultural +
    dimensions.internationalRelations.score * DIMENSION_WEIGHTS.internationalRelations +
    dimensions.territorialSovereignty.score * DIMENSION_WEIGHTS.territorialSovereignty +
    dimensions.institutionalLegacy.score * DIMENSION_WEIGHTS.institutionalLegacy +
    dimensions.historicalTurningPoint.score * DIMENSION_WEIGHTS.historicalTurningPoint
  );
}

function calculateDimensions(event: any): Record<string, DimensionScore> {
  const baselines = EVENT_TYPE_BASELINES[event.eventType] ?? EVENT_TYPE_BASELINES['事件'];
  const dimensionKeys = ['politicalChange', 'economicImpact', 'militaryScale', 'socialStructure', 'ideologicalCultural', 'internationalRelations', 'territorialSovereignty', 'institutionalLegacy', 'historicalTurningPoint'];

  const result: Record<string, DimensionScore> = {};
  for (const key of dimensionKeys) {
    let score = event.manualDimensionScores?.[key] ?? baselines[key];
    if (!event.manualDimensionScores || Object.keys(event.manualDimensionScores).length === 0) {
      score = adjustScore(key, score, event);
    }
    score = Math.max(1, Math.min(10, score));
    const criteria = SCORING_CRITERIA[key];
    result[key] = { score: Math.round(score * 10) / 10, rationale: getRationale(criteria, score) };
  }
  return result;
}

/**
 * 计算事件影响力因子
 */
export function calculateImpact(event: any): ImpactBreakdown {
  const dimensions = calculateDimensions(event);
  const baseScore = weightedSum(dimensions) * 80 + 100;

  const scope = detectScope(event.location || '');
  const scopeBonus = getScopeBonus(scope);

  const instScore = dimensions.institutionalLegacy.score;
  const duration = detectDuration(event.startDate, event.endDate, instScore);
  const durationBonus = getDurationBonus(duration);

  const finalScore = Math.min(1000, Math.round(baseScore + scopeBonus + durationBonus));

  return { dimensions, weightedSum: Math.round(baseScore * 100) / 100, scopeBonus, durationBonus, finalScore };
}

export { DIMENSION_LABELS, SCORING_CRITERIA, DIMENSION_WEIGHTS };
