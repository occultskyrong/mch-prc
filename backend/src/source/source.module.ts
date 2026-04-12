import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourceEntity } from './source.entity';
import { SourceRelationEntity } from './source-relation.entity';
import { SourceService } from './source.service';
import { SourceController } from './source.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SourceEntity, SourceRelationEntity])],
  controllers: [SourceController],
  providers: [SourceService],
  exports: [SourceService],
})
export class SourceModule {}