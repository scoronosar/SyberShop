import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { LogisticsService } from './logistics.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { ArriveCargoDto } from './dto/arrive-cargo.dto';
import { Roles } from '../auth/roles.decorator';

@ApiTags('logistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logistics: LogisticsService) {}

  @Post('cargo/create')
  @Roles('admin')
  create(@Body() dto: CreateCargoDto) {
    return this.logistics.createCargo(dto);
  }

  @Post('cargo/:id/arrive')
  @Roles('admin')
  arrive(@Param('id') id: string, @Body() dto: ArriveCargoDto) {
    return this.logistics.arrive(id, dto);
  }

  @Get('order/:id/tracking')
  tracking(@Param('id') id: string) {
    return this.logistics.tracking(id);
  }
}

