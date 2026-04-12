import { Entity, Column } from 'typeorm';
import BaseEntity from 'src/common/base.entity';

@Entity({ name: 'location' })
export class LocationEntity extends BaseEntity {
  @Column('varchar', { length: 200, nullable: false })
  name: string;

  @Column('varchar', { length: 50, nullable: true })
  province: string;

  @Column('varchar', { length: 50, nullable: true })
  city: string;

  @Column('varchar', { length: 200, nullable: true })
  address: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column('text', { nullable: true })
  description: string;
}