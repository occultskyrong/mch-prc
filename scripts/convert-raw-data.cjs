const fs = require('fs');
const path = require('path');

// 读取所有年份.md文件
const rawDir = path.join(__dirname, '..', 'raw');
const dataDir = path.join(__dirname, '..', 'public', 'data');

// 获取所有年份.md文件（递归读取子文件夹）
function getYearFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // 递归读取子文件夹
      files.push(...getYearFiles(fullPath));
    } else if (item.endsWith('.md') && /^\d{4}\.md$/.test(item)) {
      files.push({ path: fullPath, name: item });
    }
  });
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

const yearFiles = getYearFiles(rawDir);

// 现有群体定义
const GROUPS = {
  洋务派: 1,
  清廷: 2,
  太平天国: 3,
  湘淮系: 4,
  维新派: 5,
  革命派: 6,
  中国共产党: 7,
  英军: 8
};

// 根据身份推断群体
function inferGroupIds(name, identity, bioSummary) {
  const groupIds = [];
  const text = `${name} ${identity} ${bioSummary}`;

  // 太平天国（优先判断，避免被其他规则覆盖）
  if (text.includes('太平天国') || text.includes('太平军') || text.includes('太平') ||
      text.includes('洪秀全') || text.includes('杨秀清') || text.includes('冯云山') ||
      text.includes('萧朝贵') || text.includes('石达开') || text.includes('韦昌辉') ||
      text.includes('洪天贵福') || text.includes('拜上帝') || text.includes('翼王') ||
      text.includes('东王') || text.includes('西王') || text.includes('南王') ||
      text.includes('北王') || text.includes('忠王') || text.includes('英王') ||
      text.includes('林凤祥') || text.includes('李开芳') || text.includes('李秀成') ||
      text.includes('陈玉成') || text.includes('林启荣') || text.includes('罗大纲') ||
      text.includes('胡以晃') || text.includes('赖汉英') || text.includes('曾天养') ||
      text.includes('北伐') && text.includes('太平') || text.includes('天京')) {
    groupIds.push(3);
    return [...new Set(groupIds)]; // 太平天国人物不再继续判断其他群体
  }

  // 清廷（排除外国人）
  if ((text.includes('皇帝') || text.includes('太后') || text.includes('亲王') ||
      text.includes('钦差') || text.includes('总督') || text.includes('巡抚') ||
      text.includes('尚书') || text.includes('将军') || text.includes('大臣') ||
      text.includes('道光') || text.includes('咸丰') || text.includes('光绪') ||
      text.includes('慈禧') || text.includes('奕') || text.includes('耆英') ||
      text.includes('琦善') || text.includes('伊里布') || text.includes('林则徐') ||
      text.includes('关天培') || text.includes('邓世昌') || text.includes('聂士成') ||
      text.includes('左宝贵') || text.includes('丁汝昌') || text.includes('杨芳') ||
      text.includes('奕山') || text.includes('牛鉴') || text.includes('叶名琛')) &&
      !text.includes('英国') && !text.includes('英军') && !text.includes('外交') &&
      !text.includes('领事') && !text.includes('公使') && !text.includes('联军')) {
    groupIds.push(2);
  }

  // 洋务派
  if (text.includes('洋务') || text.includes('曾国藩') || text.includes('李鸿章') ||
      text.includes('左宗棠') || text.includes('张之洞') || text.includes('丁汝昌') ||
      text.includes('安庆') || text.includes('军械') || text.includes('制造')) {
    groupIds.push(1);
  }

  // 维新派
  if (text.includes('维新') || text.includes('康有为') || text.includes('梁启超') ||
      text.includes('谭嗣同') || text.includes('戊戌') || text.includes('变法')) {
    groupIds.push(5);
  }

  // 革命派
  if (text.includes('革命') || text.includes('孙中山') || text.includes('黄兴')) {
    groupIds.push(6);
  }

  // 中国共产党
  if (text.includes('共产党') || text.includes('毛泽东') || text.includes('周恩来')) {
    groupIds.push(7);
  }

  // 英军（英国人物）
  if (text.includes('英国') || text.includes('英军') || text.includes('义律') ||
      text.includes('伯麦') || text.includes('巴麦尊') || text.includes('璞鼎查') ||
      text.includes('伊东祐亨') || text.includes('联军') || text.includes('外交') ||
      text.includes('领事') || text.includes('公使') || text.includes('司令') ||
      text.includes('将领') || text.includes('特使') || text.includes('拉萼尼') ||
      text.includes('顾盛') || text.includes('克林德')) {
    groupIds.push(8);
  }

  // 去重
  return [...new Set(groupIds)];
}

// 解析事件类型
function getEventType(title) {
  if (title.includes('条约') || title.includes('章程')) return '条约';
  if (title.includes('战争') || title.includes('战') || title.includes('海战') || title.includes('之战')) return '战争';
  if (title.includes('起义') || title.includes('运动') || title.includes('起义')) return '起义';
  if (title.includes('变法') || title.includes('改革') || title.includes('运动开始')) return '改革';
  if (title.includes('政变') || title.includes('被杀') || title.includes('去世')) return '事件';
  if (title.includes('创立') || title.includes('建立') || title.includes('创建')) return '事件';
  return '事件';
}

// 解析日期
function parseDate(dateStr) {
  if (!dateStr) return null;
  // 处理 "1840年6月" 格式
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  // 处理 "1840年6月" 格式
  const match2 = dateStr.match(/(\d{4})年(\d{1,2})月/);
  if (match2) {
    return `${match2[1]}-${match2[2].padStart(2, '0')}-01`;
  }
  // 处理 "1840年" 格式
  const match3 = dateStr.match(/(\d{4})年/);
  if (match3) {
    return `${match3[1]}-01-01`;
  }
  return null;
}

// 解析单个年份的.md文件
function parseYearFile(yearFileInfo) {
  const filePath = yearFileInfo.path;
  if (!fs.existsSync(filePath)) return { events: [], persons: [] };

  const content = fs.readFileSync(filePath, 'utf-8');
  const events = [];
  const persons = [];

  // 提取事件详情部分（确保只匹配###开头，不匹配####）
  const eventSections = content.split(/\n### \d+\./).slice(1);

  eventSections.forEach((section, index) => {
    const lines = section.trim().split('\n');

    // 提取事件名称 (第一行)
    const titleMatch = lines[0]?.match(/(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : `事件${index + 1}`;

    // 提取时间
    const timeMatch = section.match(/\*\*时间\*\*:?\s*(.+)/);
    const timeStr = timeMatch ? timeMatch[1].trim() : '';

    // 提取地点
    const locationMatch = section.match(/\*\*地点\*\*:?\s*(.+)/);
    const location = locationMatch ? locationMatch[1].trim() : '';

    // 提取参与人物
    const personsMatch = section.match(/\*\*参与人物\*\*:?\s*(.+)/);
    const personsStr = personsMatch ? personsMatch[1].trim() : '';

    // 提取事件概述
    const summaryMatch = section.match(/\*\*事件概述\*\*:?\s*\n(.+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // 提取动机原因
    const motiveMatch = section.match(/\*\*动机原因\*\*:?\s*\n(.+)/);
    const motive = motiveMatch ? motiveMatch[1].trim() : '';

    // 提取经过描述
    const processMatch = section.match(/\*\*经过描述\*\*:?\s*\n((?:.+\n)+?)/);
    const process = processMatch ? processMatch[1].replace(/\n/g, '').trim() : '';

    // 提取结果
    const resultMatch = section.match(/\*\*结果\*\*:?\s*\n(.+)/);
    const result = resultMatch ? resultMatch[1].trim() : '';

    // 提取影响
    const impactMatch = section.match(/\*\*影响\*\*:?\s*\n((?:.+\n?)+?)/);
    const impact = impactMatch ? impactMatch[1].replace(/\n/g, '').trim() : '';

    const startDate = parseDate(timeStr);
    const eventType = getEventType(title);

    // 解析子事件 (#### X.X 格式)
    const subEvents = [];
    const subEventSections = section.split(/#### \d+\.\d+/).slice(1);

    subEventSections.forEach((subSection, subIndex) => {
      const subLines = subSection.trim().split('\n');

      // 提取子事件名称 (第一行)
      const subTitleMatch = subLines[0]?.match(/(.+)/);
      const subTitle = subTitleMatch ? subTitleMatch[1].trim() : `子事件${subIndex + 1}`;

      // 提取子事件时间
      const subTimeMatch = subSection.match(/\*\*时间\*\*:?\s*(.+)/);
      const subTimeStr = subTimeMatch ? subTimeMatch[1].trim() : '';

      // 提取子事件内容/概述
      const subContentMatch = subSection.match(/\*\*内容\*\*:?\s*\n(.+)/) ||
                              subSection.match(/\*\*概述\*\*:?\s*\n(.+)/);
      const subContent = subContentMatch ? subContentMatch[1].trim() : '';

      // 提取子事件详细描述（如果有）
      const subDetailMatch = subSection.match(/\*\*经过\*\*:?\s*\n((?:.+\n)+?)/);
      const subDetail = subDetailMatch ? subDetailMatch[1].replace(/\n/g, '').trim() : '';

      const subStartDate = parseDate(subTimeStr);

      subEvents.push({
        title: subTitle,
        startDate: subStartDate,
        endDate: null,
        isInstant: true,
        eventType: '事件',
        content: subContent,
        detail: subDetail
      });
    });

    events.push({
      id: 0, // 后续分配
      title,
      startDate,
      endDate: null,
      isInstant: eventType === '条约' || eventType === '事件',
      eventType,
      location,
      summary,
      detail: {
        motive,
        process,
        result,
        impact
      },
      subEvents, // 子事件数组
      personNames: personsStr.split(/[、,，;；]/).map(p => {
        // 去除括号内容，如 "伯麦（英军）" -> "伯麦"
        p = p.replace(/[（\(].*[）\)]/g, '');
        // 去除†符号和空格
        p = p.replace(/[†\s]/g, '').trim();
        return p;
      }).filter(p => p && p.length > 0 && !p.includes('军') && !p.includes('民众') && !p.includes('联军')),
      relatedEvents: []
    });
  });

  // 提取关键人物表格
  const personTableMatch = content.match(/## 关键人物.*?\n\n\|.*?\n\|.*?\n\|.*?\n((?:\|.*?\n)+)/);
  if (personTableMatch) {
    const personRows = personTableMatch[1].split('\n').filter(row => row.startsWith('|'));
    personRows.forEach(row => {
      const cols = row.split('|').filter(c => c.trim());
      if (cols.length >= 2) {
        const name = cols[0]?.trim();
        const identity = cols[1]?.trim();
        if (name && name !== '人物') {
          persons.push({
            name,
            identity,
            bioSummary: `${identity}`
          });
        }
      }
    });
  }

  return { events, persons };
}

// 主函数
function processData() {
  let allEvents = [];
  let allPersons = [];
  let eventId = 1;
  let personId = 1;
  const personNameMap = new Map(); // 用于去重和分配ID

  // 读取现有数据
  const existingPersons = JSON.parse(fs.readFileSync(path.join(dataDir, 'persons.json'), 'utf-8')).persons;
  existingPersons.forEach(p => {
    // 更新现有人物的 groupIds（如果为空）
    if (!p.groupIds || p.groupIds.length === 0) {
      const inferredIds = inferGroupIds(p.name, '', p.bioSummary || '');
      if (inferredIds.length > 0) {
        p.groupIds = inferredIds;
        console.log(`更新人物: ${p.name} -> groupIds: [${inferredIds.join(', ')}]`);
      }
    }
    personNameMap.set(p.name, p.id);
    allPersons.push(p);
  });
  personId = Math.max(...existingPersons.map(p => p.id)) + 1;

  const existingEvents = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf-8')).events;
  eventId = Math.max(...existingEvents.map(e => e.id)) + 1;

  // 建立事件标题到personIds的映射
  const eventPersonIdsMap = new Map();

  // 处理每个年份.md文件
  yearFiles.forEach(yearFileInfo => {
    const year = yearFileInfo.name.replace('.md', '');
    console.log(`处理 ${year} 年数据...`);
    const { events, persons } = parseYearFile(yearFileInfo);

    // 处理人物
    persons.forEach(p => {
      if (!personNameMap.has(p.name)) {
        const groupIds = inferGroupIds(p.name, p.identity || '', p.bioSummary || '');
        personNameMap.set(p.name, personId);
        allPersons.push({
          id: personId,
          name: p.name,
          birthYear: null,
          deathYear: null,
          gender: '男',
          bioSummary: p.bioSummary,
          groupIds
        });
        console.log(`  新增人物: ${p.name} -> groupIds: [${groupIds.join(', ')}]`);
        personId++;
      }
    });

    // 处理事件
    events.forEach(e => {
      // 添加事件中的参与人物（如果不在人物表中）
      e.personNames.forEach(name => {
        if (name && name.length > 1 && !personNameMap.has(name)) {
          const groupIds = inferGroupIds(name, '', '');
          personNameMap.set(name, personId);
          allPersons.push({
            id: personId,
            name,
            birthYear: null,
            deathYear: null,
            gender: '男',
            bioSummary: `事件参与者`,
            groupIds
          });
          console.log(`  新增人物(来自事件): ${name} -> id: ${personId}, groupIds: [${groupIds.join(', ')}]`);
          personId++;
        }
      });

      e.id = eventId;
      e.personIds = e.personNames.map(name => personNameMap.get(name) || null).filter(id => id);
      delete e.personNames;

      // 记录事件的personIds用于更新现有事件
      eventPersonIdsMap.set(e.title, e.personIds);

      allEvents.push(e);
      eventId++;
    });
  });

  // 更新现有事件的 personIds
  existingEvents.forEach(e => {
    if (!e.personIds || e.personIds.length === 0) {
      const newPersonIds = eventPersonIdsMap.get(e.title);
      if (newPersonIds && newPersonIds.length > 0) {
        e.personIds = newPersonIds;
        console.log(`更新事件: ${e.title} -> personIds: [${newPersonIds.join(', ')}]`);
      }
    }
  });

  // 合并现有事件和新事件
  allEvents = [...existingEvents, ...allEvents.filter(e => !existingEvents.some(ex => ex.title === e.title))];

  // 写入文件
  fs.writeFileSync(path.join(dataDir, 'events.json'), JSON.stringify({ events: allEvents }, null, 2));
  fs.writeFileSync(path.join(dataDir, 'persons.json'), JSON.stringify({ persons: allPersons }, null, 2));

  console.log(`完成! 共 ${allEvents.length} 个事件, ${allPersons.length} 个人物`);
}

processData();