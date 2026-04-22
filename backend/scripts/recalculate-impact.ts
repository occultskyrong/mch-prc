/**
 * 用新算法重算所有 1102 个事件的 impactFactor
 *
 * 使用方法:
 * cd backend && npx ts-node --transpile-only scripts/recalculate-impact.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { calculateImpact } = require('../src/common/impact-factor');

function getMongoUri(): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI_PROD) return process.env.MONGODB_URI_PROD;
  console.error('请设置环境变量 MONGODB_URI');
  process.exit(1);
}

async function main() {
  console.log('连接 MongoDB...');
  await mongoose.connect(getMongoUri());
  console.log('MongoDB 连接成功\n');

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('events');

    // Get all events
    const events = await collection.find({}).toArray();
    console.log(`总事件数: ${events.length}\n`);

    let updated = 0;
    let errors = 0;
    const scores: number[] = [];
    const scoreDistribution: Record<number, number> = {};
    const segmentCounts: Record<string, number> = {
      '800-1000': 0, '600-799': 0, '450-599': 0,
      '350-449': 0, '250-349': 0, '100-249': 0,
    };

    function getSegment(score: number): string {
      if (score >= 800) return '800-1000';
      if (score >= 600) return '600-799';
      if (score >= 450) return '450-599';
      if (score >= 350) return '350-449';
      if (score >= 250) return '250-349';
      return '100-249';
    }

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];

      try {
        const eventObj = {
          title: evt.title,
          eventType: evt.eventType,
          startDate: evt.startDate,
          endDate: evt.endDate,
          location: evt.location || '',
          summary: evt.summary || '',
          detail: evt.detail,
          isInternational: evt.isInternational || false,
          subEventsCount: evt.subEvents?.length || 0,
          personCount: evt.personIds?.length || 0,
        };

        const result = calculateImpact(eventObj);
        const score = result.finalScore;

        // Build the impactFactor document for MongoDB
        const impactFactorDoc = {
          dimensions: {},
          weightedSum: result.weightedSum,
          scopeBonus: result.scopeBonus || 0,
          scopeLabel: '',
          durationBonus: result.durationBonus || 0,
          durationLabel: '',
          finalScore: score,
        };

        // Convert dimensions to the format expected by schema
        for (const [key, val] of Object.entries(result.dimensions)) {
          impactFactorDoc.dimensions[key] = {
            score: (val as any).score,
            rationale: (val as any).rationale,
          };
        }

        await collection.updateOne(
          { _id: evt._id },
          { $set: { impactFactor: impactFactorDoc } }
        );

        scores.push(score);
        scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
        segmentCounts[getSegment(score)]++;
        updated++;

        if ((i + 1) % 200 === 0) {
          console.log(`  已处理 ${i + 1}/${events.length}...`);
        }
      } catch (err) {
        errors++;
        console.error(`  错误: ${evt.title} - ${err}`);
      }
    }

    // Stats
    const uniqueScores = Object.keys(scoreDistribution).length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

    console.log(`\n===== 重算结果 =====`);
    console.log(`更新成功: ${updated}  错误: ${errors}`);
    console.log(`唯一分数: ${uniqueScores}`);
    console.log(`分数范围: ${minScore} - ${maxScore}  平均: ${avgScore}`);

    console.log('\n分数段分布:');
    for (const [seg, count] of Object.entries(segmentCounts)) {
      const pct = ((count / scores.length) * 100).toFixed(1);
      console.log(`  ${seg}: ${count} (${pct}%)`);
    }

    // Top 10 most frequent scores
    const topScores = Object.entries(scoreDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log('\n最高频分数 (Top 10):');
    for (const [score, count] of topScores) {
      console.log(`  ${score}分: ${count} 个事件`);
    }

    const maxCluster = topScores[0];
    if (maxCluster && parseInt(maxCluster[1]) > 100) {
      console.log(`\n⚠️  警告: ${maxCluster[0]}分 聚集了 ${maxCluster[1]} 个事件`);
    } else {
      console.log('\n✅ 区分度良好: 无单分聚集超过 100 个事件');
    }

  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB 已断开');
  }
}

main().catch(console.error);
