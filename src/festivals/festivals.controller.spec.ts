import { Test, TestingModule } from '@nestjs/testing';
import { FestivalsController } from './festivals.controller';

describe('FestivalsController', () => {
  let controller: FestivalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FestivalsController],
    }).compile();

    controller = module.get<FestivalsController>(FestivalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
