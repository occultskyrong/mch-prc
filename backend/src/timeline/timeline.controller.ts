import { Controller, Get, Query } from '@nestjs/common';
import { TimelineService, TimelineMatrixDTO } from './timeline.service';

@Controller('api/timeline')
export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  @Get('/matrix')
  getMatrix(@Query() dto: TimelineMatrixDTO) {
    return this.service.getMatrix(dto);
  }
}