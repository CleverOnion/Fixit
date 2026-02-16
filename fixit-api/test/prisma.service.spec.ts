import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have user model', () => {
    expect(service.user).toBeDefined();
  });

  it('should have question model', () => {
    expect(service.question).toBeDefined();
  });

  it('should have tag model', () => {
    expect(service.tag).toBeDefined();
  });

  it('should have questionTag model', () => {
    expect(service.questionTag).toBeDefined();
  });

  it('should have reviewLog model', () => {
    expect(service.reviewLog).toBeDefined();
  });
});
