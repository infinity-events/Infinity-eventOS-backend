import { Test, TestingModule } from '@nestjs/testing';
import { FestivalsService } from './festivals.service';

describe('FestivalsService', () => {
  let service: FestivalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FestivalsService],
    }).compile();

    service = module.get<FestivalsService>(FestivalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
