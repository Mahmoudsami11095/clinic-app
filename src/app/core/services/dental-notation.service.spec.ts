import { TestBed } from '@angular/core/testing';
import { DentalNotationService } from './dental-notation.service';

describe('DentalNotationService (BR-DEN-01)', () => {
  let service: DentalNotationService;

  beforeEach(() => {
    localStorage.removeItem(DentalNotationService.STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [DentalNotationService]
    });
    service = TestBed.inject(DentalNotationService);
  });

  afterEach(() => {
    localStorage.removeItem(DentalNotationService.STORAGE_KEY);
  });

  it('should be created and default to FDI notation', () => {
    expect(service).toBeTruthy();
    expect(service.notation()).toBe('FDI');
  });

  it('should toggle notation between FDI and UNIVERSAL', () => {
    expect(service.notation()).toBe('FDI');
    service.toggleNotation();
    expect(service.notation()).toBe('UNIVERSAL');
    service.toggleNotation();
    expect(service.notation()).toBe('FDI');
  });

  describe('Adult Permanent Dentition Mappings (11-48 to 1-32)', () => {
    it('should map Maxillary Right Quadrant 1 (18-11 to 1-8)', () => {
      expect(service.toUniversal(18)).toBe('1');
      expect(service.toUniversal(17)).toBe('2');
      expect(service.toUniversal(16)).toBe('3');
      expect(service.toUniversal(15)).toBe('4');
      expect(service.toUniversal(14)).toBe('5');
      expect(service.toUniversal(13)).toBe('6');
      expect(service.toUniversal(12)).toBe('7');
      expect(service.toUniversal(11)).toBe('8');
    });

    it('should map Maxillary Left Quadrant 2 (21-28 to 9-16)', () => {
      expect(service.toUniversal(21)).toBe('9');
      expect(service.toUniversal(22)).toBe('10');
      expect(service.toUniversal(23)).toBe('11');
      expect(service.toUniversal(24)).toBe('12');
      expect(service.toUniversal(25)).toBe('13');
      expect(service.toUniversal(26)).toBe('14');
      expect(service.toUniversal(27)).toBe('15');
      expect(service.toUniversal(28)).toBe('16');
    });

    it('should map Mandibular Left Quadrant 3 (38-31 to 17-24)', () => {
      expect(service.toUniversal(38)).toBe('17');
      expect(service.toUniversal(37)).toBe('18');
      expect(service.toUniversal(36)).toBe('19');
      expect(service.toUniversal(35)).toBe('20');
      expect(service.toUniversal(34)).toBe('21');
      expect(service.toUniversal(33)).toBe('22');
      expect(service.toUniversal(32)).toBe('23');
      expect(service.toUniversal(31)).toBe('24');
    });

    it('should map Mandibular Right Quadrant 4 (41-48 to 25-32)', () => {
      expect(service.toUniversal(41)).toBe('25');
      expect(service.toUniversal(42)).toBe('26');
      expect(service.toUniversal(43)).toBe('27');
      expect(service.toUniversal(44)).toBe('28');
      expect(service.toUniversal(45)).toBe('29');
      expect(service.toUniversal(46)).toBe('30');
      expect(service.toUniversal(47)).toBe('31');
      expect(service.toUniversal(48)).toBe('32');
    });
  });

  describe('Primary Deciduous Dentition Mappings (51-85 to A-T)', () => {
    it('should map Primary Maxillary Right Quadrant 5 (55-51 to A-E)', () => {
      expect(service.toUniversal(55)).toBe('A');
      expect(service.toUniversal(54)).toBe('B');
      expect(service.toUniversal(53)).toBe('C');
      expect(service.toUniversal(52)).toBe('D');
      expect(service.toUniversal(51)).toBe('E');
    });

    it('should map Primary Maxillary Left Quadrant 6 (61-65 to F-J)', () => {
      expect(service.toUniversal(61)).toBe('F');
      expect(service.toUniversal(62)).toBe('G');
      expect(service.toUniversal(63)).toBe('H');
      expect(service.toUniversal(64)).toBe('I');
      expect(service.toUniversal(65)).toBe('J');
    });

    it('should map Primary Mandibular Left Quadrant 7 (75-71 to K-O)', () => {
      expect(service.toUniversal(75)).toBe('K');
      expect(service.toUniversal(74)).toBe('L');
      expect(service.toUniversal(73)).toBe('M');
      expect(service.toUniversal(72)).toBe('N');
      expect(service.toUniversal(71)).toBe('O');
    });

    it('should map Primary Mandibular Right Quadrant 8 (81-85 to P-T)', () => {
      expect(service.toUniversal(81)).toBe('P');
      expect(service.toUniversal(82)).toBe('Q');
      expect(service.toUniversal(83)).toBe('R');
      expect(service.toUniversal(84)).toBe('S');
      expect(service.toUniversal(85)).toBe('T');
    });
  });

  describe('Reverse Universal to FDI Mappings', () => {
    it('should convert universal numbers back to FDI codes', () => {
      expect(service.toFdi('1')).toBe('18');
      expect(service.toFdi('8')).toBe('11');
      expect(service.toFdi('9')).toBe('21');
      expect(service.toFdi('16')).toBe('28');
      expect(service.toFdi('17')).toBe('38');
      expect(service.toFdi('32')).toBe('48');
      expect(service.toFdi('A')).toBe('55');
      expect(service.toFdi('E')).toBe('51');
      expect(service.toFdi('F')).toBe('61');
      expect(service.toFdi('T')).toBe('85');
    });
  });

  describe('formatToothNumber & getDualDisplay', () => {
    it('should format tooth according to active notation', () => {
      service.setNotation('FDI');
      expect(service.formatToothNumber('16')).toBe('16');
      expect(service.formatToothNumber('51')).toBe('51');

      service.setNotation('UNIVERSAL');
      expect(service.formatToothNumber('16')).toBe('3');
      expect(service.formatToothNumber('51')).toBe('E');
    });

    it('should provide dual display with primary and alternate reference', () => {
      service.setNotation('FDI');
      const fdiDual = service.getDualDisplay('16');
      expect(fdiDual.primary).toBe('16');
      expect(fdiDual.secondary).toBe('Universal: #3');
      expect(fdiDual.activeSystem).toBe('FDI');

      service.setNotation('UNIVERSAL');
      const uniDual = service.getDualDisplay('16');
      expect(uniDual.primary).toBe('3');
      expect(uniDual.secondary).toBe('FDI: #16');
      expect(uniDual.activeSystem).toBe('UNIVERSAL');
    });
  });
});
