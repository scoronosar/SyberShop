import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../auth/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Get('orders')
  orders() {
    return this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('analytics/logistics')
  async analytics() {
    const cargos = await this.prisma.cargo.findMany();
    return {
      cargos: cargos.length,
      arrived: cargos.filter((c) => c.status === 'arrived').length,
    };
  }

  @Post('create-admin')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.register({ ...dto, role: 'admin' } as any, true);
  }
}

