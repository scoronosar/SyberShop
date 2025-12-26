import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserActivityModule } from '../user-activity/user-activity.module';
import { TaobaoModule } from '../taobao/taobao.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, UserActivityModule, TaobaoModule, ProductsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

