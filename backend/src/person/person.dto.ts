import { IsString, IsOptional, IsInt } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

export class PersonCreateDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  birthYear?: number;

  @IsOptional()
  @IsInt()
  deathYear?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bioSummary?: string;
}

export class PersonUpdateDTO extends PersonCreateDTO {
  @IsInt()
  id: number;
}

export class PersonListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  name?: string;
}

export class PersonResultDTO extends BaseResultDTO {
  name: string;
  birthYear: number;
  deathYear: number;
  gender: string;
  bioSummary: string;
}

export class PersonGroupRelationDTO {
  @IsInt()
  personId: number;

  @IsInt()
  groupId: number;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsString()
  role?: string;
}