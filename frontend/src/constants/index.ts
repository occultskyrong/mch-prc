import type { SourceEntry } from '../types/event';

// ===== 事件类型常量 =====

export const EVENT_TYPE_LABELS: Record<number, string> = {
  1: '战争',
  2: '条约',
  3: '起义',
  4: '改革',
  5: '事件',
};

export const EVENT_TYPE_COLORS: Record<number, string> = {
  1: '#c41e3a',  // 朱砂（战争）
  2: '#1a3a5c',  // 墨蓝（条约）
  3: '#b8860b',  // 暗金（起义）
  4: '#2e7d32',  // 深绿（改革）
  5: '#6a1b9a',  // 深紫（事件）
};

// ===== 共享工具函数 =====

/** 统一获取 ID（兼容 _id 和 id） */
export const getId = (obj: any): string => String(obj._id ?? obj.id ?? '');

/** 从 detail 字段中提取来源标题 */
export const extractSourceTitles = (field: any, sources: SourceEntry[]): string[] => {
  const ids = !field || typeof field === 'string' ? [] : (field.sourceIds || []);
  return ids
    .map((id: string) => sources.find(s => s._id === id || s.id === id))
    .filter(Boolean)
    .map((s: SourceEntry) => s.title);
};
