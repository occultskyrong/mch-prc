import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from './groups.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name)
    private groupModel: Model<Group>,
  ) {}

  async findAll() {
    return this.groupModel.find().populate('parentId').exec();
  }

  async findOne(id: string) {
    return this.groupModel.findById(id).exec();
  }
}