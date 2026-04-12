import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonEntity } from './person.entity';
import { PersonGroupRelationEntity } from './person-group-relation.entity';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { GroupModule } from 'src/group/group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonEntity, PersonGroupRelationEntity]),
    GroupModule,
  ],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService],
})
export class PersonModule {}