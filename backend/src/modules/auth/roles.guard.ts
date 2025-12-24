import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      return false;
    }

    if (!user.role) {
      this.logger.warn(`RolesGuard: User has no role. User: ${JSON.stringify({ sub: user.sub, email: user.email })}`);
      return false;
    }

    const userRole = user.role.toString().trim().toLowerCase();
    const normalizedRequiredRoles = requiredRoles.map((r) => r.toString().trim().toLowerCase());
    const hasAccess = normalizedRequiredRoles.includes(userRole);
    
    if (!hasAccess) {
      this.logger.warn(`RolesGuard: Access denied. User role: "${userRole}", Required roles: ${JSON.stringify(normalizedRequiredRoles)}, User: ${JSON.stringify({ sub: user.sub, email: user.email })}`);
    } else {
      this.logger.debug(`RolesGuard: Access granted. User role: "${userRole}"`);
    }
    
    return hasAccess;
  }
}

