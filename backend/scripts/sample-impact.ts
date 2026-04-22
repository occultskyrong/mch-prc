/**
 * 随机抽取 100 个事件，用新算法算分，输出分数分布统计
 *
 * 使用方法:
 * cd backend && npx ts-node scripts/sample-impact.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { calculateImpact } = require('../src/common/impact-factor');

function getMongoUri(): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI_PROD) return process.env.MONGODB_URI_PROD;
  console.error('请设置环境变量 MONGODB_URI');
  process.exit(1);
}

interface EventDoc {
  _id: string;
  title: string;
  eventType: number;
  startDate: string;
  endDate?: string | null;
  location?: string;
  summary?: string;
  detail?: { motive?: string; process?: string; result?: string; impact?: string };
  isInternational?: boolean;
  subEvents?: any[];
  personIds?: any[];
  impactFactor?: any;
}

async function main() {
  console.log('连接 MongoDB...');
  await mongoose.connect(getMongoUri());
  console.log('MongoDB 连接成功\n');

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('events');

    // 总事件数
    const total = await collection.countDocuments();
    console.log(`总事件数: ${total}\n`);

    // 随机抽样 100 个
    const SAMPLE_SIZE = 100;
    const sampleEvents = await collection.aggregate([
      { $sample: { size: SAMPLE_SIZE } }
    ]).toArray() as EventDoc[];

    console.log(`随机抽取 ${sampleEvents.length} 个事件，开始算分...\n`);
    console.log('─'.repeat(80));

    const scores: number[] = [];
    const uniqueScores = new Set<number>();
    const scoreDistribution: Record<number, number> = {};
    const segmentCounts: Record<string, number> = {
      '800-1000 里程碑': 0,
      '600-799 重大事件': 0,
      '450-599 重要事件': 0,
      '350-449 中等事件': 0,
      '250-349 一般事件': 0,
      '100-249 轻微事件': 0,
    };

    function getSegment(score: number): string {
      if (score >= 800) return '800-1000 里程碑';
      if (score >= 600) return '600-799 重大事件';
      if (score >= 450) return '450-599 重要事件';
      if (score >= 350) return '350-449 中等事件';
      if (score >= 250) return '250-349 一般事件';
      return '100-249 轻微事件';
    }

    // 打印每个事件的算分详情
    for (let i = 0; i < sampleEvents.length; i++) {
      const evt = sampleEvents[i];
      const eventObj = {
        title: evt.title,
        eventType: evt.eventType,
        startDate: evt.startDate,
        endDate: evt.endDate,
        location: evt.location || '',
        summary: evt.summary || '',
        detail: evt.detail || undefined,
        isInternational: evt.isInternational || false,
        subEvents: evt.subEvents || [],
        personIds: evt.personIds || [],
      };

      const result = calculateImpact(eventObj);
      const finalScore = result.finalScore;

      scores.push(finalScore);
      uniqueScores.add(finalScore);
      scoreDistribution[finalScore] = (scoreDistribution[finalScore] || 0) + 1;
      segmentCounts[getSegment(finalScore)]++;

      // 格式化输出
      const idx = String(i + 1).padStart(3, ' ');
      const scoreStr = String(finalScore).padStart(4, ' ');
      const segment = getSegment(finalScore);
      const dimTop = Object.entries(result.dimensions)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 2)
        .map(([k, v]) => `${k}=${v.score}`)
        .join(', ');

      console.log(`${idx}. [${scoreStr}] ${evt.title}`);
      console.log(`     类型=${evt.eventType}  范围加成=${result.scopeBonus > 0 ? '+' + result.scopeBonus : '0'}  持续加成=${result.durationBonus > 0 ? '+' + result.durationBonus : '0'}  最高维度: ${dimTop}`);
    }

    console.log('─'.repeat(80));

    // 统计汇总
    console.log('\n===== 分数分布统计 =====\n');

    console.log(`唯一分数数量: ${uniqueScores.size} / ${scores.length}`);

    // 最高/最低/平均
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    console.log(`最高分: ${maxScore}  最低分: ${minScore}  平均分: ${avgScore}`);

    // 分数段
    console.log('\n分数段分布:');
    for (const [segment, count] of Object.entries(segmentCounts)) {
      const pct = ((count / scores.length) * 100).toFixed(1);
      const bar = '█'.repeat(count);
      console.log(`  ${segment.padEnd(18)} ${String(count).padStart(3)}  (${pct}%)  ${bar}`);
    }

    // 出现次数最多的前 10 个分数
    const sortedScores = Object.entries(scoreDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n最高频分数 (Top 10):');
    for (const [score, count] of sortedScores) {
      console.log(`  ${score}分: ${count} 个事件`);
    }

    // 单分聚集检查
    const maxClusterScore = sortedScores[0];
    if (maxClusterScore && maxClusterScore[1] > 5) {
      console.log(`\n⚠️  警告: ${maxClusterScore[0]}分 聚集了 ${maxClusterScore[1]} 个事件，区分度仍需提升`);
    } else {
      console.log('\n✅ 区分度良好: 无单分聚集超过 5 个事件');
    }

  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB 已断开');
  }
}

main().catch(console.error);
