// 查询参数 DTO
export class QueryEventsDto {
  page?: number = 1;
  pageSize?: number = 10;
  year?: number;
  startYear?: number;
  endYear?: number;
  eventType?: string;
  groupId?: string;
  search?: string;
}

// 单维度评分
export interface DimensionScoreDto {
  score: number;
  rationale: string;
}

// 结构化影响力因子
export interface ImpactFactorDto {
  dimensions: Record<string, DimensionScoreDto>;
  weightedSum: number;
  scopeBonus: number;
  scopeLabel: string;
  durationBonus: number;
  durationLabel: string;
  finalScore: number;
}

// 创建/更新事件 DTO
export class CreateEventDto {
  title: string;
  startDate: Date;
  endDate?: Date;
  eventType?: string;
  location?: string;
  summary?: string;
  detail?: {
    motive?: string;
    process?: string;
    result?: string;
    impact?: string;
  };
  impactFactor?: ImpactFactorDto;
  periodId?: string;
  personIds?: string[];
  subEvents?: {
    title: string;
    date?: Date;
    content?: string;
  }[];
  source?: string;
}