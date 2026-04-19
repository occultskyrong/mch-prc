import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoUri } from '../../config/environment';

@Global()
@Module({
  imports: [
    MongooseModule.forRoot(getMongoUri()),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
