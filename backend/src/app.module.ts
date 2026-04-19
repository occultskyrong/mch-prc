import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { EventsModule } from './modules/events/events.module';
import { PersonsModule } from './modules/persons/persons.module';
import { GroupsModule } from './modules/groups/groups.module';
import { PeriodsModule } from './modules/periods/periods.module';
import { SourcesModule } from './modules/sources/sources.module';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    PersonsModule,
    GroupsModule,
    PeriodsModule,
    SourcesModule,
  ],
})
export class AppModule {}