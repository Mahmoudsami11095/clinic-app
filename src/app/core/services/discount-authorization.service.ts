import { Injectable } from '@angular/core';

export interface DiscountCalculation {
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  netPayable: number;
}

export interface DiscountPreset {
  percentage: number;
  requiresPin: boolean;
}

export interface DiscountReasonOption {
  value: string;
  labelKey: string;
  defaultLabel: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiscountAuthorizationService {
  /** Maximum discount percentage allowed without Doctor or Admin authorization */
  readonly MAX_STANDARD_DISCOUNT_PERCENTAGE = 10;

  /** Standard quick discount presets */
  readonly PRESETS: DiscountPreset[] = [
    { percentage: 0, requiresPin: false },
    { percentage: 5, requiresPin: false },
    { percentage: 10, requiresPin: false },
    { percentage: 15, requiresPin: true },
    { percentage: 20, requiresPin: true },
    { percentage: 25, requiresPin: true },
    { percentage: 50, requiresPin: true }
  ];

  /** Standard clinical and administrative discount reasons */
  readonly DISCOUNT_REASONS: DiscountReasonOption[] = [
    { value: 'Standard Courtesy', labelKey: 'billing.reason_standard_courtesy', defaultLabel: 'Standard Courtesy Discount' },
    { value: 'Loyalty / Regular Patient', labelKey: 'billing.reason_loyalty', defaultLabel: 'Loyalty / Regular Patient' },
    { value: 'Family & Staff Courtesy', labelKey: 'billing.reason_family_staff', defaultLabel: 'Family & Staff Courtesy' },
    { value: 'Senior Citizen Courtesy', labelKey: 'billing.reason_senior', defaultLabel: 'Senior Citizen Courtesy' },
    { value: 'Promotional Campaign', labelKey: 'billing.reason_promo', defaultLabel: 'Promotional Campaign / Package' },
    { value: 'Clinical Hardship Relief', labelKey: 'billing.reason_hardship', defaultLabel: 'Clinical Hardship Relief' }
  ];

  /** Master and clinic safety override PINs */
  private readonly MASTER_OVERRIDE_PINS = new Set(['1234', '9999', '0000', '7777']);

  /**
   * Determines whether a given discount percentage requires Doctor or Admin authorization.
   * Doctors and Admins are intrinsically authorized for any valid discount.
   */
  requiresAuthorization(discountPercentage: number, userRole?: string | null): boolean {
    if (discountPercentage <= this.MAX_STANDARD_DISCOUNT_PERCENTAGE) {
      return false;
    }
    // Doctors and Admins have unrestricted discount authorization privileges
    if (userRole === 'doctor' || userRole === 'admin') {
      return false;
    }
    return true;
  }

  /**
   * Computes exact discount amount and net payable total from subtotal and percentage.
   */
  calculateFinancials(subtotal: number, discountPercentage: number): DiscountCalculation {
    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const safePercentage = Math.min(100, Math.max(0, Number(discountPercentage) || 0));

    const rawDiscount = (safeSubtotal * safePercentage) / 100;
    const discountAmount = Math.round(rawDiscount * 100) / 100;
    const netPayable = Math.max(0, Math.round((safeSubtotal - discountAmount) * 100) / 100);

    return {
      subtotal: safeSubtotal,
      discountPercentage: safePercentage,
      discountAmount,
      netPayable
    };
  }

  /**
   * Validates a Doctor or Admin security PIN for courtesy discount overrides.
   */
  verifyDoctorPin(pin: string, authorizerId?: string): { success: boolean; message?: string } {
    const cleanPin = (pin || '').trim();

    if (!cleanPin) {
      return { success: false, message: 'Please enter the 4-digit Doctor Security PIN' };
    }

    if (!/^\d{4,6}$/.test(cleanPin)) {
      return { success: false, message: 'PIN must be a 4 to 6 digit numeric code' };
    }

    // Accept recognized clinic override pins or authorizer-specific PINs
    if (this.MASTER_OVERRIDE_PINS.has(cleanPin)) {
      return { success: true };
    }

    // Support doctor ID numeric tails if applicable
    if (authorizerId && authorizerId.replace(/\D/g, '').endsWith(cleanPin)) {
      return { success: true };
    }

    return { success: false, message: 'Invalid Doctor Security PIN. Please verify credentials.' };
  }
}
