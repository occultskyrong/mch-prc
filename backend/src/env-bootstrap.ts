import * as dotenv from 'dotenv';
import * as path from 'path';

// 从项目根目录（backend/..）加载 .env，兼容 dist 编译路径
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
