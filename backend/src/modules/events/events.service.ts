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
    const { page = 1, pageSize = 10, year, startYear, endYear, eventType, eventLevel, groupId, parentEventId, search } = query;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const filter: any = {};

    // 默认只返回主事件（eventLevel=0），除非指定了 eventLevel 或 parentEventId
    if (eventLevel !== undefined && eventLevel !== null) {
      filter.eventLevel = eventLevel;
    } else if (parentEventId) {
      filter.parentEventId = parentEventId;
    } else {
      filter.eventLevel = 0;
    }

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
      const PersonModel = this.eventModel.db.model('Person');
      const personsInGroup = await PersonModel.find({ groupIds: groupId }, '_id');
      const personIds = personsInGroup.map(p => p._id);
      if (personIds.length > 0) {
        filter.personIds = { $in: personIds };
      } else {
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

  // 获取单个事件及其子事件
  async findOne(id: string) {
    const event = await this.eventModel
      .findById(id)
      .populate({ path: 'personIds', model: 'Person' })
      .populate('periodId')
      .populate('relatedEvents')
      .exec();

    if (!event) return null;

    // 查询子事件
    const subEvents = await this.eventModel
      .find({ parentEventId: id })
      .populate({ path: 'personIds', model: 'Person' })
      .populate('periodId')
      .sort({ startDate: 1 })
      .exec();

    return {
      ...event.toObject(),
      subEvents,
    };
  }

  // 创建事件
  async create(createEventDto: CreateEventDto) {
    const dto = { ...createEventDto };

    // 自动计算影响力因子
    dto.impactFactor = await this.__calcImpact(dto);

    const newEvent = new this.eventModel(dto);
    return newEvent.save();
  }

  // 更新事件
  async update(id: string, updateEventDto: CreateEventDto) {
    const dto = { ...updateEventDto };

    // 重新计算影响力因子
    dto.impactFactor = await this.__calcImpact(dto);

    return this.eventModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
  }

  // 删除事件
  async remove(id: string) {
    // 级联删除子事件
    await this.eventModel.deleteMany({ parentEventId: id }).exec();
    await this.eventModel.findByIdAndDelete(id).exec();
    return { success: true };
  }

  // 获取统计数据
  async getStats() {
    const total = await this.eventModel.countDocuments();

    const byType = await this.eventModel.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);

    const byLevel = await this.eventModel.aggregate([
      { $group: { _id: '$eventLevel', count: { $sum: 1 } } },
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

    return { total, byType, byLevel, byYear };
  }

  // 计算影响力因子
  private async __calcImpact(dto: CreateEventDto) {
    const calculator = new ImpactFactorCalculator();

    // 如果是主事件，查询子事件数量
    const subEventsCount = (dto.eventLevel ?? 0) === 0
      ? await this.eventModel.countDocuments({ parentEventId: dto.parentEventId ?? null }).exec()
      : 0;

    const result = calculator.calculate({
      title: dto.title || '',
      eventType: dto.eventType || 5,
      eventLevel: dto.eventLevel ?? 0,
      location: dto.location || '',
      startDate: dto.startDate,
      endDate: dto.endDate,
      summary: dto.summary,
      detail: dto.detail,
      subEventsCount,
      personCount: dto.personIds?.length || 0,
    });

    return {
      dimensions: result.dimensions,
      weightedSum: result.weightedSum,
      finalScore: result.finalScore,
    };
  }
}
