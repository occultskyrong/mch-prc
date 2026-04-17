const fs = require('fs');
const events = JSON.parse(fs.readFileSync('./all-events.json', 'utf-8'));

// 按时期分组
const byPeriod = {};
events.forEach(e => {
  if (!byPeriod[e.period]) {
    byPeriod[e.period] = {
      name: e.periodName,
      years: {}
    };
  }
  if (!byPeriod[e.period].years[e.year]) {
    byPeriod[e.period].years[e.year] = [];
  }
  byPeriod[e.period].years[e.year].push(e);
});

// 统计
let totalEvents = 0;
let totalSubEvents = 0;
const stats = Object.keys(byPeriod).sort().map(period => {
  const periodData = byPeriod[period];
  const yearCount = Object.keys(periodData.years).length;
  let eventCount = 0;
  let subEventCount = 0;
  
  Object.values(periodData.years).forEach(yearEvents => {
    yearEvents.forEach(e => {
      if (e.isSubEvent) subEventCount++;
      else eventCount++;
    });
  });
  
  totalEvents += eventCount;
  totalSubEvents += subEventCount;
  
  return {
    period,
    name: periodData.name,
    years: yearCount,
    events: eventCount,
    subEvents: subEventCount
  };
});

// 生成Markdown
let md = `# Raw 数据目录

本目录存放中国近代史历史事件的原始数据，按历史时期划分。

## 数据统计

| 时期 | 年份范围 | 年份 | 主事件 | 子事件 |
|------|----------|------|--------|--------|
`;

stats.forEach(s => {
  const years = s.period.match(/\d{4}-\d{4}/)?.[0] || '';
  md += `| ${s.name} | ${years} | ${s.years} | ${s.events} | ${s.subEvents} |\n`;
});
md += `| **合计** | **1839-1949** | **${stats.reduce((a,s)=>a+s.years,0)}** | **${totalEvents}** | **${totalSubEvents}** |\n`;

// 目录结构
md += `\n## 目录结构\n\n\`\`\`text\nraw/\n`;
Object.keys(byPeriod).sort().forEach(period => {
  const yearCount = Object.keys(byPeriod[period].years).length;
  md += `├── ${period}/   # ${yearCount}个年份文件\n`;
});
md += `└── README.md\n\`\`\`\n`;

// 各时期事件清单
md += `\n## 各时期事件清单\n\n`;

Object.keys(byPeriod).sort().forEach(period => {
  const periodData = byPeriod[period];
  const periodStats = stats.find(s => s.period === period);
  const years = Object.keys(periodData.years).sort();
  
  md += `### ${period}\n\n`;
  md += `**${periodStats.events}个主事件**${periodStats.subEvents > 0 ? ` + ${periodStats.subEvents}个子事件` : ''}\n\n`;
  
  years.forEach(year => {
    const yearEvents = periodData.years[year];
    const mainEvents = yearEvents.filter(e => !e.isSubEvent);
    const subEvents = yearEvents.filter(e => e.isSubEvent);
    
    if (mainEvents.length === 0) return;
    
    md += `#### ${year}年 (${mainEvents.length}事件)\n\n`;
    
    mainEvents.forEach(e => {
      md += `- **${e.eventNum}. ${e.title}** (${e.time || '时间未知'})\n`;
      
      const children = subEvents.filter(s => s.parentEvent === e.title);
      children.forEach(s => {
        md += `  - ${s.eventNum} ${s.title} (${s.time || '时间未知'})\n`;
      });
    });
    md += `\n`;
  });
});

// 文件格式说明
md += `## 文件格式\n\n年份文件采用 Markdown 格式，主事件使用 \`### X.\` 标题，子事件使用 \`#### X.X\` 标题。\n\n## 数据处理\n\n转换脚本：\`scripts/convert-raw-data.cjs\`\n\n\`\`\`text\nraw/*.md → scripts/convert-raw-data.cjs → public/data/events.json\n\`\`\`\n\n## 数据来源\n\n- 维基百科\n- 百度百科\n- 《中国近代史》蒋廷黻\n`;

fs.writeFileSync('./raw/README.md', md);
console.log('README.md 已生成');
console.log(`总计: ${totalEvents} 主事件, ${totalSubEvents} 子事件`);
