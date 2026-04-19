// MongoDB 连接配置 — 仅从环境变量读取

export function getMongoUri(env = process.env.NODE_ENV || 'development'): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (env === 'production' && process.env.MONGODB_URI_PROD) return process.env.MONGODB_URI_PROD;
  throw new Error('MongoDB 连接串未配置，请设置 MONGODB_URI 或 .env 文件');
}
