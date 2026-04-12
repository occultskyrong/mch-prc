import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { PersonEntity } from './person.entity';
import { GroupEntity } from 'src/group/group.entity';

@Entity({ name: 'person_group_relation' })
export class PersonGroupRelationEntity extends BaseEntity {
  @Column('int', { name: 'person_id' })
  personId: number;

  @ManyToOne(() => PersonEntity)
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @Column('int', { name: 'group_id' })
  groupId: number;

  @ManyToOne(() => GroupEntity)
  @JoinColumn({ name: 'group_id' })
  group: GroupEntity;

  @Column('date', { name: 'start_date', nullable: true })
  startDate: Date;

  @Column('date', { name: 'end_date', nullable: true })
  endDate: Date;

  @Column('varchar', { length: 100, nullable: true })
  role: string;
}