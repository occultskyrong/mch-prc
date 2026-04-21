// ==================== Impact Factor Algorithm ====================
// 完整实现：9维度加权 × 范围乘数 × 持续时间乘数
// 理论基础：革命史观 + 现代化史观 + 全球史观 + 社会史观 + 唯物史观

export interface DimensionScore {
  score: number;       // 1-10 分
  rationale: string;   // 评分依据
}

export interface ImpactBreakdown {
  dimensions: {
    politicalChange: DimensionScore;
    economicImpact: DimensionScore;
    militaryScale: DimensionScore;
    socialStructure: DimensionScore;
    ideologicalCultural: DimensionScore;
    internationalRelations: DimensionScore;
    territorialSovereignty: DimensionScore;
    institutionalLegacy: DimensionScore;
    historicalTurningPoint: DimensionScore;
  };
  weightedSum: number;
  scopeBonus: number;
  durationBonus: number;
  finalScore: number;
}

export interface EventInput {
  title: string;
  eventType: number;
  eventLevel?: number;
  location: string;
  startDate: Date;
  endDate?: Date;
  summary?: string;
  detail?: { motive?: string; process?: string; result?: string; impact?: string };
  subEventsCount?: number;
  personCount?: number;
  isInternational?: boolean;
  /** 如果已有手动评分，可直接传入 */
  manualDimensionScores?: Partial<Record<keyof ImpactBreakdown['dimensions'], number>>;
}

// ==================== 权重常量 ====================

export const DIMENSION_WEIGHTS = {
  politicalChange:     0.20,
  economicImpact:      0.15,
  militaryScale:       0.12,
  socialStructure:     0.12,
  ideologicalCultural: 0.10,
  internationalRelations: 0.10,
  territorialSovereignty: 0.08,
  institutionalLegacy: 0.08,
  historicalTurningPoint: 0.05,
} as const;

// 总和 = 1.0

// ==================== 评分标准定义 ====================

interface ScoringCriteria {
  level10: string;
  level9: string;
  level8: string;
  level7: string;
  level6: string;
  level5: string;
  level4: string;
  level3: string;
  level2: string;
  level1: string;
}

// 9 个维度的完整评分标准

export const SCORING_CRITERIA: Record<string, ScoringCriteria> = {
  politicalChange: {
    level10: '彻底政权更迭，建立全新政治体制',
    level9: '政权被推翻或建立，政体根本变革',
    level8: '重大政治改革，制度层面深刻变化',
    level7: '重要政治运动或变革，影响深远',
    level6: '政策重大调整，中层制度改革',
    level5: '政策明显变化，影响较大范围',
    level4: '一般性政治变动，影响有限',
    level3: '局部人事或政策调整',
    level2: '微小政治事件，影响面窄',
    level1: '无显著政治影响',
  },
  economicImpact: {
    level10: '经济结构根本转型（自然经济解体等）',
    level9: '经济体制重大变革（税制/货币/贸易根本变化）',
    level8: '经济格局深刻变化（新兴产业兴起/经济主权丧失）',
    level7: '重大经济变动（大规模工业化/经济条约签订）',
    level6: '经济显著变化（关税/通商政策重大调整）',
    level5: '经济中等变化（特定行业发展）',
    level4: '经济局部变化（区域经济受影响）',
    level3: '经济轻微变化',
    level2: '经济影响甚微',
    level1: '无经济影响',
  },
  militaryScale: {
    level10: '全国性大规模战争，决定国家命运',
    level9: '重大战争或战役，决定战争走向',
    level8: '重要战役，战略意义深远',
    level7: '较大规模军事冲突或起义',
    level6: '中等规模军事行动',
    level5: '局部武装冲突或军事改革',
    level4: '小规模军事摩擦',
    level3: '零星武装事件',
    level2: '军事影响极小',
    level1: '无军事层面',
  },
  socialStructure: {
    level10: '社会阶级/阶层根本重构',
    level9: '社会结构深刻变化（新阶级产生）',
    level8: '社会制度重大变化（废科举/改户籍等）',
    level7: '社会风气/结构显著变化',
    level6: '社会层面中等变化（人口大规模流动）',
    level5: '社会局部变化',
    level4: '社会影响有限',
    level3: '社会轻微影响',
    level2: '社会影响甚微',
    level1: '无社会影响',
  },
  ideologicalCultural: {
    level10: '思想范式根本转换（启蒙运动/新文化运动）',
    level9: '新思想体系确立，深远影响',
    level8: '重大思想运动，影响一代人',
    level7: '重要思想传播或论战',
    level6: '文化/教育重大变化',
    level5: '思想文化中等变化',
    level4: '局部文化思想变化',
    level3: '轻微文化影响',
    level2: '文化影响甚微',
    level1: '无思想文化影响',
  },
  internationalRelations: {
    level10: '世界格局根本改变（大国地位确立/丧失）',
    level9: '国际秩序重大变化（多边条约/联盟重组）',
    level8: '重大外交转折（建交/断交/重大条约）',
    level7: '国际关系显著变化',
    level6: '外交政策重大调整',
    level5: '国际关系中等变化',
    level4: '局部外交事件',
    level3: '外交轻微事件',
    level2: '外交影响甚微',
    level1: '无国际关系影响',
  },
  territorialSovereignty: {
    level10: '大片领土割让或收复，主权根本变化',
    level9: '重要领土变更（割地/租借/收回）',
    level8: '主权重大受损或恢复',
    level7: '领土/主权重要变化',
    level6: '边界/主权中等变化',
    level5: '局部领土/主权问题',
    level4: '领土主权轻微变化',
    level3: '领土主权影响有限',
    level2: '领土主权影响甚微',
    level1: '无领土主权影响',
  },
  institutionalLegacy: {
    level10: '制度延续至今，成为国家基石',
    level9: '制度影响超50年，深远历史意义',
    level8: '制度影响30-50年',
    level7: '制度影响20-30年',
    level6: '制度影响10-20年',
    level5: '制度影响5-10年',
    level4: '制度影响3-5年',
    level3: '制度影响1-3年',
    level2: '制度影响不足1年',
    level1: '无制度遗产',
  },
  historicalTurningPoint: {
    level10: '时代根本分水岭，历史进程完全改变',
    level9: '重大历史转折点，开启新阶段',
    level8: '重要历史转折，影响历史走向',
    level7: '历史重要节点',
    level6: '历史阶段内重要事件',
    level5: '历史阶段内一般事件',
    level4: '历史阶段内小事件',
    level3: '历史进程中微不足道的节点',
    level2: '几乎不影响历史走向',
    level1: '无转折意义',
  },
};

// ==================== 范围加成 ====================
// 范围加成：在基础分上加分，非乘法

export const SCOPE_BONUSES = {
  nationwide:   { value: 40,  label: '全国性 +40' },
  multiRegion:  { value: 20,  label: '多省区域 +20' },
  regional:     { value: 0,   label: '局部地区 +0' },
} as const;

// ==================== 持续加成 ====================

export const DURATION_BONUSES = {
  longTerm:   { value: 30, label: '影响 > 50年 +30' },
  midTerm:    { value: 10, label: '影响 20-50年 +10' },
  shortTerm:  { value: 0,  label: '影响 < 20年 +0' },
} as const;

// ==================== 事件类型基准 ====================
// eventType 数字映射: 1=战争, 2=条约, 3=起义, 4=改革, 5=事件

export const EVENT_TYPE_BASELINES: Record<number, Record<string, number>> = {
  1: { // 战争
    politicalChange: 7.5,
    economicImpact: 6.5,
    militaryScale: 9.5,
    socialStructure: 6.5,
    ideologicalCultural: 5.5,
    internationalRelations: 7.0,
    territorialSovereignty: 7.0,
    institutionalLegacy: 6.0,
    historicalTurningPoint: 7.5,
  },
  2: { // 条约
    politicalChange: 5.5,
    economicImpact: 6.5,
    militaryScale: 3.0,
    socialStructure: 5.0,
    ideologicalCultural: 5.0,
    internationalRelations: 7.5,
    territorialSovereignty: 8.0,
    institutionalLegacy: 6.5,
    historicalTurningPoint: 6.5,
  },
  3: { // 起义
    politicalChange: 7.0,
    economicImpact: 4.5,
    militaryScale: 7.5,
    socialStructure: 5.5,
    ideologicalCultural: 6.0,
    internationalRelations: 4.0,
    territorialSovereignty: 3.5,
    institutionalLegacy: 5.5,
    historicalTurningPoint: 7.0,
  },
  4: { // 改革
    politicalChange: 6.5,
    economicImpact: 7.0,
    militaryScale: 3.0,
    socialStructure: 6.5,
    ideologicalCultural: 6.5,
    internationalRelations: 4.5,
    territorialSovereignty: 2.5,
    institutionalLegacy: 7.5,
    historicalTurningPoint: 6.0,
  },
  5: { // 事件
    politicalChange: 3.0,
    economicImpact: 2.0,
    militaryScale: 2.0,
    socialStructure: 2.5,
    ideologicalCultural: 2.5,
    internationalRelations: 2.0,
    territorialSovereignty: 2.0,
    institutionalLegacy: 2.5,
    historicalTurningPoint: 2.5,
  },
};

// ==================== 范围判断规则 ====================

function detectScope(location: string): keyof typeof SCOPE_BONUSES {
  // 国际性不等于全国性——国际性影响的是"国际关系"维度，范围看地理影响面
  // 全国性需要明确的地理覆盖或多中心特征

  // 明确的全国性表述（多个地理实体或明确"全国"指向行动覆盖）
  const nationwidePatterns = [
    '全国', '各省', '南北', '多省',
    // 长江/沿海/沿江本身是跨区域的线性地理特征
    '长江', '沿海', '沿江',
  ];
  for (const kw of nationwidePatterns) {
    if (location.includes(kw)) {
      // "全国各地"是通用描述词，不是实际覆盖范围
      if (location === '全国各地') continue;
      return 'multiRegion';
    }
  }

  // 多个地点组合 → 全国性（如"北京、上海"）
  if (location.includes('、')) return 'nationwide';

  // 单个城市/地点 → 局部地区
  return 'regional';
}

// ==================== 持续时间判断 ====================

function detectDuration(startDate: Date, endDate?: Date, institutionalLegacyScore = 1): keyof typeof DURATION_BONUSES {
  if (endDate) {
    const yearsDiff = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsDiff >= 3) return 'longTerm';
    if (yearsDiff >= 1) return 'midTerm';
  }

  if (institutionalLegacyScore >= 8) return 'longTerm';
  if (institutionalLegacyScore >= 6) return 'midTerm';
  return 'shortTerm';
}

// ==================== 核心算法 ====================

export class ImpactFactorCalculator {
  /**
   * 计算事件影响力因子
   * @returns ImpactBreakdown 包含完整评分明细
   */
  calculate(event: EventInput): ImpactBreakdown {
    // Step 1: 计算 9 个维度分数
    const dimensions = this.__calculateDimensions(event);

    // Step 2: 加权求和 → 千分制
    // 映射: 1-10 → 180-900 (×80 + 100)，给范围/持续加成留出 100 分空间
    const baseScore = this.__weightedSum(dimensions) * 80 + 100;

    // Step 3: 范围加成
    const scope = detectScope(event.location);
    const scopeBonus = SCOPE_BONUSES[scope].value;

    // Step 4: 持续加成
    const instScore = dimensions.institutionalLegacy.score;
    const duration = detectDuration(event.startDate, event.endDate, instScore);
    const durationBonus = DURATION_BONUSES[duration].value;

    // Step 5: 千分制分数 = 基础分 + 范围加成 + 持续加成，上限 1000
    const finalScore = Math.min(1000, Math.round(baseScore + scopeBonus + durationBonus));

    return {
      dimensions,
      weightedSum: Math.round(baseScore * 100) / 100,
      scopeBonus,
      durationBonus,
      finalScore,
    };
  }

  /**
   * 计算 9 个维度分数
   */
  private __calculateDimensions(event: EventInput): ImpactBreakdown['dimensions'] {
    const baselines = EVENT_TYPE_BASELINES[event.eventType] ?? EVENT_TYPE_BASELINES[5];
    const hasManual = Object.keys(event.manualDimensionScores ?? {}).length > 0;

    const entries: [keyof ImpactBreakdown['dimensions'], number][] = [
      ['politicalChange', baselines.politicalChange],
      ['economicImpact', baselines.economicImpact],
      ['militaryScale', baselines.militaryScale],
      ['socialStructure', baselines.socialStructure],
      ['ideologicalCultural', baselines.ideologicalCultural],
      ['internationalRelations', baselines.internationalRelations],
      ['territorialSovereignty', baselines.territorialSovereignty],
      ['institutionalLegacy', baselines.institutionalLegacy],
      ['historicalTurningPoint', baselines.historicalTurningPoint],
    ];

    const result: Record<string, DimensionScore> = {};
    for (const [key, base] of entries) {
      // 优先使用手动评分
      let score = event.manualDimensionScores?.[key] ?? base;

      // 规则修正仅在使用基线分时生效（手动评分视为已包含所有修正）
      if (!hasManual) {
        score = this.__adjustScore(key, score, event);
      }

      score = Math.max(1, Math.min(10, score));

      const criteria = SCORING_CRITERIA[key];
      const rationale = this.__getRationale(criteria, score);

      result[key] = { score: Math.round(score * 10) / 10, rationale };
    }

    return result as ImpactBreakdown['dimensions'];
  }

  /**
   * 根据事件特征修正分数
   */
  private __adjustScore(
    dimension: string,
    base: number,
    event: EventInput,
  ): number {
    let score = base;

    // 子事件数量 → 复杂度加成（仅主事件有）
    const subCount = event.subEventsCount ?? 0;
    if (subCount > 0) {
      const complexityBonus = Math.min(subCount * 0.08, 0.5);
      score += complexityBonus;
    }

    // 关联人物数量 → 参与度加成
    const personCount = event.personCount ?? 0;
    if (personCount > 0) {
      const participationBonus = Math.min(personCount * 0.04, 0.3);
      if (['politicalChange', 'socialStructure', 'ideologicalCultural', 'historicalTurningPoint'].includes(dimension)) {
        score += participationBonus;
      }
    }

    // 国际性加成
    if (event.isInternational) {
      if (['internationalRelations', 'economicImpact', 'politicalChange', 'territorialSovereignty'].includes(dimension)) {
        score += 0.2;
      }
    }

    // detail 内容存在性加成
    if (event.detail) {
      let detailCount = 0;
      if (event.detail.motive) detailCount++;
      if (event.detail.process) detailCount++;
      if (event.detail.result) detailCount++;
      if (event.detail.impact) detailCount++;

      if (detailCount >= 3) {
        score += 0.15;
      } else if (detailCount >= 2) {
        score += 0.08;
      }
    }

    return score;
  }

  /**
   * 获取评分文字依据
   */
  private __getRationale(criteria: ScoringCriteria, score: number): string {
    const rounded = Math.round(score);
    const levelKey = `level${Math.max(1, Math.min(10, rounded))}` as keyof ScoringCriteria;
    return criteria[levelKey];
  }

  /**
   * 加权求和
   */
  private __weightedSum(dimensions: ImpactBreakdown['dimensions']): number {
    const weights = DIMENSION_WEIGHTS;
    return (
      dimensions.politicalChange.score * weights.politicalChange +
      dimensions.economicImpact.score * weights.economicImpact +
      dimensions.militaryScale.score * weights.militaryScale +
      dimensions.socialStructure.score * weights.socialStructure +
      dimensions.ideologicalCultural.score * weights.ideologicalCultural +
      dimensions.internationalRelations.score * weights.internationalRelations +
      dimensions.territorialSovereignty.score * weights.territorialSovereignty +
      dimensions.institutionalLegacy.score * weights.institutionalLegacy +
      dimensions.historicalTurningPoint.score * weights.historicalTurningPoint
    );
  }

  /**
   * 将结果格式化为可读描述
   */
  formatDescription(breakdown: ImpactBreakdown): string {
    const parts: string[] = [];
    const dimLabels: Record<string, string> = {
      politicalChange: '政治变革',
      economicImpact: '经济影响',
      militaryScale: '军事规模',
      socialStructure: '社会结构',
      ideologicalCultural: '思想文化',
      internationalRelations: '国际关系',
      territorialSovereignty: '领土主权',
      institutionalLegacy: '制度遗产',
      historicalTurningPoint: '历史转折',
    };

    // 找出最高分的三个维度
    const sorted = Object.entries(breakdown.dimensions)
      .map(([key, val]) => ({ key, score: val.score, label: dimLabels[key] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    parts.push(`影响力因子: ${breakdown.finalScore}/1000`);
    parts.push(`主要维度: ${sorted.map(s => `${s.label}(${s.score})`).join('、')}`);
    parts.push(`基础分: ${breakdown.weightedSum.toFixed(0)}/1000`);
    parts.push(`范围: ${Object.values(SCOPE_BONUSES).find(m => m.value === breakdown.scopeBonus)?.label ?? ''}`);
    parts.push(`持续: ${Object.values(DURATION_BONUSES).find(m => m.value === breakdown.durationBonus)?.label ?? ''}`);

    return parts.join(' | ');
  }
}

// ==================== 便捷函数 ====================

export function calculateImpact(event: EventInput): ImpactBreakdown {
  return new ImpactFactorCalculator().calculate(event);
}
