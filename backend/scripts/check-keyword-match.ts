import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const keywords = ['成立','组建','政权','政府','革命','独立','建国','民国','总统','议会','宪法','帝制','退位','废除','改革','变法','思想','文化','新文化','启蒙','教育','学堂','科举','运动','学会','论战','民主','科学','经济','工业','商业','贸易','铁路','矿山','银行','通商','关税','洋务','制造','开埠','战役','战争','战斗','起义','会战','进攻','防守','抗战','大捷','灾荒','饥荒','难民','人口','移民','罢工','游行','条约','外交','割地','赔款','租借','主权','侵略','联军','建交'];

  const allType5 = await db.collection('events').find({ eventType: 5 }).toArray();
  let noMatch = 0;
  let hasMatch = 0;
  for (const evt of allType5) {
    const text = `${evt.title} ${evt.summary || ''} ${evt.location || ''}`;
    if (keywords.some(kw => text.includes(kw))) hasMatch++;
    else noMatch++;
  }
  console.log(`Total type5 events: ${allType5.length}`);
  console.log(`With keyword match: ${hasMatch} (${(hasMatch/allType5.length*100).toFixed(1)}%)`);
  console.log(`No keyword match: ${noMatch} (${(noMatch/allType5.length*100).toFixed(1)}%)`);

  // Show some no-match events
  const noMatchEvents = allType5.filter(evt => {
    const text = `${evt.title} ${evt.summary || ''} ${evt.location || ''}`;
    return !keywords.some(kw => text.includes(kw));
  }).slice(0, 10);

  console.log('\nNo-match events (sample):');
  for (const evt of noMatchEvents) {
    console.log(`  [${evt.title}] loc="${evt.location}" summary="${(evt.summary || '').substring(0, 50)}"`);
  }

  await mongoose.disconnect();
}
main().catch(console.error);
