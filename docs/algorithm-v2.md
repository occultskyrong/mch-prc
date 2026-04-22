# 史观影响力因子算法 (HPIF) v2.0 — 算法说明文档

> 百分制直接放大架构，9 维度加权求和，0-1000 分

---

## 一、整体架构

```
事件数据
  ├── 维度评分（0-100）── 9 个维度独立计算
  │     ├── 类型基准分（根据 eventType）
  │     ├── 关键词修正（title/summary/location 提取）
  │     ├── 子事件 / 人物 / 国际 / 详情修正
  │     ├── 范围加成（按 location 检测）
  │     └── 持续时间加成（startDate ~ endDate）
  └── 最终分数（0-1000）── Σ(dimensionScore_i × weight_i)
```

**核心公式**：

```
finalScore = Σ(dimensionScore_i × dimensionWeight_i)
```

- 每个维度 0-100 分，权重和为 1.0，最终分数天然落在 0-1000 区间
- **无**线性映射步骤（不再有 `×80+100`），维度得分直接决定最终分数
- 范围加成和持续时间加成在维度层面叠加，而非最后统一加分

---

## 二、九维度权重与对应史观

| # | 维度 | 权重 | 五史观映射 |
|---|------|------|-----------|
| 1 | politicalChange（政治变革） | 0.20 | 革命史观 |
| 2 | economicImpact（经济影响） | 0.15 | 现代化史观 |
| 3 | militaryScale（军事规模） | 0.12 | 革命史观 |
| 4 | socialStructure（社会结构） | 0.12 | 社会史观 |
| 5 | ideologicalCultural（思想文化） | 0.10 | 唯物史观 |
| 6 | internationalRelations（国际关系） | 0.10 | 全球史观 |
| 7 | territorialSovereignty（领土主权） | 0.08 | 全球史观 |
| 8 | institutionalLegacy（制度遗产） | 0.08 | 现代化史观 |
| 9 | historicalTurningPoint（历史转折） | 0.05 | 综合 |

---

## 三、维度评分细则（0-100 分）

每个维度 10 个等级，每 10 分一档。

### 3.1 politicalChange — 政治变革 (权重 0.20)

| 分值 | 描述 |
|------|------|
| 100 | 彻底政权更迭，建立全新政治体制 |
| 90 | 政权被推翻或建立，政体根本变革 |
| 80 | 重大政治改革，制度层面深刻变化 |
| 70 | 重要政治运动或变革，影响深远 |
| 60 | 政策重大调整，中层制度改革 |
| 50 | 政策明显变化，影响较大范围 |
| 40 | 一般性政治变动，影响有限 |
| 30 | 局部人事或政策调整 |
| 20 | 微小政治事件，影响面窄 |
| 10 | 无显著政治影响 |

### 3.2 economicImpact — 经济影响 (权重 0.15)

| 分值 | 描述 |
|------|------|
| 100 | 经济结构根本转型 |
| 90 | 经济体制重大变革 |
| 80 | 经济格局深刻变化 |
| 70 | 重大经济变动 |
| 60 | 经济显著变化 |
| 50 | 经济中等变化 |
| 40 | 经济局部变化 |
| 30 | 经济轻微变化 |
| 20 | 经济影响甚微 |
| 10 | 无经济影响 |

### 3.3 militaryScale — 军事规模 (权重 0.12)

| 分值 | 描述 |
|------|------|
| 100 | 全国性大规模战争，决定国家命运 |
| 90 | 重大战争或战役，决定战争走向 |
| 80 | 重要战役，战略意义深远 |
| 70 | 较大规模军事冲突或起义 |
| 60 | 中等规模军事行动 |
| 50 | 局部武装冲突或军事改革 |
| 40 | 小规模军事摩擦 |
| 30 | 零星武装事件 |
| 20 | 军事影响极小 |
| 10 | 无军事层面 |

### 3.4 socialStructure — 社会结构 (权重 0.12)

| 分值 | 描述 |
|------|------|
| 100 | 社会阶级/阶层根本重构 |
| 90 | 社会结构深刻变化 |
| 80 | 社会制度重大变化 |
| 70 | 社会风气/结构显著变化 |
| 60 | 社会层面中等变化 |
| 50 | 社会局部变化 |
| 40 | 社会影响有限 |
| 30 | 社会轻微影响 |
| 20 | 社会影响甚微 |
| 10 | 无社会影响 |

### 3.5 ideologicalCultural — 思想文化 (权重 0.10)

| 分值 | 描述 |
|------|------|
| 100 | 思想范式根本转换 |
| 90 | 新思想体系确立，深远影响 |
| 80 | 重大思想运动，影响一代人 |
| 70 | 重要思想传播或论战 |
| 60 | 文化/教育重大变化 |
| 50 | 思想文化中等变化 |
| 40 | 局部文化思想变化 |
| 30 | 轻微文化影响 |
| 20 | 文化影响甚微 |
| 10 | 无思想文化影响 |

### 3.6 internationalRelations — 国际关系 (权重 0.10)

| 分值 | 描述 |
|------|------|
| 100 | 世界格局根本改变 |
| 90 | 国际秩序重大变化 |
| 80 | 重大外交转折 |
| 70 | 国际关系显著变化 |
| 60 | 外交政策重大调整 |
| 50 | 国际关系中等变化 |
| 40 | 局部外交事件 |
| 30 | 外交轻微事件 |
| 20 | 外交影响甚微 |
| 10 | 无国际关系影响 |

### 3.7 territorialSovereignty — 领土主权 (权重 0.08)

| 分值 | 描述 |
|------|------|
| 100 | 大片领土割让或收复，主权根本变化 |
| 90 | 重要领土变更 |
| 80 | 主权重大受损或恢复 |
| 70 | 领土/主权重要变化 |
| 60 | 边界/主权中等变化 |
| 50 | 局部领土/主权问题 |
| 40 | 领土主权轻微变化 |
| 30 | 领土主权影响有限 |
| 20 | 领土主权影响甚微 |
| 10 | 无领土主权影响 |

### 3.8 institutionalLegacy — 制度遗产 (权重 0.08)

| 分值 | 描述 |
|------|------|
| 100 | 制度延续至今，成为国家基石 |
| 90 | 制度影响超 50 年 |
| 80 | 制度影响 30-50 年 |
| 70 | 制度影响 20-30 年 |
| 60 | 制度影响 10-20 年 |
| 50 | 制度影响 5-10 年 |
| 40 | 制度影响 3-5 年 |
| 30 | 制度影响 1-3 年 |
| 20 | 制度影响不足 1 年 |
| 10 | 无制度遗产 |

### 3.9 historicalTurningPoint — 历史转折 (权重 0.05)

| 分值 | 描述 |
|------|------|
| 100 | 时代根本分水岭，历史进程完全改变 |
| 90 | 重大历史转折点 |
| 80 | 重要历史转折，影响历史走向 |
| 70 | 历史重要节点 |
| 60 | 历史阶段内重要事件 |
| 50 | 历史阶段内一般事件 |
| 40 | 历史阶段内小事件 |
| 30 | 历史进程中微不足道的节点 |
| 20 | 几乎不影响历史走向 |
| 10 | 无转折意义 |

---

## 四、事件类型基准分

不同类型事件在各维度上有不同的起始基准分（0-100）。

| 维度 | 类型1 (战争/起义) | 类型2 (条约/外交) | 类型3 (政变/运动) | 类型4 (改革/建设) | 类型5 (一般事件) |
|------|:-:|:-:|:-:|:-:|:-:|
| politicalChange | 75 | 55 | 70 | 65 | **30** |
| economicImpact | 65 | 65 | 45 | 70 | **20** |
| militaryScale | 95 | 30 | 75 | 30 | **20** |
| socialStructure | 65 | 50 | 55 | 65 | **25** |
| ideologicalCultural | 55 | 50 | 60 | 65 | **25** |
| internationalRelations | 70 | 75 | 40 | 45 | **20** |
| territorialSovereignty | 70 | 80 | 35 | 25 | **20** |
| institutionalLegacy | 60 | 65 | 55 | 75 | **25** |
| historicalTurningPoint | 75 | 65 | 70 | 60 | **25** |

> **类型 5 是关键优化对象**：基准分低（20-30），但通过关键词修正（140+ 词条）可显著提升。

## 四.1 权重修正

**重要**：权重总和为 10.0（不是 1.0），这样维度满分 100 × 10.0 = 最终满分 1000。

| 维度 | 权重 |
| :- | -: |
| politicalChange | 2.0 |
| economicImpact | 1.5 |
| militaryScale | 1.2 |
| socialStructure | 1.2 |
| ideologicalCultural | 1.0 |
| internationalRelations | 1.0 |
| territorialSovereignty | 0.8 |
| institutionalLegacy | 0.8 |
| historicalTurningPoint | 0.5 |
| **总和** | **10.0** |

---

## 五、关键词修正系统

从 `title + summary + location` 中匹配关键词，对特定维度加分。仅对 eventType 5 生效。

### 5.1 政治类

| 关键词 | 影响维度 | 加分 |
|--------|---------|------|
| 建国 | politicalChange, historicalTurningPoint | +20 |
| 成立 | politicalChange, historicalTurningPoint | +15 |
| 政权 | politicalChange, institutionalLegacy | +15 |
| 革命 | politicalChange, historicalTurningPoint, socialStructure | +15 |
| 宪法 | politicalChange, institutionalLegacy | +15 |
| 退位 | politicalChange, historicalTurningPoint | +15 |
| 政府 | politicalChange, institutionalLegacy | +10 |
| 独立 | politicalChange, territorialSovereignty | +10 |
| 民国 | politicalChange, historicalTurningPoint | +10 |
| 总统 | politicalChange | +10 |
| 议会 | politicalChange, institutionalLegacy | +10 |
| 帝制 | politicalChange, historicalTurningPoint | +10 |
| 变法 | politicalChange, ideologicalCultural | +10 |
| 组建 | politicalChange | +10 |
| 起义 | militaryScale, politicalChange | +12 |
| 改革 | politicalChange, institutionalLegacy | +8 |
| 废除 | politicalChange, socialStructure | +10 |
| 罢工 | socialStructure, politicalChange | +10 |
| 游行 | socialStructure, politicalChange | +8 |

### 5.2 思想文化类

| 关键词 | 影响维度 | 加分 |
|--------|---------|------|
| 新文化 | ideologicalCultural, historicalTurningPoint | +20 |
| 思想 | ideologicalCultural, historicalTurningPoint | +15 |
| 科举 | ideologicalCultural, socialStructure, institutionalLegacy | +15 |
| 启蒙 | ideologicalCultural | +15 |
| 运动 | ideologicalCultural, socialStructure, historicalTurningPoint | +12 |
| 论战 | ideologicalCultural | +10 |
| 文化 | ideologicalCultural | +10 |
| 教育 | ideologicalCultural, socialStructure | +10 |
| 民主 | ideologicalCultural, politicalChange | +10 |
| 学会 | ideologicalCultural, socialStructure | +8 |
| 学堂 | ideologicalCultural, institutionalLegacy | +8 |
| 科学 | ideologicalCultural | +8 |

### 5.3 经济类

| 关键词 | 影响维度 | 加分 |
|--------|---------|------|
| 洋务 | economicImpact, militaryScale, institutionalLegacy | +12 |
| 工业 | economicImpact, militaryScale | +10 |
| 经济 | economicImpact | +10 |
| 贸易 | economicImpact, internationalRelations | +10 |
| 通商 | economicImpact, internationalRelations, territorialSovereignty | +10 |
| 关税 | economicImpact, territorialSovereignty | +10 |
| 开埠 | economicImpact, internationalRelations | +10 |
| 铁路 | economicImpact, militaryScale | +10 |
| 商业 | economicImpact | +8 |
| 矿山 | economicImpact | +8 |
| 银行 | economicImpact, institutionalLegacy | +8 |
| 制造 | economicImpact, militaryScale | +8 |

### 5.4 军事类

| 关键词 | 影响维度 | 加分 |
|--------|---------|------|
| 战役 | militaryScale, historicalTurningPoint | +15 |
| 战争 | militaryScale, politicalChange, historicalTurningPoint | +15 |
| 抗战 | militaryScale, historicalTurningPoint | +15 |
| 起义 | militaryScale, politicalChange | +12 |
| 会战 | militaryScale | +12 |
| 战斗 | militaryScale | +10 |
| 进攻 | militaryScale | +8 |
| 大捷 | militaryScale | +10 |
| 防守 | militaryScale | +6 |
| 联军 | militaryScale, internationalRelations | +12 |
| 侵略 | militaryScale, territorialSovereignty, politicalChange | +12 |

### 5.5 社会民生类

| 关键词 | 影响维度 | 加分 |
|--------|---------|------|
| 灾荒 | socialStructure, economicImpact | +10 |
| 饥荒 | socialStructure | +10 |
| 难民 | socialStructure | +10 |
| 人口 | socialStructure, economicImpact | +8 |
| 移民 | socialStructure | +8 |

### 5.6 领土主权 & 国际关系类

| 关键词 | 影响维度 | 加分 |
|--------|---------|------|
| 条约 | internationalRelations, territorialSovereignty | +15 |
| 割地 | territorialSovereignty, politicalChange | +15 |
| 主权 | territorialSovereignty, politicalChange | +12 |
| 赔款 | territorialSovereignty, economicImpact | +10 |
| 租借 | territorialSovereignty, internationalRelations | +10 |
| 外交 | internationalRelations | +10 |
| 建交 | internationalRelations | +8 |

---

## 六、范围加成（四档）

根据事件 `location` 字段检测地理范围，对**每个相关维度**直接加分。

| 档位 | 条件 | 加分 |
|------|------|------|
| 全国性 (nationwide) | 包含"全国""各省""南北""多省"等 | **+5** |
| 跨省 (multiRegion) | 包含"长江""沿海""沿江""黄河""运河"，或多城市（含顿号） | **+3** |
| 省会/府城 (provincial) | 匹配 50+ 历史名城列表 | **+1** |
| 局部 (regional) | 未匹配以上任何条件 | **+0** |

**匹配优先级**：nationwide > multiRegion > provincial > regional

范围加成直接加到每个维度的原始分上：`dimensionScore = baseline + keywordBonus + scopeBonus`

---

## 七、持续时间加成

根据事件的起止时间和制度遗产评分综合判断持续影响力，仅对以下维度生效：
- institutionalLegacy
- historicalTurningPoint
- politicalChange
- socialStructure

### 7.1 判断逻辑

1. 如果有 `endDate`，计算实际持续年数
2. 如果没有 `endDate`，用 `institutionalLegacyScore` 推断

| 档位 | 条件 | 加分（仅影响指定维度） |
|------|------|------|
| longTerm | 持续 ≥5 年 或 institutionalLegacy ≥8 | **+5** |
| midLongTerm | 持续 3-5 年 或 institutionalLegacy ≥7 | **+4** |
| midTerm | 持续 1-3 年 或 institutionalLegacy ≥6 | **+3** |
| shortMid | 持续 0.5-1 年 或 institutionalLegacy ≥5 | **+2** |
| shortTerm | 持续 <0.5 年 或 institutionalLegacy <5 | **+0** |

---

## 八、其他修正项

以下修正叠加在基准分上，对所有维度生效。

| 修正项 | 规则 | 影响维度 |
|--------|------|---------|
| 子事件 (subEvents) | 每个 +0.15，上限 +1.0 | 全部 |
| 关联人物 (personIds) | 每个 +0.08，上限 +0.5 | politicalChange, socialStructure, ideologicalCultural, historicalTurningPoint |
| 国际关联 (isInternational) | 固定 +0.3 | internationalRelations, economicImpact, politicalChange, territorialSovereignty |
| 详情完整度 (detail) | 4 项全有 +0.25，3 项 +0.15，2 项 +0.08 | 全部 |

> detail 项：motive（动机）、process（过程）、result（结果）、impact（影响）

---

## 九、完整计算流程

```
Step 1: 确定事件类型 → 获取 9 维度基准分
Step 2: 提取 title/summary/location → 匹配关键词 → 各维度 keywordBonus
Step 3: 检测 location 范围 → 各维度 scopeBonus (+0/1/3/5)
Step 4: 计算子事件/人物/国际/详情修正 → 各维度 adjustBonus
Step 5: 维度原始分 = baseline + keywordBonus + scopeBonus + adjustBonus
Step 6: 限制范围 → dimensionScore = clamp(originalScore, 10, 100)
Step 7: 持续时间加成 → 仅加到 institutionalLegacy/historicalTurningPoint/politicalChange/socialStructure
Step 8: 再次限制范围 → dimensionScore = clamp(finalDimScore, 10, 100)
Step 9: 最终分数 = Σ(dimensionScore_i × weight_i) → 范围 10-1000
```

**取整规则**：维度分保留 1 位小数（`Math.round(score × 10) / 10`），最终分数四舍五入取整。

---

## 十、分数段划分

| 分数段 | 等级 | 说明 | 典型事件 |
|--------|------|------|---------|
| 800-1000 | 里程碑 | 改变国家命运的根本性事件 | 中华人民共和国成立、抗日战争胜利 |
| 600-799 | 重大事件 | 深刻影响历史进程的重要事件 | 辛亥革命、五四运动、改革开放 |
| 450-599 | 重要事件 | 对某一领域有显著影响的事件 | 洋务运动、戊戌变法、重要条约签订 |
| 350-449 | 中等事件 | 有一定影响力的地方性事件 | 地方改革、中等规模冲突 |
| 250-349 | 一般事件 | 影响有限的普通事件 | 小型地方事件、短期变动 |
| 100-249 | 轻微事件 | 影响甚微的小事件 | 地方性小规模变动 |

---

## 十一、与 v1.0 的关键差异

| 对比项 | v1.0（旧） | v2.0（新） |
|--------|-----------|-----------|
| 维度分值范围 | 1-10 | 0-100 |
| 最终分数计算 | 加权和 × 80 + 100 + 范围 + 持续 | Σ(dimensionScore × weight) |
| 范围加成方式 | 最后加到总分 (+0/20/40) | 每个维度直接加 (+0/1/3/5) |
| 持续加成方式 | 最后加到总分 (+0/10/30) | 仅加到 4 个维度 (+0~5) |
| 关键词修正幅度 | +0.6 ~ +2.0 | +6 ~ +20 |
| 子事件修正 | ×0.08，上限 0.5 | ×0.15，上限 1.0 |
| 人物关联修正 | ×0.04，上限 0.3 | ×0.08，上限 0.5 |
| 详情完整度修正 | 最高 +0.15 | 最高 +0.25 |
| 同分问题 | 625 个事件同为 306 分 | 预计 200+ 不同分数 |

---

## 十二、v1.0 旧算法回顾（已废弃）

> 仅供对比参考，不再使用。

```
旧公式: finalScore = weightedSum × 80 + 100 + scopeBonus + durationBonus

旧范围加成: 局部 +0 / 省会 +20 / 全国 +40
旧持续加成: 短期 +0 / 中期 +10 / 长期 +30
```

旧算法的问题：
1. eventType 5 的 baseline 全是 2.0-3.0，加权后几乎相同
2. `×80+100` 的线性映射压缩了区分度
3. 范围/持续加成是离散的大步长，无法产生中间值
4. 最终取整到整数，进一步压缩唯一分数数量

---

*文档版本：v2.0 | 更新日期：2026-04-22*
