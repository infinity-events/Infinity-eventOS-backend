import { Test, TestingModule } from '@nestjs/testing';
import { WristbandsService } from './wristbands.service';

describe('WristbandsService', () => {
  let service: WristbandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WristbandsService],
    }).compile();

    service = module.get<WristbandsService>(WristbandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
