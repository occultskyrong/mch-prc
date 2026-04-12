import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';

@Entity({ name: 'event_summary' })
export class EventSummaryEntity extends BaseEntity {
  @Column('int', { name: 'event_id' })
  eventId: number;

  @OneToOne(() => EventEntity, (event) => event.summary)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('text', { nullable: true })
  content: string;
}