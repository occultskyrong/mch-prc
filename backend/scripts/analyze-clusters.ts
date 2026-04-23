import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { calculateImpact } = require('../src/common/impact-factor');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const type5Events = await db.collection('events').find({ eventType: 5 }).limit(80).toArray();

  const scoreBuckets: Record<number, string[]> = {};
  for (const evt of type5Events) {
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
    if (!scoreBuckets[score]) scoreBuckets[score] = [];
    scoreBuckets[score].push(evt.title);
  }

  // Show buckets with 3+ events
  const clustered = Object.entries(scoreBuckets)
    .filter(([, titles]) => titles.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`Total unique scores: ${Object.keys(scoreBuckets).length}\n`);
  console.log('Clusters (3+ events at same score):');
  for (const [score, titles] of clustered) {
    console.log(`\n  ${score}分 (${titles.length} events):`);
    for (const t of titles.slice(0, 5)) {
      console.log(`    - ${t}`);
    }
  }

  // Show what distinguishes different scores
  const allScores = Object.keys(scoreBuckets).map(Number).sort((a, b) => a - b);
  console.log(`\nScore range: ${allScores[0]} - ${allScores[allScores.length - 1]}`);

  await mongoose.disconnect();
}
main().catch(console.error);
