import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly appKey = process.env.TAOBAO_APP_KEY || '';
  private readonly appSecret = process.env.TAOBAO_APP_SECRET || '';
  private readonly apiUrl = 'https://api.taobao.global/rest';
  private readonly oauthUrl = 'https://api.taobao.global/oauth/authorize';
  private readonly redirectUri = process.env.TAOBAO_REDIRECT_URI || 'http://localhost:4000/api/oauth/callback';

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const paramsObj: Record<string, string> = {
      response_type: 'code',
      client_id: this.appKey,
      redirect_uri: this.redirectUri,
      force_auth: 'true',
    };

    if (state) {
      paramsObj.state = state;
    }

    const params = new URLSearchParams(paramsObj);
    return `${this.oauthUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const apiPath = '/auth/token/create';
      const timestamp = Date.now().toString();

      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        code,
      };

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Exchanging code for token via ${apiPath}`);
      
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      if (response.data?.code !== '0') {
        this.logger.error(`Token exchange failed: ${JSON.stringify(response.data)}`);
        throw new Error(`Token exchange failed: ${response.data?.error_msg || 'Unknown error'}`);
      }

      const tokenData = response.data;
      
      // Calculate expiration dates
      const expiresAt = new Date(Date.now() + parseInt(tokenData.expires_in) * 1000);
      const refreshExpiresAt = tokenData.refresh_expires_in 
        ? new Date(Date.now() + parseInt(tokenData.refresh_expires_in) * 1000)
        : undefined;

      // Store token in database
      await this.storeToken({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        refreshExpiresAt,
        accountId: tokenData.account_id,
        sellerId: tokenData.seller_id,
        userId: tokenData.user_id,
        accountPlatform: tokenData.account_platform,
        shortCode: tokenData.short_code,
        account: tokenData.account,
      });

      this.logger.log(`Token stored successfully for account: ${tokenData.account}`);
      return tokenData;
    } catch (error) {
      this.logger.error(`Failed to exchange code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const apiPath = '/auth/token/refresh';
      const timestamp = Date.now().toString();

      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        refresh_token: refreshToken,
      };

      params.sign = this.generateSign(apiPath, params);

      this.logger.log(`Refreshing access token via ${apiPath}`);
      
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}${apiPath}`, { params, timeout: 10000 }),
      );

      if (response.data?.code !== '0') {
        this.logger.error(`Token refresh failed: ${JSON.stringify(response.data)}`);
        throw new Error(`Token refresh failed: ${response.data?.error_msg || 'Unknown error'}`);
      }

      const tokenData = response.data;
      
      // Calculate expiration dates
      const expiresAt = new Date(Date.now() + parseInt(tokenData.expires_in) * 1000);
      const refreshExpiresAt = tokenData.refresh_expires_in 
        ? new Date(Date.now() + parseInt(tokenData.refresh_expires_in) * 1000)
        : undefined;

      // Update token in database
      await this.storeToken({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        refreshExpiresAt,
        accountId: tokenData.account_id,
        sellerId: tokenData.seller_id,
        userId: tokenData.user_id,
        accountPlatform: tokenData.account_platform,
        shortCode: tokenData.short_code,
        account: tokenData.account,
      });

      this.logger.log(`Token refreshed successfully for account: ${tokenData.account}`);
      return tokenData;
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get valid access token (auto-refresh if needed)
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      // Get the most recent token
      const tokenRecord = await this.prisma.taoworldToken.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!tokenRecord) {
        this.logger.warn('No TaoWorld token found in database');
        return null;
      }

      const now = new Date();
      
      // If token expires in less than 7 days, try to refresh
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (tokenRecord.expiresAt < sevenDaysFromNow && tokenRecord.refreshToken && tokenRecord.refreshExpiresAt && tokenRecord.refreshExpiresAt > now) {
        this.logger.log('Access token expiring soon, refreshing...');
        const refreshed = await this.refreshAccessToken(tokenRecord.refreshToken);
        return refreshed.access_token;
      }

      // If token is still valid
      if (tokenRecord.expiresAt > now) {
        return tokenRecord.accessToken;
      }

      // Token expired and cannot be refreshed
      this.logger.warn('Access token expired and cannot be refreshed');
      return null;
    } catch (error) {
      this.logger.error(`Failed to get valid access token: ${error.message}`);
      return null;
    }
  }

  /**
   * Store token in database (upsert)
   */
  private async storeToken(data: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    refreshExpiresAt?: Date;
    accountId?: string;
    sellerId?: string;
    userId?: string;
    accountPlatform?: string;
    shortCode?: string;
    account?: string;
  }) {
    await this.prisma.taoworldToken.upsert({
      where: { accessToken: data.accessToken },
      create: data,
      update: data,
    });
  }

  /**
   * Check if we have a valid token
   */
  async hasValidToken(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return token !== null;
  }

  /**
   * Get OAuth status
   */
  async getOAuthStatus(): Promise<{
    connected: boolean;
    account?: string;
    expiresAt?: Date;
  }> {
    const tokenRecord = await this.prisma.taoworldToken.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return { connected: false };
    }

    const now = new Date();
    const connected = tokenRecord.expiresAt > now;

    return {
      connected,
      account: tokenRecord.account || undefined,
      expiresAt: tokenRecord.expiresAt,
    };
  }

  /**
   * Generate signature for API requests
   */
  private generateSign(apiPath: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join('');
    const signString = apiPath + sorted;
    const sign = crypto
      .createHmac('sha256', this.appSecret)
      .update(signString)
      .digest('hex')
      .toUpperCase();
    return sign;
  }
}

