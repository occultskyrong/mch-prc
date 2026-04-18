import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Period extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  years: string;

  @Prop({ required: true })
  startYear: number;

  @Prop({ required: true })
  endYear: number;

  @Prop({ required: true })
  color: string;

  @Prop()
  description: string;

  @Prop()
  order: number;
}

export const PeriodSchema = SchemaFactory.createForClass(Period);