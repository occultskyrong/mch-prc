import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupCreateDTO, GroupUpdateDTO, GroupListDTO } from './group.dto';

@Controller('api/group')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Post()
  create(@Body() dto: GroupCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: GroupListDTO) {
    return this.service.list(dto);
  }

  @Get('/tree')
  tree() {
    return this.service.tree();
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: GroupUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}