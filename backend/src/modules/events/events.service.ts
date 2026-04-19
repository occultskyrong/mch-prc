import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './events.schema';
import { QueryEventsDto, CreateEventDto } from './events.dto';
import { ImpactFactorCalculator } from '../../common/impact-factor';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<Event>,
  ) {}

  // 获取事件列表
  async findAll(query: QueryEventsDto) {
    const { page = 1, pageSize = 10, year, startYear, endYear, eventType, groupId, search } = query;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const filter: any = {};

    if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      filter.startDate = { $gte: start, $lte: end };
    } else if (startYear || endYear) {
      const dateFilter: any = {};
      if (startYear) dateFilter.$gte = new Date(startYear, 0, 1);
      if (endYear) dateFilter.$lte = new Date(endYear, 11, 31);
      filter.startDate = dateFilter;
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    if (groupId) {
      // 先查询该群体下的人物 ID，再用这些 ID 过滤事件
      const PersonModel = this.eventModel.db.model('Person');
      const personsInGroup = await PersonModel.find({ groupIds: groupId }, '_id');
      const personIds = personsInGroup.map(p => p._id);
      if (personIds.length > 0) {
        filter.personIds = { $in: personIds };
      } else {
        // 该群体下无人物，直接返回空结果
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
      }
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const data = await this.eventModel
      .find(filter)
      .populate({ path: 'personIds', model: 'Person' })
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
      .populate({ path: 'personIds', model: 'Person' })
      .populate('periodId')
      .populate('relatedEvents')
      .exec();
  }

  // 创建事件
  async create(createEventDto: CreateEventDto) {
    const dto = { ...createEventDto };

    // 自动计算影响力因子
    dto.impactFactor = this.__calcImpact(dto);

    const newEvent = new this.eventModel(dto);
    return newEvent.save();
  }

  // 更新事件
  async update(id: string, updateEventDto: CreateEventDto) {
    const dto = { ...updateEventDto };

    // 重新计算影响力因子
    dto.impactFactor = this.__calcImpact(dto);

    return this.eventModel
      .findByIdAndUpdate(id, dto, { new: true })
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

  // 计算影响力因子
  private __calcImpact(dto: CreateEventDto) {
    const calculator = new ImpactFactorCalculator();
    const result = calculator.calculate({
      title: dto.title || '',
      eventType: dto.eventType || '事件',
      location: dto.location || '',
      startDate: dto.startDate,
      endDate: dto.endDate,
      summary: dto.summary,
      detail: dto.detail,
      subEventsCount: dto.subEvents?.length || 0,
      personCount: dto.personIds?.length || 0,
    });

    return {
      dimensions: result.dimensions,
      weightedSum: result.weightedSum,
      scopeBonus: result.scopeBonus,
      scopeLabel: '',
      durationBonus: result.durationBonus,
      durationLabel: '',
      finalScore: result.finalScore,
    };
  }
}