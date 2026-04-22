// ==================== Impact Factor Algorithm V2 ====================
// 百分制直接放大：每个维度 0-100 分 × 权重 = 该维度贡献分
// 9 维度直接相加 = 最终分数 (0-1000)
// 理论基础：革命史观 + 现代化史观 + 全球史观 + 社会史观 + 唯物史观

export interface DimensionScore {
  score: number;       // 0-100 分
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
}

// ==================== 权重常量 ====================
// 每个维度的权重 = 该维度在总分中的最大占比
// 例如 politicalChange 权重 0.20 → 该维度满分 100 × 0.20 = 20 分贡献

export const DIMENSION_WEIGHTS = {
  politicalChange:     2.0,
  economicImpact:      1.5,
  militaryScale:       1.2,
  socialStructure:     1.2,
  ideologicalCultural: 1.0,
  internationalRelations: 1.0,
  territorialSovereignty: 0.8,
  institutionalLegacy: 0.8,
  historicalTurningPoint: 0.5,
} as const;
// 总和 = 10.0 → 维度满分100 × 10.0 = 最终满分1000

// ==================== 评分标准 (0-100 分，每 10 分一档) ====================

interface ScoringCriteria {
  level100: string;
  level90: string;
  level80: string;
  level70: string;
  level60: string;
  level50: string;
  level40: string;
  level30: string;
  level20: string;
  level10: string;
}

export const SCORING_CRITERIA: Record<string, ScoringCriteria> = {
  politicalChange: {
    level100: '彻底政权更迭，建立全新政治体制，开创历史新纪元',
    level90: '政权被推翻或建立，政体根本变革，影响全国',
    level80: '重大政治改革，制度层面深刻变化，影响深远',
    level70: '重要政治运动或变革，推动政治进程',
    level60: '政策重大调整，中层制度改革',
    level50: '政策明显变化，影响较大范围',
    level40: '一般性政治变动，影响有限',
    level30: '局部人事或政策调整',
    level20: '微小政治事件，影响面窄',
    level10: '无显著政治影响',
  },
  economicImpact: {
    level100: '经济结构根本转型，开创全新经济模式',
    level90: '经济体制重大变革，税制/货币/贸易根本变化',
    level80: '经济格局深刻变化，新兴产业兴起或经济主权丧失',
    level70: '重大经济变动，大规模工业化或经济条约签订',
    level60: '经济显著变化，关税/通商政策重大调整',
    level50: '经济中等变化，特定行业发展',
    level40: '经济局部变化，区域经济受影响',
    level30: '经济轻微变化',
    level20: '经济影响甚微',
    level10: '无经济影响',
  },
  militaryScale: {
    level100: '全国性大规模战争，决定国家命运和历史走向',
    level90: '重大战争或战役，决定战争最终走向',
    level80: '重要战役，战略意义深远，影响全局',
    level70: '较大规模军事冲突或起义，影响显著',
    level60: '中等规模军事行动，有战略意义',
    level50: '局部武装冲突或军事改革',
    level40: '小规模军事摩擦',
    level30: '零星武装事件',
    level20: '军事影响极小',
    level10: '无军事层面',
  },
  socialStructure: {
    level100: '社会阶级/阶层根本重构，社会形态完全改变',
    level90: '社会结构深刻变化，新阶级产生或旧阶级消亡',
    level80: '社会制度重大变化，废科举/改户籍等根本变革',
    level70: '社会风气/结构显著变化，影响一代人',
    level60: '社会层面中等变化，人口大规模流动',
    level50: '社会局部变化，特定群体受影响',
    level40: '社会影响有限',
    level30: '社会轻微影响',
    level20: '社会影响甚微',
    level10: '无社会影响',
  },
  ideologicalCultural: {
    level100: '思想范式根本转换，开启全新文化时代',
    level90: '新思想体系确立，深远影响数代人',
    level80: '重大思想运动，深刻影响一代人',
    level70: '重要思想传播或论战，影响知识界',
    level60: '文化/教育重大变化，影响广泛',
    level50: '思想文化中等变化',
    level40: '局部文化思想变化',
    level30: '轻微文化影响',
    level20: '文化影响甚微',
    level10: '无思想文化影响',
  },
  internationalRelations: {
    level100: '世界格局根本改变，中国大国地位确立或丧失',
    level90: '国际秩序重大变化，多边条约或联盟重组',
    level80: '重大外交转折，建交/断交/重大条约签订',
    level70: '国际关系显著变化，影响外交格局',
    level60: '外交政策重大调整',
    level50: '国际关系中等变化',
    level40: '局部外交事件',
    level30: '外交轻微事件',
    level20: '外交影响甚微',
    level10: '无国际关系影响',
  },
  territorialSovereignty: {
    level100: '大片领土割让或收复，主权根本性变化',
    level90: '重要领土变更，割地/租借/收回影响深远',
    level80: '主权重大受损或恢复，影响国家尊严',
    level70: '领土/主权重要变化',
    level60: '边界/主权中等变化',
    level50: '局部领土/主权问题',
    level40: '领土主权轻微变化',
    level30: '领土主权影响有限',
    level20: '领土主权影响甚微',
    level10: '无领土主权影响',
  },
  institutionalLegacy: {
    level100: '制度延续至今，成为国家基石',
    level90: '制度影响超50年，深远历史意义',
    level80: '制度影响30-50年',
    level70: '制度影响20-30年',
    level60: '制度影响10-20年',
    level50: '制度影响5-10年',
    level40: '制度影响3-5年',
    level30: '制度影响1-3年',
    level20: '制度影响不足1年',
    level10: '无制度遗产',
  },
  historicalTurningPoint: {
    level100: '时代根本分水岭，历史进程完全改变',
    level90: '重大历史转折点，开启全新历史阶段',
    level80: '重要历史转折，显著影响历史走向',
    level70: '历史重要节点，影响后续发展',
    level60: '历史阶段内重要事件',
    level50: '历史阶段内一般事件',
    level40: '历史阶段内小事件',
    level30: '历史进程中微不足道的节点',
    level20: '几乎不影响历史走向',
    level10: '无转折意义',
  },
};

// ==================== 事件类型基准分 (0-100) ====================
// eventType: 1=战争, 2=条约, 3=起义, 4=改革, 5=事件

export const EVENT_TYPE_BASELINES: Record<number, Record<string, number>> = {
  1: { // 战争
    politicalChange: 50,
    economicImpact: 40,
    militaryScale: 60,
    socialStructure: 40,
    ideologicalCultural: 30,
    internationalRelations: 40,
    territorialSovereignty: 40,
    institutionalLegacy: 35,
    historicalTurningPoint: 45,
  },
  2: { // 条约
    politicalChange: 55,
    economicImpact: 65,
    militaryScale: 30,
    socialStructure: 50,
    ideologicalCultural: 50,
    internationalRelations: 75,
    territorialSovereignty: 80,
    institutionalLegacy: 65,
    historicalTurningPoint: 65,
  },
  3: { // 起义
    politicalChange: 50,
    economicImpact: 25,
    militaryScale: 50,
    socialStructure: 35,
    ideologicalCultural: 35,
    internationalRelations: 20,
    territorialSovereignty: 15,
    institutionalLegacy: 30,
    historicalTurningPoint: 45,
  },
  4: { // 改革
    politicalChange: 65,
    economicImpact: 70,
    militaryScale: 30,
    socialStructure: 65,
    ideologicalCultural: 65,
    internationalRelations: 45,
    territorialSovereignty: 25,
    institutionalLegacy: 75,
    historicalTurningPoint: 60,
  },
  5: { // 事件
    politicalChange: 30,
    economicImpact: 20,
    militaryScale: 20,
    socialStructure: 25,
    ideologicalCultural: 25,
    internationalRelations: 20,
    territorialSovereignty: 20,
    institutionalLegacy: 25,
    historicalTurningPoint: 25,
  },
};

// ==================== 关键词修正 ====================
// eventType 5（事件）的 baseline 较低，通过关键词提取特征来区分不同类型的事件

const KEYWORD_ADJUSTMENTS: Record<string, { dims: string[]; bonus: number }> = {
  // 政治/政权类
  '成立': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 15 },
  '组建': { dims: ['politicalChange'], bonus: 10 },
  '政权': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 15 },
  '政府': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 10 },
  '革命': { dims: ['politicalChange', 'historicalTurningPoint', 'socialStructure'], bonus: 15 },
  '独立': { dims: ['politicalChange', 'territorialSovereignty'], bonus: 10 },
  '建国': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 20 },
  '民国': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 10 },
  '总统': { dims: ['politicalChange'], bonus: 10 },
  '议会': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 10 },
  '宪法': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 15 },
  '帝制': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 10 },
  '退位': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 15 },
  '废除': { dims: ['politicalChange', 'socialStructure'], bonus: 10 },
  '改革': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '变法': { dims: ['politicalChange', 'ideologicalCultural'], bonus: 10 },
  '建立': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '设立': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 6 },
  '任命': { dims: ['politicalChange'], bonus: 6 },
  '就任': { dims: ['politicalChange'], bonus: 8 },
  '罢免': { dims: ['politicalChange'], bonus: 6 },
  '政变': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 15 },
  '称帝': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 15 },
  '伪政权': { dims: ['politicalChange'], bonus: 12 },
  '就任': { dims: ['politicalChange'], bonus: 8 },
  '选举': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '会议': { dims: ['politicalChange'], bonus: 6 },
  '整编': { dims: ['politicalChange'], bonus: 5 },
  '整风': { dims: ['politicalChange', 'ideologicalCultural'], bonus: 8 },
  '派系': { dims: ['politicalChange'], bonus: 5 },
  '军阀': { dims: ['politicalChange', 'militaryScale'], bonus: 8 },
  '割据': { dims: ['politicalChange', 'militaryScale'], bonus: 8 },
  '统一': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 10 },
  '分裂': { dims: ['politicalChange'], bonus: 8 },
  '议和': { dims: ['politicalChange', 'internationalRelations'], bonus: 8 },
  '投降': { dims: ['politicalChange', 'militaryScale'], bonus: 10 },
  '光复': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 10 },
  '迁都': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 10 },
  '流亡': { dims: ['politicalChange'], bonus: 6 },
  '暗杀': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 10 },
  '被捕': { dims: ['politicalChange', 'socialStructure'], bonus: 5 },
  '就义': { dims: ['politicalChange', 'socialStructure'], bonus: 8 },
  '病逝': { dims: ['politicalChange'], bonus: 4 },
  '去世': { dims: ['politicalChange'], bonus: 4 },
  '逝世': { dims: ['politicalChange'], bonus: 4 },
  '自杀': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 8 },
  '禁烟': { dims: ['politicalChange', 'socialStructure', 'internationalRelations'], bonus: 12 },
  '销烟': { dims: ['politicalChange', 'socialStructure'], bonus: 10 },
  '访华': { dims: ['internationalRelations'], bonus: 6 },
  '出访': { dims: ['internationalRelations'], bonus: 6 },
  '考察': { dims: ['ideologicalCultural', 'economicImpact'], bonus: 5 },
  '视察': { dims: ['politicalChange'], bonus: 4 },
  '巡视': { dims: ['politicalChange'], bonus: 4 },
  '谈判': { dims: ['internationalRelations', 'politicalChange'], bonus: 8 },
  '协定': { dims: ['internationalRelations', 'territorialSovereignty'], bonus: 10 },
  '声明': { dims: ['internationalRelations'], bonus: 5 },
  '照会': { dims: ['internationalRelations'], bonus: 5 },
  '抗议': { dims: ['internationalRelations'], bonus: 6 },

  // 思想/文化类
  '思想': { dims: ['ideologicalCultural', 'historicalTurningPoint'], bonus: 15 },
  '文化': { dims: ['ideologicalCultural'], bonus: 10 },
  '新文化': { dims: ['ideologicalCultural', 'historicalTurningPoint'], bonus: 20 },
  '启蒙': { dims: ['ideologicalCultural'], bonus: 15 },
  '教育': { dims: ['ideologicalCultural', 'socialStructure'], bonus: 10 },
  '学堂': { dims: ['ideologicalCultural', 'institutionalLegacy'], bonus: 8 },
  '科举': { dims: ['ideologicalCultural', 'socialStructure', 'institutionalLegacy'], bonus: 15 },
  '报刊': { dims: ['ideologicalCultural'], bonus: 8 },
  '运动': { dims: ['ideologicalCultural', 'socialStructure', 'historicalTurningPoint'], bonus: 12 },
  '学会': { dims: ['ideologicalCultural', 'socialStructure'], bonus: 8 },
  '论战': { dims: ['ideologicalCultural'], bonus: 10 },
  '民主': { dims: ['ideologicalCultural', 'politicalChange'], bonus: 10 },
  '科学': { dims: ['ideologicalCultural'], bonus: 8 },
  '翻译': { dims: ['ideologicalCultural'], bonus: 6 },
  '出版': { dims: ['ideologicalCultural'], bonus: 6 },
  '杂志': { dims: ['ideologicalCultural'], bonus: 6 },
  '报纸': { dims: ['ideologicalCultural'], bonus: 6 },
  '宣传': { dims: ['ideologicalCultural'], bonus: 6 },
  '演讲': { dims: ['ideologicalCultural'], bonus: 6 },
  '著书': { dims: ['ideologicalCultural'], bonus: 6 },
  '医院': { dims: ['ideologicalCultural', 'socialStructure'], bonus: 6 },
  '西医': { dims: ['ideologicalCultural'], bonus: 6 },

  // 经济/商业类
  '经济': { dims: ['economicImpact'], bonus: 10 },
  '工业': { dims: ['economicImpact', 'militaryScale'], bonus: 10 },
  '商业': { dims: ['economicImpact'], bonus: 8 },
  '贸易': { dims: ['economicImpact', 'internationalRelations'], bonus: 10 },
  '铁路': { dims: ['economicImpact', 'militaryScale'], bonus: 10 },
  '矿山': { dims: ['economicImpact'], bonus: 8 },
  '银行': { dims: ['economicImpact', 'institutionalLegacy'], bonus: 8 },
  '通商': { dims: ['economicImpact', 'internationalRelations', 'territorialSovereignty'], bonus: 10 },
  '关税': { dims: ['economicImpact', 'territorialSovereignty'], bonus: 10 },
  '洋务': { dims: ['economicImpact', 'militaryScale', 'institutionalLegacy'], bonus: 12 },
  '制造': { dims: ['economicImpact', 'militaryScale'], bonus: 8 },
  '纺织': { dims: ['economicImpact'], bonus: 6 },
  '开埠': { dims: ['economicImpact', 'internationalRelations'], bonus: 10 },
  '建设': { dims: ['economicImpact'], bonus: 6 },
  '扩建': { dims: ['economicImpact'], bonus: 5 },
  '筹办': { dims: ['economicImpact'], bonus: 5 },
  '工厂': { dims: ['economicImpact'], bonus: 6 },
  '企业': { dims: ['economicImpact'], bonus: 6 },
  '税制': { dims: ['economicImpact', 'institutionalLegacy'], bonus: 8 },
  '借款': { dims: ['economicImpact', 'internationalRelations'], bonus: 8 },
  '投资': { dims: ['economicImpact'], bonus: 5 },
  '航运': { dims: ['economicImpact', 'militaryScale'], bonus: 6 },
  '船政': { dims: ['economicImpact', 'militaryScale'], bonus: 8 },
  '电报': { dims: ['economicImpact'], bonus: 6 },

  // 军事/战斗类
  '战役': { dims: ['militaryScale', 'historicalTurningPoint'], bonus: 15 },
  '战争': { dims: ['militaryScale', 'politicalChange', 'historicalTurningPoint'], bonus: 15 },
  '战斗': { dims: ['militaryScale'], bonus: 10 },
  '起义': { dims: ['militaryScale', 'politicalChange'], bonus: 12 },
  '起义军': { dims: ['militaryScale', 'politicalChange'], bonus: 10 },
  '会战': { dims: ['militaryScale'], bonus: 12 },
  '进攻': { dims: ['militaryScale'], bonus: 8 },
  '防守': { dims: ['militaryScale'], bonus: 6 },
  '抗战': { dims: ['militaryScale', 'historicalTurningPoint'], bonus: 15 },
  '剿': { dims: ['militaryScale'], bonus: 8 },
  '围攻': { dims: ['militaryScale'], bonus: 8 },
  '大捷': { dims: ['militaryScale'], bonus: 10 },
  '攻占': { dims: ['militaryScale'], bonus: 10 },
  '陷落': { dims: ['militaryScale', 'politicalChange'], bonus: 10 },
  '败退': { dims: ['militaryScale'], bonus: 8 },
  '歼灭': { dims: ['militaryScale'], bonus: 10 },
  '失利': { dims: ['militaryScale'], bonus: 6 },
  '失败': { dims: ['militaryScale'], bonus: 6 },
  '突破': { dims: ['militaryScale'], bonus: 8 },
  '强渡': { dims: ['militaryScale'], bonus: 8 },
  '渡河': { dims: ['militaryScale'], bonus: 6 },
  '突围': { dims: ['militaryScale'], bonus: 8 },
  '封锁': { dims: ['militaryScale', 'economicImpact'], bonus: 8 },
  '海战': { dims: ['militaryScale'], bonus: 12 },
  '炮战': { dims: ['militaryScale'], bonus: 10 },
  '炮击': { dims: ['militaryScale'], bonus: 8 },
  '轰炸': { dims: ['militaryScale'], bonus: 10 },
  '扫荡': { dims: ['militaryScale'], bonus: 8 },
  '游击': { dims: ['militaryScale'], bonus: 8 },
  '抗日': { dims: ['militaryScale', 'historicalTurningPoint'], bonus: 12 },
  '海军': { dims: ['militaryScale'], bonus: 8 },
  '水师': { dims: ['militaryScale'], bonus: 8 },
  '舰队': { dims: ['militaryScale'], bonus: 8 },
  '北洋': { dims: ['militaryScale', 'institutionalLegacy'], bonus: 8 },
  '裁撤': { dims: ['militaryScale'], bonus: 5 },
  '扩军': { dims: ['militaryScale'], bonus: 6 },
  '扩充': { dims: ['militaryScale'], bonus: 5 },
  '训练': { dims: ['militaryScale'], bonus: 4 },
  '练兵': { dims: ['militaryScale'], bonus: 5 },
  '备战': { dims: ['militaryScale'], bonus: 8 },
  '宣战': { dims: ['militaryScale', 'internationalRelations'], bonus: 12 },
  '停战': { dims: ['militaryScale', 'internationalRelations'], bonus: 8 },
  '协定': { dims: ['internationalRelations', 'territorialSovereignty'], bonus: 8 },
  '统一战线': { dims: ['militaryScale', 'politicalChange'], bonus: 12 },

  // 社会/民生类
  '灾荒': { dims: ['socialStructure', 'economicImpact'], bonus: 10 },
  '饥荒': { dims: ['socialStructure'], bonus: 10 },
  '难民': { dims: ['socialStructure'], bonus: 10 },
  '人口': { dims: ['socialStructure', 'economicImpact'], bonus: 8 },
  '移民': { dims: ['socialStructure'], bonus: 8 },
  '民生': { dims: ['socialStructure', 'economicImpact'], bonus: 8 },
  '农民': { dims: ['socialStructure', 'economicImpact'], bonus: 8 },
  '工人': { dims: ['socialStructure', 'economicImpact'], bonus: 8 },
  '罢工': { dims: ['socialStructure', 'politicalChange'], bonus: 10 },
  '游行': { dims: ['socialStructure', 'politicalChange'], bonus: 8 },
  '天父': { dims: ['socialStructure', 'ideologicalCultural'], bonus: 8 },
  '太平': { dims: ['socialStructure', 'militaryScale'], bonus: 8 },
  '红军': { dims: ['militaryScale', 'politicalChange'], bonus: 8 },
  '拜上帝': { dims: ['ideologicalCultural', 'socialStructure'], bonus: 10 },
  '传教': { dims: ['ideologicalCultural'], bonus: 8 },
  '著': { dims: ['ideologicalCultural'], bonus: 6 },
  '撰写': { dims: ['ideologicalCultural'], bonus: 5 },
  '著作': { dims: ['ideologicalCultural'], bonus: 6 },
  '教案': { dims: ['ideologicalCultural', 'internationalRelations'], bonus: 8 },
  '团练': { dims: ['militaryScale', 'socialStructure'], bonus: 8 },
  '总督': { dims: ['politicalChange'], bonus: 8 },
  '巡抚': { dims: ['politicalChange'], bonus: 6 },
  '大臣': { dims: ['politicalChange'], bonus: 6 },
  '提督': { dims: ['militaryScale'], bonus: 6 },
  '调任': { dims: ['politicalChange'], bonus: 4 },
  '赴任': { dims: ['politicalChange'], bonus: 4 },
  '上任': { dims: ['politicalChange'], bonus: 4 },
  '卸任': { dims: ['politicalChange'], bonus: 3 },
  '去世': { dims: ['politicalChange'], bonus: 4 },
  '病逝': { dims: ['politicalChange'], bonus: 4 },
  '逝世': { dims: ['politicalChange'], bonus: 4 },
  '殉国': { dims: ['politicalChange', 'historicalTurningPoint'], bonus: 10 },
  '牺牲': { dims: ['politicalChange'], bonus: 6 },
  '就义': { dims: ['politicalChange', 'socialStructure'], bonus: 8 },
  '被俘': { dims: ['militaryScale'], bonus: 5 },
  '处死': { dims: ['politicalChange'], bonus: 6 },
  '杀': { dims: ['politicalChange'], bonus: 4 },
  '剿灭': { dims: ['militaryScale'], bonus: 10 },
  '剿': { dims: ['militaryScale'], bonus: 8 },
  '平定': { dims: ['militaryScale', 'politicalChange'], bonus: 8 },
  '开埠': { dims: ['economicImpact', 'internationalRelations'], bonus: 10 },
  '开市': { dims: ['economicImpact'], bonus: 6 },
  '租界': { dims: ['territorialSovereignty', 'internationalRelations'], bonus: 10 },
  '海关': { dims: ['economicImpact', 'territorialSovereignty'], bonus: 8 },
  '抵制': { dims: ['socialStructure', 'internationalRelations'], bonus: 8 },
  '请愿': { dims: ['politicalChange', 'socialStructure'], bonus: 8 },
  '运动': { dims: ['ideologicalCultural', 'socialStructure', 'historicalTurningPoint'], bonus: 12 },
  '思想': { dims: ['ideologicalCultural', 'historicalTurningPoint'], bonus: 15 },
  '传播': { dims: ['ideologicalCultural'], bonus: 6 },
  '倡导': { dims: ['ideologicalCultural'], bonus: 6 },
  '变法': { dims: ['politicalChange', 'ideologicalCultural'], bonus: 10 },
  '改革': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '改制': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 6 },
  '新政': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 10 },
  '咨议局': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '国会': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '选举': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '资政院': { dims: ['politicalChange', 'institutionalLegacy'], bonus: 8 },
  '互保': { dims: ['politicalChange', 'internationalRelations'], bonus: 8 },
  '瓜分': { dims: ['territorialSovereignty', 'internationalRelations'], bonus: 12 },
  '伪政权': { dims: ['politicalChange'], bonus: 12 },
  '自治': { dims: ['politicalChange'], bonus: 6 },

  // 国际/外交/领土类
  '条约': { dims: ['internationalRelations', 'territorialSovereignty'], bonus: 15 },
  '外交': { dims: ['internationalRelations'], bonus: 10 },
  '割地': { dims: ['territorialSovereignty', 'politicalChange'], bonus: 15 },
  '赔款': { dims: ['territorialSovereignty', 'economicImpact'], bonus: 10 },
  '租借': { dims: ['territorialSovereignty', 'internationalRelations'], bonus: 10 },
  '主权': { dims: ['territorialSovereignty', 'politicalChange'], bonus: 12 },
  '侵略': { dims: ['militaryScale', 'territorialSovereignty', 'politicalChange'], bonus: 12 },
  '殖民': { dims: ['territorialSovereignty', 'internationalRelations'], bonus: 10 },
  '联军': { dims: ['militaryScale', 'internationalRelations'], bonus: 12 },
  '驻军': { dims: ['militaryScale', 'territorialSovereignty'], bonus: 8 },
  '建交': { dims: ['internationalRelations'], bonus: 8 },
  '英军': { dims: ['militaryScale', 'internationalRelations'], bonus: 6 },
  '法军': { dims: ['militaryScale', 'internationalRelations'], bonus: 6 },
  '日军': { dims: ['militaryScale', 'internationalRelations'], bonus: 6 },
  '美军': { dims: ['militaryScale', 'internationalRelations'], bonus: 6 },
  '俄军': { dims: ['militaryScale', 'internationalRelations'], bonus: 6 },
  '德军': { dims: ['militaryScale', 'internationalRelations'], bonus: 6 },
  '援华': { dims: ['internationalRelations', 'militaryScale'], bonus: 8 },
  '列强': { dims: ['internationalRelations', 'territorialSovereignty'], bonus: 8 },
  '殖民地': { dims: ['territorialSovereignty', 'internationalRelations'], bonus: 10 },
};

function applyKeywordAdjustments(dimension: string, base: number, event: EventInput): number {
  if (event.eventType !== 5) return base;

  const searchText = `${event.title} ${event.summary || ''} ${event.location}`.toLowerCase();
  let bonus = 0;

  for (const [keyword, adj] of Object.entries(KEYWORD_ADJUSTMENTS)) {
    if (searchText.includes(keyword) && adj.dims.includes(dimension)) {
      bonus += adj.bonus;
    }
  }

  return base + bonus;
}

// ==================== 范围加成（按维度比例分配）====================
// 范围加成不再加到总分，而是按比例分配到各维度

const PROVINCIAL_CITIES = [
  '北京', '上海', '南京', '广州', '武汉', '汉口', '武昌', '成都', '重庆',
  '天津', '杭州', '苏州', '福州', '厦门', '长沙', '西安', '兰州',
  '济南', '太原', '开封', '郑州', '沈阳', '哈尔滨', '长春', '南宁',
  '昆明', '贵阳', '南昌', '合肥', '安庆', '扬州', '镇江', '宁波',
  '泉州', '漳州', '汕头', '海口', '桂林', '柳州', '徐州', '烟台',
  '保定', '正定', '青州', '开封府', '济南府',
];

function detectScope(location: string): 'nationwide' | 'multiRegion' | 'provincial' | 'regional' {
  // 明确的全国性表述
  const nationwidePatterns = ['全国', '各省', '南北', '多省'];
  for (const kw of nationwidePatterns) {
    if (location.includes(kw) && location !== '全国各地') return 'nationwide';
  }

  // 跨区域线性地理特征
  const crossRegionPatterns = ['长江', '沿海', '沿江', '黄河', '运河', '中国沿海'];
  for (const kw of crossRegionPatterns) {
    if (location.includes(kw)) return 'multiRegion';
  }

  // 多个地点组合 → 跨省
  if (location.includes('、')) return 'multiRegion';

  // 省会/府城检测
  for (const city of PROVINCIAL_CITIES) {
    if (location.includes(city)) return 'provincial';
  }

  // 特定历史地名/关隘 → 局部但有军事意义
  const regionalMarkers = ['虎门', '大沽口', '定海', '乍浦', '吴淞', '镇江', '南京下关', '尖沙咀', '九龙', '穿鼻', '官涌', '横档', '沙角', '大角'];
  for (const marker of regionalMarkers) {
    if (location.includes(marker)) return 'provincial';
  }

  return 'regional';
}

// 范围加成：全国性 +15，跨省 +8，省会 +3
const SCOPE_BONUS_PER_DIMENSION = {
  nationwide: 15,
  multiRegion: 8,
  provincial: 3,
  regional: 0,
} as const;

// ==================== 持续时间加成（按维度比例分配）====================

function detectDurationScore(startDate: Date, endDate?: Date, institutionalLegacyScore = 1): number {
  // 1. 先尝试用实际持续时间判断
  if (endDate) {
    const yearsDiff = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsDiff >= 5) return 10;
    if (yearsDiff >= 3) return 7;
    if (yearsDiff >= 1) return 5;
    if (yearsDiff >= 0.5) return 3;
  }

  // 2. 用 institutionalLegacy 分数推断
  if (institutionalLegacyScore >= 80) return 10;
  if (institutionalLegacyScore >= 70) return 7;
  if (institutionalLegacyScore >= 60) return 5;
  if (institutionalLegacyScore >= 50) return 3;

  return 0;
}

// 持续加成只影响特定维度：制度遗产、历史转折、政治变革、社会结构
const DURATION_AFFECTED_DIMS = ['institutionalLegacy', 'historicalTurningPoint', 'politicalChange', 'socialStructure'];

// ==================== 内容丰富度乘数 ====================
// 利用事件的元数据（摘要长度、详情完整度、关联人物等）作为连续区分因子
// 范围：0.8x（极简）~ 1.2x（丰富）

function computeContentRichness(event: EventInput): number {
  let richness = 0;

  // 摘要长度 (0-0.3)
  const summaryLen = (event.summary || '').length;
  richness += Math.min(summaryLen / 300, 1) * 0.3;

  // 详情完整度 (0-0.25)
  const detailSections = [
    event.detail?.motive, event.detail?.process,
    event.detail?.result, event.detail?.impact,
  ].filter(Boolean).length;
  richness += (detailSections / 4) * 0.25;

  // 详情内容深度 (0-0.15)
  const detailLen = [
    event.detail?.motive, event.detail?.process,
    event.detail?.result, event.detail?.impact,
  ].filter(Boolean).join('').length;
  richness += Math.min(detailLen / 500, 1) * 0.15;

  // 关联人物 (0-0.1)
  richness += Math.min((event.personCount || 0) / 8, 1) * 0.1;

  // 子事件 (0-0.1)
  richness += Math.min((event.subEventsCount || 0) / 10, 1) * 0.1;

  // 持续时间 (0-0.1)
  if (event.endDate) {
    const years = (event.endDate.getTime() - event.startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    richness += Math.min(years / 3, 1) * 0.1;
  }

  return richness; // Range: 0.0 to 1.0
}

function getRichnessMultiplier(richness: number): number {
  // 0.8x (richness=0) to 1.2x (richness=1.0)
  return 0.8 + 0.4 * richness;
}

// ==================== 核心算法 ====================

export class ImpactFactorCalculator {
  /**
   * 计算事件影响力因子
   */
  calculate(event: EventInput): ImpactBreakdown {
    const dimensions = this.__calculateDimensions(event);

    // 加权求和：每个维度分数 × 权重，直接相加
    const finalScore = Math.min(1000, Math.round(this.__weightedScore(dimensions)));

    return {
      dimensions,
      weightedSum: Math.round(this.__weightedSum(dimensions) * 100) / 100,
      finalScore,
    };
  }

  /**
   * 计算 9 个维度分数 (0-100)
   */
  private __calculateDimensions(event: EventInput): ImpactBreakdown['dimensions'] {
    const baselines = EVENT_TYPE_BASELINES[event.eventType] ?? EVENT_TYPE_BASELINES[5];
    const scope = detectScope(event.location);
    const scopeBonus = SCOPE_BONUS_PER_DIMENSION[scope];

    // 计算内容丰富度乘数
    const richness = computeContentRichness(event);
    const richnessMultiplier = getRichnessMultiplier(richness);

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
      // Step 1: 关键词修正（主要对 eventType 5 有效）
      let score = applyKeywordAdjustments(key, base, event);

      // Step 2: 事件特征修正
      score = this.__adjustScore(key, score, event);

      // Step 3: 范围加成（所有维度统一加分）
      score += scopeBonus;

      // Step 4: 持续加成（仅影响特定维度）
      if (DURATION_AFFECTED_DIMS.includes(key)) {
        const instScore = result['institutionalLegacy']?.score ?? baselines.institutionalLegacy;
        const durScore = detectDurationScore(event.startDate, event.endDate, instScore);
        score += durScore;
      }

      // Step 5: 内容丰富度乘数
      score = Math.round(score * richnessMultiplier * 10) / 10;

      score = Math.max(0, Math.min(100, score));

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

    // 子事件数量 → 复杂度加成
    const subCount = event.subEventsCount ?? 0;
    if (subCount > 0) {
      const complexityBonus = Math.min(subCount * 1.5, 10);
      score += complexityBonus;
    }

    // 关联人物数量 → 参与度加成
    const personCount = event.personCount ?? 0;
    if (personCount > 0) {
      const participationBonus = Math.min(personCount * 0.8, 5);
      if (['politicalChange', 'socialStructure', 'ideologicalCultural', 'historicalTurningPoint'].includes(dimension)) {
        score += participationBonus;
      }
    }

    // 国际性加成
    if (event.isInternational) {
      if (['internationalRelations', 'economicImpact', 'politicalChange', 'territorialSovereignty'].includes(dimension)) {
        score += 3;
      }
    }

    // detail 内容存在性加成
    if (event.detail) {
      let detailCount = 0;
      if (event.detail.motive) detailCount++;
      if (event.detail.process) detailCount++;
      if (event.detail.result) detailCount++;
      if (event.detail.impact) detailCount++;

      if (detailCount >= 4) {
        score += 3;
      } else if (detailCount >= 3) {
        score += 2;
      } else if (detailCount >= 2) {
        score += 1;
      }
    }

    return score;
  }

  /**
   * 加权求和（1-10 归一化后的加权和，用于展示）
   */
  private __weightedSum(dimensions: ImpactBreakdown['dimensions']): number {
    const weights = DIMENSION_WEIGHTS;
    return (
      (dimensions.politicalChange.score / 10) * weights.politicalChange +
      (dimensions.economicImpact.score / 10) * weights.economicImpact +
      (dimensions.militaryScale.score / 10) * weights.militaryScale +
      (dimensions.socialStructure.score / 10) * weights.socialStructure +
      (dimensions.ideologicalCultural.score / 10) * weights.ideologicalCultural +
      (dimensions.internationalRelations.score / 10) * weights.internationalRelations +
      (dimensions.territorialSovereignty.score / 10) * weights.territorialSovereignty +
      (dimensions.institutionalLegacy.score / 10) * weights.institutionalLegacy +
      (dimensions.historicalTurningPoint.score / 10) * weights.historicalTurningPoint
    ) * 10;
  }

  /**
   * 加权总分：每个维度分数 × 权重，直接相加
   * 例如：politicalChange 80 分 × 0.20 = 16 分贡献
   */
  private __weightedScore(dimensions: ImpactBreakdown['dimensions']): number {
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
   * 获取评分文字依据
   */
  private __getRationale(criteria: ScoringCriteria, score: number): string {
    const rounded = Math.round(score / 10) * 10;
    const levelKey = `level${Math.max(10, Math.min(100, rounded))}` as keyof ScoringCriteria;
    return criteria[levelKey];
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

    return parts.join(' | ');
  }
}

// ==================== 便捷函数 ====================

export function calculateImpact(event: EventInput): ImpactBreakdown {
  return new ImpactFactorCalculator().calculate(event);
}
