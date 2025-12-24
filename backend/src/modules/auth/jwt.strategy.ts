import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev_secret',
    });
  }

  async validate(payload: any) {
    // Backward compatibility: old tokens may not contain "role".
    let role = payload.role;
    if (!role && payload.sub) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { role: true },
      });
      role = user?.role;
    }
    return { sub: payload.sub, email: payload.email, role };
  }
}

