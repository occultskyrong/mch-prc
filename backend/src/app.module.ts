import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { GroupModule } from './group/group.module';
import { PersonModule } from './person/person.module';
import { EventModule } from './event/event.module';
import { SourceModule } from './source/source.module';
import { LocationModule } from './location/location.module';
import { TimelineModule } from './timeline/timeline.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    GroupModule,
    PersonModule,
    EventModule,
    SourceModule,
    LocationModule,
    TimelineModule,
  ],
})
export class AppModule {}