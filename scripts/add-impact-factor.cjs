const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'raw');

// 影响因子评估规则
const HIGH_IMPACT_KEYWORDS = [
  // 90-100级别：改变历史进程的重大事件
  { keywords: ['鸦片战争', '太平天国', '金田起义', '天京事变', '辛亥革命', '武昌起义', '日本投降', '抗战胜利', '中共七大', '重庆谈判', '双十协定', '开国', '建国'], score: 95 },
  { keywords: ['南京条约', '马关条约', '辛丑条约', '凡尔赛和约', '开罗宣言', '波茨坦公告'], score: 90 },

  // 70-89级别：重要历史事件
  { keywords: ['战争', '会战', '战役', '起义', '革命', '变法', '改革', '条约', '签约', '和约'], score: 75 },
  { keywords: ['洋务运动', '戊戌变法', '清末新政', '五四运动', '北伐战争', '西安事变', '皖南事变', '百团大战', '长征', '遵义会议'], score: 85 },
  { keywords: ['虎门销烟', '三元里抗英', '镇南关战役', '台儿庄战役', '衡阳保卫战', '淞沪会战', '武汉会战', '长沙会战'], score: 80 },
  { keywords: ['林则徐', '洪秀全', '孙中山', '毛泽东', '蒋介石', '李鸿章', '曾国藩', '张之洞'], score: 70 },

  // 50-69级别：中等影响事件
  { keywords: ['创建', '成立', '建立', '设立', '任命', '颁布', '发布', '宣布'], score: 55 },
  { keywords: ['会议', '会谈', '谈判', '协商', '访问'], score: 50 },
  { keywords: ['进攻', '攻占', '占领', '攻克', '收复', '失守'], score: 60 },

  // 30-49级别：较小影响事件
  { keywords: ['视察', '考察', '巡视', '巡游', '巡视'], score: 35 },
  { keywords: ['逝世', '去世', '殉国', '牺牲', '病逝'], score: 40 },

  // 特殊事件类型
  { keywords: ['子事件'], score: 30 }
];

// 时期权重（不同时期的事件影响权重不同）
const PERIOD_WEIGHTS = {
  '1839-1860': 1.2,  // 鸦片战争时期，近代史开端
  '1861-1894': 1.0,  // 洋务运动时期
  '1895-1900': 1.1,  // 甲午战后，民族危机加深
  '1901-1911': 1.3,  // 清末新政，革命前夕
  '1912-1927': 1.2,  // 民国初期，军阀混战
  '1927-1949': 1.4   // 国民政府时期，抗战+解放战争
};

function getPeriodWeight(year) {
  if (year >= 1839 && year <= 1860) return PERIOD_WEIGHTS['1839-1860'];
  if (year >= 1861 && year <= 1894) return PERIOD_WEIGHTS['1861-1894'];
  if (year >= 1895 && year <= 1900) return PERIOD_WEIGHTS['1895-1900'];
  if (year >= 1901 && year <= 1911) return PERIOD_WEIGHTS['1901-1911'];
  if (year >= 1912 && year <= 1927) return PERIOD_WEIGHTS['1912-1927'];
  if (year >= 1927 && year <= 1949) return PERIOD_WEIGHTS['1927-1949'];
  return 1.0;
}

function calculateImpactFactor(title, summary, year) {
  let baseScore = 30; // 默认基础分数

  // 根据关键词匹配
  for (const rule of HIGH_IMPACT_KEYWORDS) {
    for (const keyword of rule.keywords) {
      if (title.includes(keyword) || (summary && summary.includes(keyword))) {
        baseScore = Math.max(baseScore, rule.score);
        break;
      }
    }
  }

  // 根据时期权重调整
  const periodWeight = getPeriodWeight(year);
  let finalScore = Math.round(baseScore * periodWeight);

  // 确保分数在0-100范围内
  finalScore = Math.min(100, Math.max(0, finalScore));

  return finalScore;
}

function generateDescription(score, title) {
  if (score >= 90) {
    return `该事件是改变历史进程的重大事件，对中国近代史有深远影响。`;
  } else if (score >= 70) {
    return `该事件是重要历史事件，对当时及后续历史发展有重大影响。`;
  } else if (score >= 50) {
    return `该事件有一定影响，是当时历史进程的重要组成部分。`;
  } else if (score >= 30) {
    return `该事件影响较小，主要在局部或特定领域产生影响。`;
  } else {
    return `该事件影响微小，主要作为历史细节补充。`;
  }
}

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

function addImpactFactorToFile(filePath, year) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 检查是否已有影响因子字段
  if (content.includes('**影响因子分数**')) {
    console.log(`${year}年文件已有影响因子，跳过`);
    return;
  }

  // 在每个事件的影响字段后添加影响因子
  // 匹配 "**影响**: ..." 后添加影响因子

  const eventSections = content.split(/\n### \d+\./);
  const newSections = [];

  eventSections.forEach((section, index) => {
    if (index === 0) {
      newSections.push(section);
      return;
    }

    // 获取标题和概述
    const lines = section.trim().split('\n');
    const title = lines[0]?.trim() || '';
    const summaryMatch = section.match(/\*\*事件概述\*\*:?\s*\n(.+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // 计算影响因子
    const score = calculateImpactFactor(title, summary, parseInt(year));
    const description = generateDescription(score, title);

    // 在影响字段后添加影响因子
    if (section.includes('**影响**:')) {
      section = section.replace(/\*\*影响\*\*:?\s*\n(.+)/, (match, impact) => {
        return `${match}\n\n**影响因子分数**: ${score}\n\n**影响因子描述**: ${description}`;
      });
    } else {
      // 如果没有影响字段，在结果后添加
      if (section.includes('**结果**:')) {
        section = section.replace(/\*\*结果\*\*:?\s*\n(.+)/, (match, result) => {
          return `${match}\n\n**影响因子分数**: ${score}\n\n**影响因子描述**: ${description}`;
        });
      }
    }

    newSections.push('\n### ' + index + '.' + section);
  });

  const newContent = newSections.join('');
  fs.writeFileSync(filePath, newContent);
  console.log(`${year}年文件已添加影响因子`);
}

function processAllFiles() {
  const yearFiles = getYearFiles(rawDir);
  yearFiles.forEach(fileInfo => {
    const year = fileInfo.name.replace('.md', '');
    addImpactFactorToFile(fileInfo.path, year);
  });
  console.log('所有文件已处理完成');
}

processAllFiles();