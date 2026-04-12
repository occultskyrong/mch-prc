import { IsString, IsOptional, IsInt } from 'class-validator';
import { BaseListDTO, BaseResultDTO } from 'src/common/base.dto';

export class GroupCreateDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GroupUpdateDTO extends GroupCreateDTO {
  @IsInt()
  id: number;
}

export class GroupListDTO extends BaseListDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class GroupResultDTO extends BaseResultDTO {
  name: string;
  parentId: number;
  type: string;
  description: string;
}