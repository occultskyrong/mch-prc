import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';

@Entity({ name: 'event_relation' })
export class EventRelationEntity extends BaseEntity {
  @Column('int', { name: 'source_event_id' })
  sourceEventId: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'source_event_id' })
  sourceEvent: EventEntity;

  @Column('int', { name: 'target_event_id' })
  targetEventId: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'target_event_id' })
  targetEvent: EventEntity;

  @Column('varchar', { length: 50, nullable: true })
  relationType: string;

  @Column('text', { nullable: true })
  description: string;
}