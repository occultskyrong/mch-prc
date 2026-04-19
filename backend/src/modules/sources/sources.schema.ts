import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Source extends Document {
  @Prop({ required: true })
  id: number;

  @Prop()
  alias: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  author: string;

  @Prop()
  publisher: string;

  @Prop()
  publishYear: number;

  @Prop()
  url: string;

  @Prop()
  type: string;

  @Prop()
  reliability: number;

  @Prop()
  description: string;
}

export const SourceSchema = SchemaFactory.createForClass(Source);
