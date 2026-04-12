import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/base.entity';

@Entity({ name: 'group' })
export class GroupEntity extends BaseEntity {
  @Column('varchar', { length: 100, nullable: false })
  name: string;

  @Column('int', { name: 'parent_id', nullable: true })
  parentId: number;

  @ManyToOne(() => GroupEntity, (group) => group.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: GroupEntity;

  @OneToMany(() => GroupEntity, (group) => group.parent)
  children: GroupEntity[];

  @Column('varchar', { length: 50, name: 'type', nullable: true })
  type: string;

  @Column('text', { nullable: true })
  description: string;
}