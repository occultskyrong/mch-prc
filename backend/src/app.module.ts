import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './modules/events/events.module';
import { PersonsModule } from './modules/persons/persons.module';
import { GroupsModule } from './modules/groups/groups.module';
import { PeriodsModule } from './modules/periods/periods.module';

@Module({
  imports: [
    // MongoDB 连接
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/mch-prc'),

    // 业务模块
    EventsModule,
    PersonsModule,
    GroupsModule,
    PeriodsModule,
  ],
})
export class AppModule {}