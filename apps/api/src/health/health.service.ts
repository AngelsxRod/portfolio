import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@portfolio/contracts';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  async check(): Promise<HealthResponse> {
    try {
      await this.database.checkConnection();
      return { status: 'ok', database: 'ok', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', database: 'error', timestamp: new Date().toISOString() };
    }
  }
}
