import { Module } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserActivityService],
  exports: [UserActivityService],
})
export class UserActivityModule {}

