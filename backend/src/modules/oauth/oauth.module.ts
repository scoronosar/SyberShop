import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [OAuthController],
  providers: [OAuthService],
  exports: [OAuthService],
})
export class OAuthModule {}

