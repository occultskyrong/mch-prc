import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Person extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  birthYear: number;

  @Prop()
  deathYear: number;

  @Prop({ enum: ['男', '女'] })
  gender: string;

  @Prop()
  bioSummary: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Group' }] })
  groupIds: Types.ObjectId[];
}

export const PersonSchema = SchemaFactory.createForClass(Person);