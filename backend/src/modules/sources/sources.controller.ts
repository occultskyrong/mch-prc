import { Controller, Get, Param } from '@nestjs/common';
import { SourcesService } from './sources.service';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  findAll() {
    return this.sourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sourcesService.findById(Number(id));
  }

  @Get('alias/:alias')
  findByAlias(@Param('alias') alias: string) {
    return this.sourcesService.findByAlias(alias);
  }
}
