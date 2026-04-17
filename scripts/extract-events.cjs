const fs = require('fs');
const path = require('path');

const rawDir = './raw';
const periods = fs.readdirSync(rawDir).filter(d => d.startsWith('0')).sort();

const allEvents = [];

periods.forEach(periodDir => {
  const periodPath = path.join(rawDir, periodDir);
  const files = fs.readdirSync(periodPath).filter(f => f.endsWith('.md') && /^\d{4}\.md$/.test(f)).sort();
  
  const periodName = periodDir.replace(/^\d+_/, '').split('_')[0];
  
  files.forEach(file => {
    const filePath = path.join(periodPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const year = file.replace('.md', '');
    
    const mainEventRegex = /\n### (\d+)\.\s*(.+)\n/g;
    let match;
    while ((match = mainEventRegex.exec(content)) !== null) {
      const eventNum = match[1];
      const eventTitle = match[2].trim();
      
      const eventSection = content.substring(match.index);
      const timeMatch = eventSection.match(/\*\*时间\*\*:?\s*(.+)/);
      const timeStr = timeMatch ? timeMatch[1].trim() : '';
      
      allEvents.push({
        period: periodDir,
        periodName,
        year,
        eventNum,
        title: eventTitle,
        time: timeStr
      });
      
      const subEventRegex = /#### (\d+)\.(\d+)\s*(.+)\n/g;
      const eventContent = eventSection.split('\n---')[0];
      
      let subMatch;
      while ((subMatch = subEventRegex.exec(eventContent)) !== null) {
        const subNum = subMatch[2];
        const subTitle = subMatch[3].trim();
        
        const subSection = eventContent.substring(subMatch.index);
        const subTimeMatch = subSection.match(/\*\*时间\*\*:?\s*(.+)/);
        const subTimeStr = subTimeMatch ? subTimeMatch[1].trim() : '';
        
        allEvents.push({
          period: periodDir,
          periodName,
          year,
          eventNum: `${eventNum}.${subNum}`,
          title: subTitle,
          time: subTimeStr,
          isSubEvent: true,
          parentEvent: eventTitle
        });
      }
    }
  });
});

// 写入JSON到当前目录
fs.writeFileSync('./all-events.json', JSON.stringify(allEvents, null, 2));

// 统计
const mainCount = allEvents.filter(e => !e.isSubEvent).length;
const subCount = allEvents.filter(e => e.isSubEvent).length;
console.log('提取完成:', allEvents.length, '条记录');
console.log('主事件:', mainCount, '子事件:', subCount);
