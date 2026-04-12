import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SourceService } from './source.service';
import {
  SourceCreateDTO,
  SourceUpdateDTO,
  SourceListDTO,
  SourceRelationCreateDTO,
} from './source.dto';

@Controller('api/source')
export class SourceController {
  constructor(private readonly service: SourceService) {}

  // ========== Source CRUD ==========

  @Post()
  create(@Body() dto: SourceCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: SourceListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: SourceUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }

  // ========== Source Citations ==========

  @Get('/:id/citations')
  getCitations(@Param('id') id: number) {
    return this.service.getCitations(id);
  }

  // ========== Source Relations ==========

  @Post('/relation')
  addRelation(@Body() dto: SourceRelationCreateDTO) {
    return this.service.addRelation(dto);
  }

  @Delete('/relation/:id')
  removeRelation(@Param('id') id: number) {
    return this.service.removeRelation(id);
  }

  // ========== Get sources by target ==========

  @Get('/target/:targetType/:targetId')
  getSourcesByTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: number,
  ) {
    return this.service.getSourcesByTarget(targetType, targetId);
  }
}