import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonCreateDTO, PersonUpdateDTO, PersonListDTO, PersonGroupRelationDTO } from './person.dto';

@Controller('api/person')
export class PersonController {
  constructor(private readonly service: PersonService) {}

  @Post()
  create(@Body() dto: PersonCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: PersonListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: PersonUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }

  @Get('/:id/groups')
  getGroups(@Param('id') id: number) {
    return this.service.getGroups(id);
  }

  @Post('/group-relation')
  addGroupRelation(@Body() dto: PersonGroupRelationDTO) {
    return this.service.addGroupRelation(dto);
  }

  @Delete('/group-relation/:id')
  removeGroupRelation(@Param('id') id: number) {
    return this.service.removeGroupRelation(id);
  }
}