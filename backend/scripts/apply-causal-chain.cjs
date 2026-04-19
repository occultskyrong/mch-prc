/**
 * 应用因果链分析发现的缺失事件到 events.json
 *
 * 使用方法:
 * node backend/scripts/apply-causal-chain.cjs
 */
const fs = require('fs');
const path = require('path');

const EVENTS_FILE = path.join(__dirname, '../../frontend/public/data/events.json');
const MAPPING_FILE = path.join(__dirname, './causal-chain-mapping.json');

// HPIF 算法
const DIMENSION_WEIGHTS = {
  politicalChange: 0.20, economicImpact: 0.15, militaryScale: 0.12,
  socialStructure: 0.12, ideologicalCultural: 0.10, internationalRelations: 0.10,
  territorialSovereignty: 0.08, institutionalLegacy: 0.08, historicalTurningPoint: 0.05,
};

const EVENT_TYPE_BASELINES = {
  '战争': { politicalChange: 7.5, economicImpact: 6.5, militaryScale: 9.5, socialStructure: 6.5, ideologicalCultural: 5.5, internationalRelations: 7.0, territorialSovereignty: 7.0, institutionalLegacy: 6.0, historicalTurningPoint: 7.5 },
  '条约': { politicalChange: 5.5, economicImpact: 6.5, militaryScale: 3.0, socialStructure: 5.0, ideologicalCultural: 5.0, internationalRelations: 7.5, territorialSovereignty: 8.0, institutionalLegacy: 6.5, historicalTurningPoint: 6.5 },
  '起义': { politicalChange: 7.0, economicImpact: 4.5, militaryScale: 7.5, socialStructure: 5.5, ideologicalCultural: 6.0, internationalRelations: 4.0, territorialSovereignty: 3.5, institutionalLegacy: 5.5, historicalTurningPoint: 7.0 },
  '改革': { politicalChange: 6.5, economicImpact: 7.0, militaryScale: 3.0, socialStructure: 6.5, ideologicalCultural: 6.5, internationalRelations: 4.5, territorialSovereignty: 2.5, institutionalLegacy: 7.5, historicalTurningPoint: 6.0 },
  '事件': { politicalChange: 3.0, economicImpact: 2.0, militaryScale: 2.0, socialStructure: 2.5, ideologicalCultural: 2.5, internationalRelations: 2.0, territorialSovereignty: 2.0, institutionalLegacy: 2.5, historicalTurningPoint: 2.5 },
};

const SCORING_CRITERIA = {
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

function calcImpact(event) {
  const baselines = EVENT_TYPE_BASELINES[event.eventType] ?? EVENT_TYPE_BASELINES['事件'];
  const dimKeys = Object.keys(DIMENSION_WEIGHTS);
  const dimensions = {};

  for (const key of dimKeys) {
    let score = baselines[key];
    const subCount = event.subEvents?.length || 0;
    if (subCount > 0) score += Math.min(subCount * 0.08, 0.5);
    const personCount = event.personIds?.length || 0;
    if (personCount > 0 && ['politicalChange', 'socialStructure', 'ideologicalCultural', 'historicalTurningPoint'].includes(key)) {
      score += Math.min(personCount * 0.04, 0.3);
    }
    if (event.detail?.process) {
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

  const instScore = dimensions.institutionalLegacy.score;
  let durationBonus = 0, durationLabel = '';
  if (instScore >= 8) { durationBonus = 30; durationLabel = '影响>50年'; }
  else if (instScore >= 6) { durationBonus = 10; durationLabel = '影响20-50年'; }
  else { durationBonus = 0; durationLabel = '影响<20年'; }

  return { dimensions, weightedSum: Math.round(baseScore * 100) / 100, scopeBonus, scopeLabel, durationBonus, durationLabel, finalScore: Math.min(1000, Math.round(baseScore + scopeBonus + durationBonus)) };
}

function main() {
  console.log('=== 因果链缺失事件导入 ===\n');

  // 1. 读取 events.json
  const rawData = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  const events = Array.isArray(rawData) ? rawData : (rawData.events || rawData);
  console.log(`events.json 共有 ${events.length} 条事件`);

  // 2. 读取因果链映射文件
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  const entries = Object.entries(mapping).filter(([k]) => !k.startsWith('_'));
  console.log(`映射文件共 ${entries.length} 条事件\n`);

  let newAdded = 0;
  let existingEnhanced = 0;
  let skipped = 0;

  // 3. 应用增强
  for (const [title, data] of entries) {
    if (data.isNew) {
      // 检查是否已存在
      const existing = events.find(e => e.title === title);
      if (existing) {
        skipped++;
        console.log(`  [已存在] ${title}`);
        continue;
      }

      const newEvent = {
        id: events.length + 1,
        title,
        startDate: data.startDate || `${data.year}-01-01`,
        endDate: data.endDate || null,
        isInstant: data.isInstant !== undefined ? data.isInstant : true,
        eventType: data.eventType || '事件',
        location: data.location || '',
        summary: data.summary || '',
        detail: data.book || { motive: '', process: '', result: '', impact: '' },
        impactFactor: null,
        subEvents: [],
        relatedEvents: [],
        personIds: [],
        source: '蒋廷黻《中国近代史大纲》',
      };

      newEvent.impactFactor = calcImpact(newEvent);
      events.push(newEvent);
      newAdded++;
      console.log(`  [新增] ${title} (${data.startDate || data.year})`);

    } else if (data.merge) {
      // 增强现有事件
      const ev = events.find(e => e.title === title);
      if (!ev) {
        console.log(`  [未找到] ${title}`);
        continue;
      }

      if (!ev.detail) ev.detail = { motive: '', process: '', result: '', impact: '' };

      if (data.merge === 'replace') {
        for (const key of ['motive', 'process', 'result', 'impact']) {
          if (data.book[key]) ev.detail[key] = data.book[key];
        }
      }

      if (!ev.source) ev.source = '';
      if (!ev.source.includes('蒋廷黻')) {
        ev.source = (ev.source ? ev.source + '; ' : '') + '蒋廷黻《中国近代史大纲》';
      }

      ev.impactFactor = calcImpact(ev);
      existingEnhanced++;
    }
  }

  console.log(`\n=== 结果 ===`);
  console.log(`  新增事件: ${newAdded} 条`);
  console.log(`  增强现有事件: ${existingEnhanced} 条`);
  console.log(`  跳过: ${skipped} 条`);
  console.log(`  事件总数: ${events.length} 条`);

  // 4. 写回
  const enrichedData = Array.isArray(rawData) ? events : { ...rawData, events };
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(enrichedData, null, 2), 'utf8');

  // 验证
  const withBookSource = events.filter(e => e.source && e.source.includes('蒋廷黻')).length;
  const withDetail = events.filter(e => e.detail && (e.detail.process || '').length > 10).length;
  console.log(`\n=== 验证 ===`);
  console.log(`  标注蒋廷黻来源的事件: ${withBookSource} 条`);
  console.log(`  有详情的事件: ${withDetail} 条`);
  console.log(`\n完成! 已写回 events.json`);
}

main();
