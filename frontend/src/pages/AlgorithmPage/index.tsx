import { Card, Table, Tag, Collapse, Typography, Progress } from 'antd';
import {
  ExperimentOutlined,
  BookOutlined,
  CalculatorOutlined,
  BarChartOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import './index.css';
import { SCORING_CRITERIA, DIMENSION_WEIGHTS } from '../../utils/impactFactor';
import { EVENT_TYPE_COLORS } from '../../constants';

const { Title, Paragraph, Text } = Typography;

// 五史观 — 学术色调（低饱和，与事件类型色区分）
const FIVE_PERSPECTIVES = [
  { name: '革命史观', color: '#a83232', desc: '政权更迭、制度变革、阶级斗争', dims: ['政治变革', '历史转折'] },
  { name: '现代化史观', color: '#2c5282', desc: '工业化、教育、军事现代化、经济转型', dims: ['经济影响', '制度遗产'] },
  { name: '全球史观', color: '#975a16', desc: '国际关系、外交、殖民与反殖民', dims: ['国际关系', '领土主权'] },
  { name: '社会史观', color: '#3c763d', desc: '人口变动、社会结构、民生福祉', dims: ['社会结构'] },
  { name: '唯物史观', color: '#6b3fa0', desc: '生产力、经济基础、上层建筑', dims: ['军事规模', '制度遗产'] },
];

// 9 维度权重表
const DIMENSION_TABLE = [
  { key: 'politicalChange', label: '政治变革', weight: '20%', desc: '政治制度变革、政权更迭' },
  { key: 'economicImpact', label: '经济影响', weight: '15%', desc: '经济结构转型、产业发展' },
  { key: 'militaryScale', label: '军事规模', weight: '12%', desc: '战争规模、军事冲突程度' },
  { key: 'socialStructure', label: '社会结构', weight: '12%', desc: '阶级变动、人口流动' },
  { key: 'ideologicalCultural', label: '思想文化', weight: '10%', desc: '思想传播、文化运动' },
  { key: 'internationalRelations', label: '国际关系', weight: '10%', desc: '外交关系、国际格局' },
  { key: 'territorialSovereignty', label: '领土主权', weight: '8%', desc: '领土变更、主权得失' },
  { key: 'institutionalLegacy', label: '制度遗产', weight: '8%', desc: '制度延续性、历史影响' },
  { key: 'historicalTurningPoint', label: '历史转折', weight: '5%', desc: '历史进程的关键节点' },
];

// 评分标准表格列
const CRITERIA_COLUMNS = [
  { title: '等级', dataIndex: 'level', key: 'level', width: 60, render: (v: number) => <Text strong>{v}</Text> },
  { title: '评分标准', dataIndex: 'criteria', key: 'criteria' },
];

// 事件类型基准表 — 使用事件类型色
const TYPE_COLUMNS = [
  { title: '类型', dataIndex: 'type', key: 'type', width: 70, render: (v: string) => {
    const colors: Record<string, string> = { '战争': EVENT_TYPE_COLORS[1], '条约': EVENT_TYPE_COLORS[2], '起义': EVENT_TYPE_COLORS[3], '改革': EVENT_TYPE_COLORS[4], '事件': EVENT_TYPE_COLORS[5] };
    return <Tag color={colors[v] || '#666'} className="algo-type-tag">{v}</Tag>;
  }},
  { title: '政治', dataIndex: 'p', key: 'p', width: 55 },
  { title: '经济', dataIndex: 'e', key: 'e', width: 55 },
  { title: '军事', dataIndex: 'm', key: 'm', width: 55 },
  { title: '社会', dataIndex: 's', key: 's', width: 55 },
  { title: '思想', dataIndex: 'i', key: 'i', width: 55 },
  { title: '国际', dataIndex: 'ir', key: 'ir', width: 55 },
  { title: '领土', dataIndex: 't', key: 't', width: 55 },
  { title: '制度', dataIndex: 'l', key: 'l', width: 55 },
  { title: '转折', dataIndex: 'h', key: 'h', width: 55 },
];

const EVENT_BASELINES = [
  { type: '战争', p: 7.5, e: 6.5, m: 9.5, s: 6.5, i: 5.5, ir: 7.0, t: 7.0, l: 6.0, h: 7.5 },
  { type: '条约', p: 5.5, e: 6.5, m: 3.0, s: 5.0, i: 5.0, ir: 7.5, t: 8.0, l: 6.5, h: 6.5 },
  { type: '起义', p: 7.0, e: 4.5, m: 7.5, s: 5.5, i: 6.0, ir: 4.0, t: 3.5, l: 5.5, h: 7.0 },
  { type: '改革', p: 6.5, e: 7.0, m: 3.0, s: 6.5, i: 6.5, ir: 4.5, t: 2.5, l: 7.5, h: 6.0 },
  { type: '事件', p: 3.0, e: 2.0, m: 2.0, s: 2.5, i: 2.5, ir: 2.0, t: 2.0, l: 2.5, h: 2.5 },
];

// 分数分段 — 热力图梯度（从高到低：赤→橙→金→绿→蓝→紫→灰）
const SCORE_SEGMENTS = [
  { range: '900-1000', level: '顶级', desc: '时代根本转折，重塑历史进程', color: '#b71c1c', examples: '鸦片战争、辛亥革命' },
  { range: '800-899', level: '重大', desc: '决定国家命运或历史走向', color: '#c23616', examples: '五四运动、抗日战争' },
  { range: '700-799', level: '重要', desc: '深远影响多个维度', color: '#d4a017', examples: '《马关条约》、洋务运动' },
  { range: '600-699', level: '较高', desc: '在关键维度有突出表现', color: '#6a8a3c', examples: '' },
  { range: '500-599', level: '中等', desc: '战役级、重要条约级事件', color: '#2c5282', examples: '中法战争、台儿庄战役' },
  { range: '400-499', level: '一般', desc: '有明确历史意义的中层事件', color: '#4a6a8a', examples: '平型关战役、秋收起义' },
  { range: '300-399', level: '轻微', desc: '有一定影响的地方/局部事件', color: '#6a4c8a', examples: '地方战役、局部改革' },
  { range: '200-299', level: '微弱', desc: '影响范围有限的常规事件', color: '#7a6a5c', examples: '日常政务、人事变动' },
  { range: '180-199', level: '极微', desc: '几乎无历史影响的琐碎事件', color: '#a89a8a', examples: '' },
];

export default function AlgorithmPage() {
  // 构建评分标准 Collapse items
  const criteriaPanels = DIMENSION_TABLE.map(dim => ({
    key: dim.key,
    label: `${dim.label}（权重 ${dim.weight}）`,
    children: (
      <Table
        dataSource={Array.from({ length: 10 }, (_, i) => ({
          level: 10 - i,
          criteria: SCORING_CRITERIA[dim.key]?.[`level${10 - i}`] || '',
        }))}
        columns={CRITERIA_COLUMNS}
        size="small"
        pagination={false}
        rowKey="level"
      />
    ),
  }));

  return (
    <div className="algorithm-page">
      {/* 标题 */}
      <div className="algo-header">
        <Title level={2} className="algo-title">
          <ExperimentOutlined /> 史观影响力因子算法
        </Title>
        <Paragraph className="algo-subtitle">
          Historical Perspective Impact Factor (HPIF) — 基于五史观理论，通过 9 维度加权评分，量化中国近代史事件的历史影响力。
        </Paragraph>
      </div>

      {/* 算法概述 */}
      <Card
        title={<><CalculatorOutlined /> 算法概述</>}
        className="archive-card"
        size="small"
      >
        <Paragraph className="algo-text">
          史观影响力因子算法综合五种主流史观的分析框架，将每个事件的历史影响力分解为 9 个可量化的维度。
          每个维度按 <Text strong>1–10 分</Text>评分，加权求和后通过公式映射到 <Text strong>0–1000 分</Text>的标准化评分体系。
        </Paragraph>
        <Paragraph className="algo-text">
          <Text strong>核心公式：</Text>
          <Text code className="algo-formula">最终分数 = min(1000, 加权总分 × 80 + 100 + 范围加成 + 持续加成)</Text>
        </Paragraph>
      </Card>

      {/* 五史观理论基础 */}
      <Card
        title={<><BookOutlined /> 五史观理论基础</>}
        className="archive-card"
        size="small"
      >
        <div className="perspectives-grid">
          {FIVE_PERSPECTIVES.map((p, i) => (
            <div key={p.name} className="perspective-card" style={{ borderLeftColor: p.color }}>
              <div className="perspective-number" style={{ color: p.color }}>〇{i + 1}</div>
              <div className="perspective-name" style={{ color: p.color }}>{p.name}</div>
              <div className="perspective-desc">{p.desc}</div>
              <div className="perspective-dims">
                对应维度：{p.dims.join('、')}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 9 维度权重 */}
      <Card
        title={<><BarChartOutlined /> 9 维评分体系</>}
        className="archive-card"
        size="small"
      >
        <Table
          dataSource={DIMENSION_TABLE.map((d, i) => ({ ...d, index: i + 1, weightValue: DIMENSION_WEIGHTS[d.key] }))}
          columns={[
            { title: '#', dataIndex: 'index', key: 'index', width: 40 },
            { title: '维度', dataIndex: 'label', key: 'label', width: 100, render: (v: string) => <Text strong>{v}</Text> },
            {
              title: '权重', dataIndex: 'weightValue', key: 'weightValue', width: 120,
              render: (v: number) => (
                <Progress
                  percent={v * 100}
                  size="small"
                  strokeColor="#1a3a5c"
                  showInfo={false}
                  className="algo-weight-bar"
                />
              ),
            },
            { title: '百分比', dataIndex: 'weight', key: 'weight', width: 60 },
            { title: '说明', dataIndex: 'desc', key: 'desc' },
          ]}
          size="small"
          pagination={false}
          rowKey="key"
        />
      </Card>

      {/* 评分标准 */}
      <Card
        title="各维度评分标准"
        className="archive-card"
        size="small"
      >
        <Collapse items={criteriaPanels} defaultActiveKey={[]} size="small" />
      </Card>

      {/* 事件类型基准分 */}
      <Card
        title="事件类型基准分"
        className="archive-card"
        size="small"
      >
        <Paragraph type="secondary" className="algo-text-secondary">
          不同类型的事件有预设基准分（1–10 分），作为自动评分的起点。规则修正在此基础上叠加。
        </Paragraph>
        <Table
          dataSource={EVENT_BASELINES}
          columns={TYPE_COLUMNS}
          size="small"
          pagination={false}
          rowKey="type"
          scroll={{ x: 600 }}
        />
      </Card>

      {/* 计算公式 */}
      <Card
        title={<><RocketOutlined /> 计算公式</>}
        className="archive-card"
        size="small"
      >
        <div className="formula-steps">
          <div className="formula-step">
            <Text strong>Step 1 — 加权求和：</Text>将 9 个维度分数乘以各自权重，得到加权总分（范围 1–10）
          </div>
          <div className="formula-step">
            <Text strong>Step 2 — 基础分映射：</Text>
            <Text code className="algo-formula">基础分 = 加权总分 × 80 + 100</Text>（映射到 180–900 分）
          </div>
          <div className="formula-step">
            <Text strong>Step 3 — 范围加成：</Text>
            全国性 +40 / 多省区域 +20 / 局部地区 +0
          </div>
          <div className="formula-step">
            <Text strong>Step 4 — 持续加成：</Text>
            影响 &gt; 50 年 +30 / 影响 20–50 年 +10 / 影响 &lt; 20 年 +0
          </div>
          <div className="formula-step">
            <Text strong>Step 5 — 最终分数：</Text>
            <Text code className="algo-formula">最终 = min(1000, 基础分 + 范围加成 + 持续加成)</Text>
          </div>
        </div>
      </Card>

      {/* 分数分段 */}
      <Card title="分数分段" className="archive-card">
        <Table
          dataSource={SCORE_SEGMENTS}
          columns={[
            { title: '分数段', dataIndex: 'range', key: 'range', width: 100, render: (v: string, r: any) => <Tag color={r.color} className="score-range-tag">{v}</Tag> },
            { title: '等级', dataIndex: 'level', key: 'level', width: 60, render: (v: string) => <Text strong>{v}</Text> },
            { title: '说明', dataIndex: 'desc', key: 'desc' },
            { title: '典型事件', dataIndex: 'examples', key: 'examples' },
          ]}
          size="small"
          pagination={false}
          rowKey="range"
        />
      </Card>
    </div>
  );
}
