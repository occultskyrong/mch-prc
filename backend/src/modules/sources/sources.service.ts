import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Source } from './sources.schema';

@Injectable()
export class SourcesService {
  constructor(
    @InjectModel(Source.name) private sourceModel: Model<Source>,
  ) {}

  async findAll(): Promise<Source[]> {
    return this.sourceModel.find().sort({ id: 1 });
  }

  async findById(id: number): Promise<Source | null> {
    return this.sourceModel.findOne({ id });
  }

  async findByAlias(alias: string): Promise<Source | null> {
    return this.sourceModel.findOne({ alias });
  }
}
