import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { checkDatabase } from '@portfolio/database';
import type { Environment } from '../config/environment';

@Injectable()
export class DatabaseService {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  async checkConnection(): Promise<void> {
    await checkDatabase(this.config.get('DATABASE_URL', { infer: true }));
  }
}
