const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'raw');
const dataDir = path.join(__dirname, '..', 'public', 'data');

function getYearFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getYearFiles(fullPath));
    } else if (item.endsWith('.md') && /^\d{4}\.md$/.test(item)) {
      files.push({ path: fullPath, name: item });
    }
  });
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

const yearFiles = getYearFiles(rawDir);

const GROUPS = {
  洋务派: 1, 清廷: 2, 太平天国: 3, 湘淮系: 4,
  维新派: 5, 革命派: 6, 中国共产党: 7, 英军: 8,
  国民党: 9, 日本侵略军: 10, 解放军: 11, 东北军: 12, 西北军: 13
};

// 预定义的群体数据
const GROUPS_DATA = [
  { id: 1, name: '洋务派', type: '学派', description: '主张学习西方技术、创办近代工业的官员群体，以曾国藩、李鸿章、左宗棠、张之洞为代表。' },
  { id: 2, name: '清廷', type: '党派', description: '清朝统治集团，以皇帝、慈禧太后及各级官员组成。' },
  { id: 3, name: '太平天国', type: '其他', description: '洪秀全创立的农民起义政权，以拜上帝教为信仰基础。' },
  { id: 4, name: '湘淮系', type: '学派', description: '洋务派中以湘军、淮军为核心的派系，曾国藩、李鸿章为代表。', parentId: 1 },
  { id: 5, name: '维新派', type: '党派', description: '主张君主立宪、变法改革的政治力量，康有为、梁启超为代表。' },
  { id: 6, name: '革命派', type: '党派', description: '主张推翻清朝、建立共和的革命力量，孙中山、黄兴为代表。' },
  { id: 7, name: '中国共产党', type: '党派', description: '无产阶级政党，1921年成立，领导中国人民进行革命斗争。' },
  { id: 8, name: '英军', type: '其他', description: '英国军队及外交人员，鸦片战争期间的侵略者。' },
  { id: 9, name: '国民党', type: '党派', description: '中国国民党，孙中山创立，蒋介石领导的执政党。' },
  { id: 10, name: '日本侵略军', type: '其他', description: '日本军队，抗日战争及二战期间的侵略者。' },
  { id: 11, name: '解放军', type: '其他', description: '中国人民解放军，中共领导的革命军队。' },
  { id: 12, name: '东北军', type: '其他', description: '张学良领导的奉系军阀部队。' },
  { id: 13, name: '西北军', type: '其他', description: '杨虎城领导的西北地方军阀部队。' }
];

function inferGroupIds(name, identity, bioSummary) {
  const groupIds = [];
  const text = `${name} ${identity} ${bioSummary}`;

  // 太平天国
  if (text.includes('太平天国') || text.includes('太平军') || text.includes('洪秀全') ||
      text.includes('杨秀清') || text.includes('石达开') || text.includes('李秀成')) {
    groupIds.push(3);
    return [...new Set(groupIds)];
  }

  // 日本侵略军
  if (text.includes('日本') || text.includes('日军') || text.includes('侵略') ||
      text.includes('昭和') || text.includes('关东军') || text.includes('华中派遣军') ||
      name === '日本' || name === '日军' || name.includes('日方')) {
    groupIds.push(10);
    return [...new Set(groupIds)];
  }

  // 解放军/共产党
  if (text.includes('解放军') || text.includes('红军') || text.includes('八路军') ||
      text.includes('新四军') || text.includes('华东野战军') || text.includes('晋冀鲁豫') ||
      text.includes('西北野战军') || text.includes('陈毅') || text.includes('粟裕') ||
      text.includes('刘伯承') || text.includes('邓小平') || text.includes('彭德怀') ||
      text.includes('贺龙') || text.includes('聂荣臻') || text.includes('林彪') ||
      text.includes('中共代表') || text.includes('毛泽东') || text.includes('周恩来') ||
      text.includes('朱德') || text.includes('陈赓') || text.includes('谢富治') ||
      text.includes('罗荣桓') || text.includes('徐向前')) {
    groupIds.push(11);
    groupIds.push(7);
    return [...new Set(groupIds)];
  }

  // 东北军
  if (text.includes('张学良') || text.includes('东北军') || text.includes('奉系') ||
      text.includes('张作霖')) {
    groupIds.push(12);
    return [...new Set(groupIds)];
  }

  // 西北军
  if (text.includes('杨虎城') || text.includes('西北军') || text.includes('冯玉祥')) {
    groupIds.push(13);
    return [...new Set(groupIds)];
  }

  // 国民党（包含汪精卫等）
  if (text.includes('国民') || text.includes('蒋介石') || text.includes('蒋') ||
      text.includes('国民政府') || text.includes('国民党') || text.includes('国军') ||
      text.includes('整编师') || text.includes('中央军') || text.includes('李宗仁') ||
      text.includes('白崇禧') || text.includes('陈诚') || text.includes('汤恩伯') ||
      text.includes('薛岳') || text.includes('张灵甫') || text.includes('胡宗南') ||
      text.includes('傅作义') || text.includes('阎锡山') || text.includes('孙连仲') ||
      text.includes('何应钦') || text.includes('卫立煌') || text.includes('杜聿明') ||
      text.includes('王铭章') || text.includes('戴安澜') || text.includes('汪精卫') ||
      text.includes('溥仪')) {
    groupIds.push(9);
    return [...new Set(groupIds)];
  }

  // 清廷
  if ((text.includes('皇帝') || text.includes('太后') || text.includes('总督') ||
      text.includes('巡抚') || text.includes('尚书') || text.includes('大臣') ||
      text.includes('道光') || text.includes('咸丰') || text.includes('光绪') ||
      text.includes('慈禧') || text.includes('林则徐') || text.includes('琦善') ||
      text.includes('奕山') || text.includes('关天培') || text.includes('聂士成')) &&
      !text.includes('英国') && !text.includes('英军')) {
    groupIds.push(2);
  }

  // 洋务派
  if (text.includes('洋务') || text.includes('曾国藩') || text.includes('李鸿章') ||
      text.includes('左宗棠') || text.includes('张之洞')) {
    groupIds.push(1);
  }

  // 维新派
  if (text.includes('维新') || text.includes('康有为') || text.includes('梁启超') ||
      text.includes('谭嗣同') || text.includes('戊戌')) {
    groupIds.push(5);
  }

  // 革命派
  if (text.includes('革命') || text.includes('孙中山') || text.includes('黄兴')) {
    groupIds.push(6);
  }

  // 共产党（早期人物）
  if (text.includes('共产党') || text.includes('毛泽东') || text.includes('周恩来')) {
    groupIds.push(7);
  }

  // 英军
  if (text.includes('英国') || text.includes('英军') || text.includes('义律') ||
      text.includes('巴麦尊') || text.includes('璞鼎查') || text.includes('联军')) {
    groupIds.push(8);
  }

  return [...new Set(groupIds)];
}

function getEventType(title) {
  if (title.includes('条约')) return '条约';
  if (title.includes('战争') || title.includes('战')) return '战争';
  if (title.includes('起义') || title.includes('运动')) return '起义';
  if (title.includes('变法') || title.includes('改革')) return '改革';
  return '事件';
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const match2 = dateStr.match(/(\d{4})年(\d{1,2})月/);
  if (match2) return `${match2[1]}-${match2[2].padStart(2, '0')}-01`;
  const match3 = dateStr.match(/(\d{4})年/);
  if (match3) return `${match3[1]}-01-01`;
  return null;
}

function parseYearFile(yearFileInfo) {
  const content = fs.readFileSync(yearFileInfo.path, 'utf-8');
  const events = [];
  const persons = [];

  const eventSections = content.split(/\n### \d+\./).slice(1);

  eventSections.forEach((section, index) => {
    const lines = section.trim().split('\n');
    const title = lines[0]?.trim() || `事件${index + 1}`;

    const timeMatch = section.match(/\*\*时间\*\*:?\s*(.+)/);
    const timeStr = timeMatch ? timeMatch[1].trim() : '';

    const locationMatch = section.match(/\*\*地点\*\*:?\s*(.+)/);
    const location = locationMatch ? locationMatch[1].trim() : '';

    const personsMatch = section.match(/\*\*参与人物\*\*:?\s*(.+)/);
    const personsStr = personsMatch ? personsMatch[1].trim() : '';

    const summaryMatch = section.match(/\*\*事件概述\*\*:?\s*\n(.+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    const startDate = parseDate(timeStr);
    const eventType = getEventType(title);

    // 解析影响因子
    const impactFactorScoreMatch = section.match(/\*\*影响因子分数\*\*:?\s*(\d+)/);
    const impactFactorScore = impactFactorScoreMatch ? parseInt(impactFactorScoreMatch[1]) : null;

    const impactFactorDescMatch = section.match(/\*\*影响因子描述\*\*:?\s*\n(.+)/);
    const impactFactorDesc = impactFactorDescMatch ? impactFactorDescMatch[1].trim() : null;

    // 解析子事件
    const subEvents = [];
    const subEventSections = section.split(/#### \d+\.\d+/).slice(1);

    subEventSections.forEach((subSection) => {
      const subLines = subSection.trim().split('\n');
      const subTitle = subLines[0]?.trim() || '';

      const subTimeMatch = subSection.match(/\*\*时间\*\*:?\s*(.+)/);
      const subTimeStr = subTimeMatch ? subTimeMatch[1].trim() : '';

      const subContentMatch = subSection.match(/\*\*内容\*\*:?\s*\n(.+)/);
      const subContent = subContentMatch ? subContentMatch[1].trim() : '';

      subEvents.push({
        title: subTitle,
        startDate: parseDate(subTimeStr),
        endDate: null,
        isInstant: true,
        eventType: '事件',
        content: subContent
      });
    });

    events.push({
      id: 0,
      title,
      startDate,
      endDate: null,
      isInstant: eventType === '条约' || eventType === '事件',
      eventType,
      location,
      summary,
      detail: { motive: '', process: '', result: '', impact: '' },
      impactFactor: impactFactorScore !== null ? {
        score: impactFactorScore,
        description: impactFactorDesc || ''
      } : null,
      subEvents,
      personNames: personsStr.split(/[、,，;；]/).map(p =>
        p.replace(/[（\(].*[）\)]/g, '').replace(/[†]/g, '').trim()
      ).filter(p => p && p.length > 0 && !p.match(/^(军|民众|军队|日军|英军|联军|红军|解放军|国民党军|国民革命军)$/)),
      relatedEvents: []
    });
  });

  // 提取关键人物表格
  const personTableMatch = content.match(/## 关键人物.*?\n\n\|.*?\n\|.*?\n((?:\|.*?\n)+)/);
  if (personTableMatch) {
    const personRows = personTableMatch[1].split('\n').filter(row => row.startsWith('|'));
    personRows.forEach(row => {
      const cols = row.split('|').filter(c => c.trim());
      if (cols.length >= 2) {
        const name = cols[0]?.trim();
        const identity = cols[1]?.trim();
        if (name && name !== '人物') {
          persons.push({ name, identity, bioSummary: identity });
        }
      }
    });
  }

  return { events, persons };
}

function processData() {
  let allEvents = [];
  let allPersons = [];
  let eventId = 1;
  let personId = 1;
  const personNameMap = new Map();

  yearFiles.forEach(yearFileInfo => {
    const year = yearFileInfo.name.replace('.md', '');
    console.log(`处理 ${year} 年数据...`);
    const { events, persons } = parseYearFile(yearFileInfo);

    persons.forEach(p => {
      if (!personNameMap.has(p.name)) {
        const groupIds = inferGroupIds(p.name, p.identity || '', p.bioSummary || '');
        personNameMap.set(p.name, personId);
        allPersons.push({ id: personId, name: p.name, birthYear: null, deathYear: null, gender: '男', bioSummary: p.bioSummary, groupIds });
        personId++;
      }
    });

    events.forEach(e => {
      e.personNames.forEach(name => {
        if (name && name.length > 1 && !personNameMap.has(name)) {
          const groupIds = inferGroupIds(name, '', '');
          personNameMap.set(name, personId);
          allPersons.push({ id: personId, name, birthYear: null, deathYear: null, gender: '男', bioSummary: '事件参与者', groupIds });
          personId++;
        }
      });

      e.id = eventId;
      e.personIds = e.personNames.map(name => personNameMap.get(name) || null).filter(id => id);
      delete e.personNames;
      allEvents.push(e);
      eventId++;
    });
  });

  fs.writeFileSync(path.join(dataDir, 'events.json'), JSON.stringify({ events: allEvents }, null, 2));
  fs.writeFileSync(path.join(dataDir, 'persons.json'), JSON.stringify({ persons: allPersons }, null, 2));
  fs.writeFileSync(path.join(dataDir, 'groups.json'), JSON.stringify({ groups: GROUPS_DATA }, null, 2));

  const subEventCount = allEvents.filter(e => e.subEvents && e.subEvents.length > 0).length;
  const totalSubEvents = allEvents.reduce((a, e) => a + (e.subEvents ? e.subEvents.length : 0), 0);

  console.log(`完成! 共 ${allEvents.length} 个事件, ${allPersons.length} 个人物`);
  console.log(`其中 ${subEventCount} 个主事件包含 ${totalSubEvents} 个子事件`);
}

processData();