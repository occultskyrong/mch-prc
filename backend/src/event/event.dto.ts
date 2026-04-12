import { IsString, IsOptional, IsInt, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

// ========== Event DTOs ==========

export class EventCreateDTO {
  @IsString()
  title: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isInstant?: boolean;

  @IsOptional()
  @IsString()
  eventType?: string;

  // Summary
  @IsOptional()
  @IsString()
  summaryContent?: string;

  // Detail
  @IsOptional()
  @IsString()
  motive?: string;

  @IsOptional()
  @IsString()
  process?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  impact?: string;
}

export class EventUpdateDTO {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isInstant?: boolean;

  @IsOptional()
  @IsString()
  eventType?: string;

  // Summary
  @IsOptional()
  @IsString()
  summaryContent?: string;

  // Detail
  @IsOptional()
  @IsString()
  motive?: string;

  @IsOptional()
  @IsString()
  process?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  impact?: string;
}

export class EventListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  eventType?: string;
}

export class EventSummaryResultDTO extends BaseResultDTO {
  @IsInt()
  eventId: number;

  @IsString()
  content: string;
}

export class EventDetailResultDTO extends BaseResultDTO {
  @IsInt()
  eventId: number;

  @IsString()
  motive: string;

  @IsString()
  process: string;

  @IsString()
  result: string;

  @IsString()
  impact: string;
}

export class EventResultDTO extends BaseResultDTO {
  @IsString()
  title: string;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsBoolean()
  isInstant: boolean;

  @IsString()
  eventType: string;

  summary: EventSummaryResultDTO;

  detail: EventDetailResultDTO;
}

// ========== Event Relation DTOs ==========

export class EventRelationCreateDTO {
  @IsInt()
  sourceEventId: number;

  @IsInt()
  targetEventId: number;

  @IsOptional()
  @IsString()
  relationType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class EventRelationResultDTO extends BaseResultDTO {
  @IsInt()
  sourceEventId: number;

  @IsInt()
  targetEventId: number;

  @IsString()
  relationType: string;

  @IsString()
  description: string;
}

// ========== Person Event Relation DTOs ==========

export class PersonEventRelationCreateDTO {
  @IsInt()
  personId: number;

  @IsInt()
  eventId: number;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PersonEventRelationResultDTO extends BaseResultDTO {
  @IsInt()
  personId: number;

  @IsInt()
  eventId: number;

  @IsString()
  role: string;

  @IsString()
  description: string;
}

// ========== Event Location Relation DTOs ==========

export class EventLocationRelationCreateDTO {
  @IsInt()
  eventId: number;

  @IsInt()
  locationId: number;

  @IsOptional()
  @IsString()
  relationType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class EventLocationRelationResultDTO extends BaseResultDTO {
  @IsInt()
  eventId: number;

  @IsInt()
  locationId: number;

  @IsString()
  relationType: string;

  @IsString()
  description: string;
}