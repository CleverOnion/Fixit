import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../../../src/modules/auth/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user payload from JWT', async () => {
      const mockPayload = {
        sub: 'test-uuid',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        sub: 'test-uuid',
        email: 'test@example.com',
      });
    });

    it('should only return sub and email fields', async () => {
      const mockPayload = {
        sub: 'test-uuid',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
        extraField: 'should be ignored',
      };

      const result = await strategy.validate(mockPayload);

      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
      expect(result).not.toHaveProperty('extraField');
      expect(result).toHaveProperty('sub');
      expect(result).toHaveProperty('email');
    });
  });
});
