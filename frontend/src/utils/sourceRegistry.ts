import { EventDetailField } from '../types/event';

/** 批量获取来源名称 */
export function getSourceTitles(sourceIds: number[], sources: { id: number; title: string }[]): string[] {
  return sourceIds
    .map(id => sources?.find(s => s.id === id)?.title)
    .filter((t): t is string => !!t);
}

/** 获取详情字段的内容（兼容新旧格式） */
export function getDetailContent(field: EventDetailField | string | undefined): string {
  if (!field) return '';
  return typeof field === 'string' ? field : field.content;
}

/** 获取详情字段的来源 ID（兼容新旧格式） */
export function getDetailSourceIds(field: EventDetailField | string | undefined): number[] {
  if (!field || typeof field === 'string') return [];
  return field.sourceIds || [];
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
