import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';
import { GroupEntity } from 'src/group/group.entity';

@Entity({ name: 'event_location_relation' })
export class EventLocationRelationEntity extends BaseEntity {
  @Column('int', { name: 'event_id' })
  eventId: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('int', { name: 'location_id' })
  locationId: number;

  @ManyToOne(() => GroupEntity)
  @JoinColumn({ name: 'location_id' })
  location: GroupEntity;

  @Column('varchar', { length: 50, nullable: true })
  relationType: string;

  @Column('text', { nullable: true })
  description: string;
}