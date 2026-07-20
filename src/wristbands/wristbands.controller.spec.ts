import { Test, TestingModule } from '@nestjs/testing';
import { WristbandsController } from './wristbands.controller';

describe('WristbandsController', () => {
  let controller: WristbandsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WristbandsController],
    }).compile();

    controller = module.get<WristbandsController>(WristbandsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
