import { IsInt, IsOptional } from 'class-validator';

export class BaseListDTO {
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  pageSize?: number = 20;
}

export class BaseResultDTO {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}