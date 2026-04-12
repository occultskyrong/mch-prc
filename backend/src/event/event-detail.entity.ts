import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';

@Entity({ name: 'event_detail' })
export class EventDetailEntity extends BaseEntity {
  @Column('int', { name: 'event_id' })
  eventId: number;

  @OneToOne(() => EventEntity, (event) => event.detail)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('text', { nullable: true })
  motive: string;

  @Column('text', { nullable: true })
  process: string;

  @Column('text', { nullable: true })
  result: string;

  @Column('text', { nullable: true })
  impact: string;
}