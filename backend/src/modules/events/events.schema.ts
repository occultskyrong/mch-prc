import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// 子事件 Schema
@Schema()
export class SubEvent {
  @Prop({ required: true })
  title: string;

  @Prop()
  date: Date;

  @Prop()
  content: string;
}

export const SubEventSchema = SchemaFactory.createForClass(SubEvent);

// 事件详情 Schema
@Schema()
export class EventDetail {
  @Prop()
  motive: string;

  @Prop()
  process: string;

  @Prop()
  result: string;

  @Prop()
  impact: string;
}

export const EventDetailSchema = SchemaFactory.createForClass(EventDetail);

// 主事件 Schema
@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ enum: ['战争', '条约', '起义', '改革', '事件'] })
  eventType: string;

  @Prop()
  location: string;

  @Prop()
  summary: string;

  @Prop({ type: EventDetailSchema })
  detail: EventDetail;

  @Prop()
  impactFactor: number;

  @Prop({ type: Types.ObjectId, ref: 'Period' })
  periodId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Person' }] })
  personIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Event' }] })
  relatedEvents: Types.ObjectId[];

  @Prop({ type: [SubEventSchema] })
  subEvents: SubEvent[];

  @Prop()
  source: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);