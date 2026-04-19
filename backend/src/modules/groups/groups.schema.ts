import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'groups' })
export class Group extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  color: string;

  @Prop({ type: Types.ObjectId, ref: 'Group' })
  parentId: Types.ObjectId;

  @Prop()
  type: string;

  @Prop()
  description: string;
}

export const GroupSchema = SchemaFactory.createForClass(Group);