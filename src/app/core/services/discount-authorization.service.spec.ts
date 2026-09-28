import { TestBed } from '@angular/core/testing';
import { DiscountAuthorizationService } from './discount-authorization.service';

describe('DiscountAuthorizationService (BR-FIN-01)', () => {
  let service: DiscountAuthorizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiscountAuthorizationService]
    });
    service = TestBed.inject(DiscountAuthorizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Standard Courtesy Cap Rules', () => {
    it('should NOT require authorization for 0% discount', () => {
      expect(service.requiresAuthorization(0, 'assistant')).toBeFalse();
    });

    it('should NOT require authorization for discounts up to 10% for assistants', () => {
      expect(service.requiresAuthorization(5, 'assistant')).toBeFalse();
      expect(service.requiresAuthorization(10, 'assistant')).toBeFalse();
    });

    it('should REQUIRE authorization for discounts exceeding 10% for assistants', () => {
      expect(service.requiresAuthorization(10.5, 'assistant')).toBeTrue();
      expect(service.requiresAuthorization(15, 'assistant')).toBeTrue();
      expect(service.requiresAuthorization(25, 'assistant')).toBeTrue();
      expect(service.requiresAuthorization(50, 'assistant')).toBeTrue();
    });

    it('should NEVER require authorization for doctors or admins regardless of percentage', () => {
      expect(service.requiresAuthorization(15, 'doctor')).toBeFalse();
      expect(service.requiresAuthorization(50, 'doctor')).toBeFalse();
      expect(service.requiresAuthorization(100, 'doctor')).toBeFalse();

      expect(service.requiresAuthorization(20, 'admin')).toBeFalse();
      expect(service.requiresAuthorization(80, 'admin')).toBeFalse();
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate 0% discount correctly', () => {
      const result = service.calculateFinancials(200, 0);
      expect(result.subtotal).toBe(200);
      expect(result.discountPercentage).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.netPayable).toBe(200);
    });

    it('should calculate standard 10% courtesy discount correctly', () => {
      const result = service.calculateFinancials(500, 10);
      expect(result.subtotal).toBe(500);
      expect(result.discountPercentage).toBe(10);
      expect(result.discountAmount).toBe(50);
      expect(result.netPayable).toBe(450);
    });

    it('should round fractional cents with currency precision', () => {
      const result = service.calculateFinancials(333.33, 15);
      expect(result.subtotal).toBe(333.33);
      expect(result.discountPercentage).toBe(15);
      expect(result.discountAmount).toBe(50);
      expect(result.netPayable).toBe(283.33);
    });

    it('should clamp negative values safely', () => {
      const result = service.calculateFinancials(-100, -10);
      expect(result.subtotal).toBe(0);
      expect(result.discountPercentage).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.netPayable).toBe(0);
    });
  });

  describe('Doctor PIN Validation', () => {
    it('should reject empty or missing PIN', () => {
      const result = service.verifyDoctorPin('');
      expect(result.success).toBeFalse();
      expect(result.message).toContain('Please enter');
    });

    it('should reject non-numeric or malformed PINs', () => {
      const result = service.verifyDoctorPin('abcd');
      expect(result.success).toBeFalse();
      expect(result.message).toContain('numeric code');
    });

    it('should accept recognized master override PIN 1234', () => {
      const result = service.verifyDoctorPin('1234');
      expect(result.success).toBeTrue();
    });

    it('should accept recognized master override PIN 9999', () => {
      const result = service.verifyDoctorPin('9999');
      expect(result.success).toBeTrue();
    });

    it('should reject invalid PIN', () => {
      const result = service.verifyDoctorPin('4321');
      expect(result.success).toBeFalse();
      expect(result.message).toContain('Invalid Doctor Security PIN');
    });
  });
});
