import { Controller, Get, Query, Redirect, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Initiate OAuth flow - redirect to TaoWorld authorization page
   * Public endpoint - security handled by TaoWorld OAuth state parameter
   */
  @Get('authorize')
  @Redirect()
  async authorize(@Query('state') state?: string) {
    const url = this.oauthService.getAuthorizationUrl(state);
    return { url };
  }

  /**
   * OAuth callback - TaoWorld redirects here with code
   */
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state?: string) {
    if (!code) {
      throw new HttpException('Authorization code missing', HttpStatus.BAD_REQUEST);
    }

    try {
      const tokenData = await this.oauthService.exchangeCodeForToken(code);
      
      // Redirect to admin page with success message
      return {
        statusCode: 200,
        message: 'TaoWorld account connected successfully',
        data: {
          account: tokenData.account,
          expiresAt: tokenData.expires_in,
        },
      };
    } catch (error) {
      throw new HttpException(
        `OAuth callback failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get OAuth connection status
   * Public endpoint - returns only connection status, no sensitive data
   */
  @Get('status')
  async getStatus() {
    const status = await this.oauthService.getOAuthStatus();
    return {
      statusCode: 200,
      data: status,
    };
  }

  /**
   * Manual token refresh endpoint
   * Admin only
   */
  @Get('refresh')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async refreshToken() {
    try {
      const token = await this.oauthService.getValidAccessToken();
      
      if (!token) {
        throw new HttpException('No valid token to refresh', HttpStatus.BAD_REQUEST);
      }

      return {
        statusCode: 200,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Token refresh failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

