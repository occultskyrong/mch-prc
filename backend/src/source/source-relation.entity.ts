import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';
import { SourceEntity } from './source.entity';

export type SourceTargetType = 'event_summary' | 'event_detail' | 'person' | 'group';

@Entity({ name: 'source_relation' })
export class SourceRelationEntity extends BaseEntity {
  @Column('int', { name: 'source_id' })
  sourceId: number;

  @ManyToOne(() => SourceEntity)
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity;

  @Column('varchar', { length: 50, name: 'target_type' })
  targetType: SourceTargetType;

  @Column('int', { name: 'target_id' })
  targetId: number;

  @Column('varchar', { length: 100, nullable: true })
  citation: string;

  @Column('text', { nullable: true })
  note: string;
}