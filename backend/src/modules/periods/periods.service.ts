import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Period } from './periods.schema';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectModel(Period.name)
    private periodModel: Model<Period>,
  ) {}

  async findAll() {
    return this.periodModel.find().sort({ order: 1 }).exec();
  }

  async findOne(id: string) {
    return this.periodModel.findById(id).exec();
  }
}