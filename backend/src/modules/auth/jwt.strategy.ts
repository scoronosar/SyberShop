import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev_secret',
    });
  }

  async validate(payload: any) {
    // Always trust DB role (token may be stale if user role changed after issuing JWT).
    let role = payload.role?.toString()?.trim() || 'user';
    if (payload.sub) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: { role: true },
        });
        if (user && user.role) {
          role = user.role.toString().trim();
          this.logger.debug(`JwtStrategy: User ${payload.sub} has role: "${role}"`);
        } else {
          this.logger.warn(`JwtStrategy: User ${payload.sub} not found or has no role in database, using: "${role}"`);
        }
      } catch (error) {
        this.logger.error(`JwtStrategy: Error fetching user role: ${error.message}`);
      }
    }
    // Ensure role is always a non-empty string
    const finalRole = role && role.trim() ? role.trim() : 'user';
    this.logger.debug(`JwtStrategy: Returning user with role: "${finalRole}"`);
    return { sub: payload.sub, email: payload.email, role: finalRole };
  }
}

