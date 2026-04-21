import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// 带来源标记的详情字段 Schema
@Schema()
export class EventDetailField {
  @Prop({ required: true })
  content: string;

  @Prop({ type: [Number] })
  sourceIds: number[];
}

export const EventDetailFieldSchema = SchemaFactory.createForClass(EventDetailField);

// 事件详情 Schema
@Schema()
export class EventDetail {
  @Prop({ type: [EventDetailFieldSchema, String] })
  motive: EventDetailField | string;

  @Prop({ type: [EventDetailFieldSchema, String] })
  process: EventDetailField | string;

  @Prop({ type: [EventDetailFieldSchema, String] })
  result: EventDetailField | string;

  @Prop({ type: [EventDetailFieldSchema, String] })
  impact: EventDetailField | string;
}

export const EventDetailSchema = SchemaFactory.createForClass(EventDetail);

// 单维度评分 Schema
@Schema()
export class DimensionScore {
  @Prop()
  score: number;

  @Prop()
  rationale: string;
}

export const DimensionScoreSchema = SchemaFactory.createForClass(DimensionScore);

// 影响力因子结构化 Schema
@Schema()
export class ImpactFactor {
  @Prop({ type: Map, of: DimensionScoreSchema })
  dimensions: Map<string, DimensionScore>;

  @Prop()
  weightedSum: number;

  @Prop()
  scopeBonus: number;

  @Prop()
  scopeLabel: string;

  @Prop()
  durationBonus: number;

  @Prop()
  durationLabel: string;

  @Prop()
  finalScore: number;
}

export const ImpactFactorSchema = SchemaFactory.createForClass(ImpactFactor);

// 事件 Schema
@Schema({ timestamps: true, collection: 'events' })
export class Event extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ type: Number })
  eventType: number;

  @Prop({ type: Number, default: 0 })
  eventLevel: number;

  @Prop()
  location: string;

  @Prop()
  summary: string;

  @Prop({ type: EventDetailSchema })
  detail: EventDetail;

  @Prop({ type: ImpactFactorSchema })
  impactFactor: ImpactFactor;

  @Prop({ type: Types.ObjectId, ref: 'Period' })
  periodId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event' })
  parentEventId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Person' }] })
  personIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Event' }] })
  relatedEvents: Types.ObjectId[];

  @Prop({ type: [Number] })
  sourceIds: number[];
}

export const EventSchema = SchemaFactory.createForClass(Event);
