import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventSummaryEntity } from './event-summary.entity';
import { EventDetailEntity } from './event-detail.entity';

@Entity({ name: 'event' })
export class EventEntity extends BaseEntity {
  @Column('varchar', { length: 200, nullable: false })
  title: string;

  @Column('date', { name: 'start_date', nullable: true })
  startDate: Date;

  @Column('date', { name: 'end_date', nullable: true })
  endDate: Date;

  @Column('boolean', { name: 'is_instant', default: false })
  isInstant: boolean;

  @Column('varchar', { length: 50, name: 'event_type', nullable: true })
  eventType: string;

  @OneToOne(() => EventSummaryEntity, (summary) => summary.event)
  summary: EventSummaryEntity;

  @OneToOne(() => EventDetailEntity, (detail) => detail.event)
  detail: EventDetailEntity;
}