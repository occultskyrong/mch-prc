/** 批量获取来源名称 */
export function getSourceTitles(sourceIds: number[], sources: { id: number; title: string }[]): string[] {
  return sourceIds
    .map(id => sources?.find(s => s.id === id)?.title)
    .filter((t): t is string => !!t);
}

/** 获取详情字段的内容（兼容新旧格式及异常存储格式） */
export function getDetailContent(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && 'content' in field) return field.content;
  // 异常格式：数组形式（MongoDB 存储/序列化问题）
  if (Array.isArray(field)) {
    return field.map((item: any) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item.content) return item.content;
      // 字符索引格式：{ "0": "英", "1": "国", ... }
      if (typeof item === 'object') {
        const chars = Object.entries(item)
          .filter(([k]) => /^\d+$/.test(k))
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, v]) => v)
          .join('');
        return chars;
      }
      return '';
    }).join('');
  }
  // 字符索引格式的单个对象
  if (typeof field === 'object') {
    const hasNumericKeys = Object.keys(field).some(k => /^\d+$/.test(k));
    if (hasNumericKeys) {
      return Object.entries(field)
        .filter(([k]) => /^\d+$/.test(k))
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, v]) => v)
        .join('');
    }
  }
  return '';
}

/** 获取详情字段的来源 ID（兼容新旧格式及异常存储格式） */
export function getDetailSourceIds(field: any): number[] {
  if (!field || typeof field === 'string') return [];
  if (Array.isArray(field)) {
    return field.flatMap((item: any) => {
      if (typeof item === 'object' && item.sourceIds) return item.sourceIds || [];
      return [];
    });
  }
  if (typeof field === 'object' && field.sourceIds) return field.sourceIds || [];
  return [];
}

/** 统计各来源被多少事件引用 */
export function countSourceUsage(events: any[]): Record<number, number> {
  const count: Record<number, number> = {};
  for (const ev of events) {
    for (const id of ev.sourceIds || []) {
      count[id] = (count[id] || 0) + 1;
    }
    if (ev.detail) {
      for (const key of ['motive', 'process', 'result', 'impact'] as const) {
        const field = ev.detail[key];
        for (const id of getDetailSourceIds(field)) {
          count[id] = (count[id] || 0) + 1;
        }
      }
    }
  }
  return count;
}

/** 筛选使用了特定来源的事件 */
export function getEventsBySource(events: any[], sourceId: number): any[] {
  return events.filter(ev => {
    if (ev.sourceIds?.includes(sourceId)) return true;
    if (ev.detail) {
      for (const key of ['motive', 'process', 'result', 'impact'] as const) {
        const field = ev.detail[key];
        if (getDetailSourceIds(field).includes(sourceId)) return true;
      }
    }
    return false;
  });
}
