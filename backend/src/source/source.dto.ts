import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';
import { SourceTargetType } from './source-relation.entity';

// ========== Source DTOs ==========

export class SourceCreateDTO {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsInt()
  publishYear?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SourceUpdateDTO {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsInt()
  publishYear?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SourceListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;
}

export class SourceResultDTO extends BaseResultDTO {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsString()
  publisher: string;

  @IsInt()
  publishYear: number;

  @IsString()
  url: string;

  @IsString()
  sourceType: string;

  @IsString()
  description: string;
}

// ========== Source Relation DTOs ==========

export class SourceRelationCreateDTO {
  @IsInt()
  sourceId: number;

  @IsIn(['event_summary', 'event_detail', 'person', 'group'])
  targetType: SourceTargetType;

  @IsInt()
  targetId: number;

  @IsOptional()
  @IsString()
  citation?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SourceRelationResultDTO extends BaseResultDTO {
  @IsInt()
  sourceId: number;

  @IsString()
  targetType: string;

  @IsInt()
  targetId: number;

  @IsString()
  citation: string;

  @IsString()
  note: string;
}

export class SourceCitationResultDTO extends BaseResultDTO {
  @IsInt()
  sourceId: number;

  @IsString()
  sourceTitle: string;

  @IsString()
  sourceAuthor: string;

  @IsString()
  targetType: string;

  @IsInt()
  targetId: number;

  @IsString()
  citation: string;

  @IsString()
  note: string;
}