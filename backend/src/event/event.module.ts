import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './event.entity';
import { EventSummaryEntity } from './event-summary.entity';
import { EventDetailEntity } from './event-detail.entity';
import { EventRelationEntity } from './event-relation.entity';
import { PersonEventRelationEntity } from './person-event-relation.entity';
import { EventLocationRelationEntity } from './event-location-relation.entity';
import { EventService } from './event.service';
import { EventController } from './event.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      EventSummaryEntity,
      EventDetailEntity,
      EventRelationEntity,
      PersonEventRelationEntity,
      EventLocationRelationEntity,
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}