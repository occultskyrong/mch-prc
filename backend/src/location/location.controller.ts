import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationCreateDTO, LocationUpdateDTO, LocationListDTO } from './location.dto';

@Controller('api/location')
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Post()
  create(@Body() dto: LocationCreateDTO) {
    return this.service.create(dto);
  }

  @Get('/list')
  list(@Query() dto: LocationListDTO) {
    return this.service.list(dto);
  }

  @Get('/:id')
  findById(@Param('id') id: number) {
    return this.service.findById(id);
  }

  @Put('/')
  update(@Body() dto: LocationUpdateDTO) {
    return this.service.update(dto);
  }

  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}