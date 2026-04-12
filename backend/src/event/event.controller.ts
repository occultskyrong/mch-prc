import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EventService } from './event.service';
import {
  EventCreateDTO,
  EventUpdateDTO,
  EventListDTO,
  EventRelationCreateDTO,
  PersonEventRelationCreateDTO,
  EventLocationRelationCreateDTO,
} from './event.dto';

@Controller('api/event')
export class EventController {
  constructor(private readonly service: EventService) {}

  // ========== Event CRUD ==========

  @Post()
  create(@Body() dto: EventCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: EventListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: EventUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }

  // ========== Event Relations ==========

  @Get('/:id/relations')
  getRelations(@Param('id') id: number) {
    return this.service.getRelations(id);
  }

  @Post('/relation')
  addRelation(@Body() dto: EventRelationCreateDTO) {
    return this.service.addRelation(dto);
  }

  @Delete('/relation/:id')
  removeRelation(@Param('id') id: number) {
    return this.service.removeRelation(id);
  }

  // ========== Person Event Relations ==========

  @Get('/:id/persons')
  getPersons(@Param('id') id: number) {
    return this.service.getPersons(id);
  }

  @Post('/person-relation')
  addPersonRelation(@Body() dto: PersonEventRelationCreateDTO) {
    return this.service.addPersonRelation(dto);
  }

  @Delete('/person-relation/:id')
  removePersonRelation(@Param('id') id: number) {
    return this.service.removePersonRelation(id);
  }

  // ========== Event Location Relations ==========

  @Get('/:id/locations')
  getLocations(@Param('id') id: number) {
    return this.service.getLocations(id);
  }

  @Post('/location-relation')
  addLocationRelation(@Body() dto: EventLocationRelationCreateDTO) {
    return this.service.addLocationRelation(dto);
  }

  @Delete('/location-relation/:id')
  removeLocationRelation(@Param('id') id: number) {
    return this.service.removeLocationRelation(id);
  }
}