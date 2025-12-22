import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImageSearchService } from './image-search.service';
import { ImageSearchController } from './image-search.controller';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [HttpModule, OAuthModule],
  controllers: [ImageSearchController],
  providers: [ImageSearchService],
  exports: [ImageSearchService],
})
export class ImageSearchModule {}

