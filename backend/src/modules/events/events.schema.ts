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

  @Prop({ type: ImpactFactorSchema })
  impactFactor: ImpactFactor;

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