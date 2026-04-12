import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { EventEntity } from './event.entity';
import { PersonEntity } from 'src/person/person.entity';

@Entity({ name: 'person_event_relation' })
export class PersonEventRelationEntity extends BaseEntity {
  @Column('int', { name: 'person_id' })
  personId: number;

  @ManyToOne(() => PersonEntity)
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @Column('int', { name: 'event_id' })
  eventId: number;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column('varchar', { length: 50, nullable: true })
  role: string;

  @Column('text', { nullable: true })
  description: string;
}