import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Person } from './persons.schema';

@Injectable()
export class PersonsService {
  constructor(
    @InjectModel(Person.name)
    private personModel: Model<Person>,
  ) {}

  async findAll(page = 1, pageSize = 10, groupId?: string) {
    const skip = (page - 1) * pageSize;
    const filter: any = {};

    if (groupId) {
      filter.groupIds = groupId;
    }

    const data = await this.personModel
      .find(filter)
      .populate('groupIds')
      .skip(skip)
      .limit(pageSize)
      .exec();

    const total = await this.personModel.countDocuments(filter);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    return this.personModel.findById(id).populate('groupIds').exec();
  }
}