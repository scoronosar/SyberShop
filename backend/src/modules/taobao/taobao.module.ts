import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TaobaoService } from './taobao.service';
import { OAuthModule } from '../oauth/oauth.module';

@Module({
  imports: [HttpModule, OAuthModule],
  providers: [TaobaoService],
  exports: [TaobaoService],
})
export class TaobaoModule {}

