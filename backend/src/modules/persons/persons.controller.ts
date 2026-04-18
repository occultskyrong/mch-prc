import { Controller, Get, Param, Query } from '@nestjs/common';
import { PersonsService } from './persons.service';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('pageSize') pageSize = 10, @Query('groupId') groupId?: string) {
    return this.personsService.findAll(+page, +pageSize, groupId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personsService.findOne(id);
  }
}