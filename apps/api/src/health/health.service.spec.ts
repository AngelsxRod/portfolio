import { Test } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports a healthy database', async () => {
    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DatabaseService,
          useValue: { checkConnection: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    await expect(module.get(HealthService).check()).resolves.toMatchObject({
      status: 'ok',
      database: 'ok',
    });
  });

  it('reports a database outage', async () => {
    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DatabaseService,
          useValue: { checkConnection: jest.fn().mockRejectedValue(new Error('offline')) },
        },
      ],
    }).compile();

    await expect(module.get(HealthService).check()).resolves.toMatchObject({
      status: 'error',
      database: 'error',
    });
  });
});
