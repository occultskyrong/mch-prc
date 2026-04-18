import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { EventsService } from './events.service';
import { QueryEventsDto, CreateEventDto } from './events.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // 获取事件列表
  @Get()
  findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  // 获取统计数据
  @Get('stats')
  getStats() {
    return this.eventsService.getStats();
  }

  // 获取单个事件
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // 创建事件
  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  // 更新事件
  @Put(':id')
  update(@Param('id') id: string, @Body() updateEventDto: CreateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  // 删除事件
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}