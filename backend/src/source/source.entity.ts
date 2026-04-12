import { Entity, Column } from 'typeorm';
import BaseEntity from 'src/common/base.entity';

@Entity({ name: 'source' })
export class SourceEntity extends BaseEntity {
  @Column('varchar', { length: 200, nullable: false })
  title: string;

  @Column('varchar', { length: 100, nullable: true })
  author: string;

  @Column('varchar', { length: 100, nullable: true })
  publisher: string;

  @Column('int', { name: 'publish_year', nullable: true })
  publishYear: number;

  @Column('varchar', { length: 500, nullable: true })
  url: string;

  @Column('varchar', { length: 50, name: 'source_type', nullable: true })
  sourceType: string;

  @Column('text', { nullable: true })
  description: string;
}