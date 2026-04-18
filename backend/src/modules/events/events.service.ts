import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './events.schema';
import { QueryEventsDto, CreateEventDto } from './events.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<Event>,
  ) {}

  // 获取事件列表
  async findAll(query: QueryEventsDto) {
    const { page = 1, pageSize = 10, year, eventType, groupId, search } = query;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const filter: any = {};

    if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      filter.startDate = { $gte: start, $lte: end };
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    if (groupId) {
      // 通过人物关联群体（需要在 personIds 关联查询）
      filter['personIds.groupIds'] = groupId;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const data = await this.eventModel
      .find(filter)
      .populate('personIds')
      .populate('periodId')
      .skip(skip)
      .limit(pageSize)
      .sort({ startDate: 1 })
      .exec();

    const total = await this.eventModel.countDocuments(filter);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取单个事件
  async findOne(id: string) {
    return this.eventModel
      .findById(id)
      .populate('personIds')
      .populate('periodId')
      .populate('relatedEvents')
      .exec();
  }

  // 创建事件
  async create(createEventDto: CreateEventDto) {
    const newEvent = new this.eventModel(createEventDto);
    return newEvent.save();
  }

  // 更新事件
  async update(id: string, updateEventDto: CreateEventDto) {
    return this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
  }

  // 删除事件
  async remove(id: string) {
    await this.eventModel.findByIdAndDelete(id).exec();
    return { success: true };
  }

  // 获取统计数据
  async getStats() {
    const total = await this.eventModel.countDocuments();

    const byType = await this.eventModel.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);

    const byYear = await this.eventModel.aggregate([
      {
        $group: {
          _id: { $year: '$startDate' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return { total, byType, byYear };
  }
}