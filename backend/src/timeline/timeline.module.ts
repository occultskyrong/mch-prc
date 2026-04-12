import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/event/event.entity';
import { PersonEventRelationEntity } from 'src/event/person-event-relation.entity';
import { PersonGroupRelationEntity } from 'src/person/person-group-relation.entity';
import { PersonEntity } from 'src/person/person.entity';
import { GroupEntity } from 'src/group/group.entity';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      PersonEventRelationEntity,
      PersonGroupRelationEntity,
      PersonEntity,
      GroupEntity,
    ]),
  ],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}