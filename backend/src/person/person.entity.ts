import { Entity, Column } from 'typeorm';
import BaseEntity from 'src/common/base.entity';

@Entity({ name: 'person' })
export class PersonEntity extends BaseEntity {
  @Column('varchar', { length: 100, nullable: false })
  name: string;

  @Column('int', { name: 'birth_year', nullable: true })
  birthYear: number;

  @Column('int', { name: 'death_year', nullable: true })
  deathYear: number;

  @Column('varchar', { length: 10, nullable: true })
  gender: string;

  @Column('text', { name: 'bio_summary', nullable: true })
  bioSummary: string;
}