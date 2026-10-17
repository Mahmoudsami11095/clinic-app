import { TestBed } from '@angular/core/testing';
import { PerioVoiceRecognitionService } from './perio-voice-recognition.service';

describe('PerioVoiceRecognitionService (BR-PERIO-04)', () => {
  let service: PerioVoiceRecognitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerioVoiceRecognitionService]
    });
    service = TestBed.inject(PerioVoiceRecognitionService);
  });

  it('should parse spoken tooth number and numeric probing depths', () => {
    const action = service.parseAndExecuteVoiceCommand('Tooth 16, 5 3 4');
    expect(action.toothNumber).toBe(16);
    expect(action.probingDepths).toEqual([5, 3, 4]);
  });

  it('should parse bleeding on probing keyword triggers', () => {
    const action1 = service.parseAndExecuteVoiceCommand('Tooth 21 bleed');
    expect(action1.toothNumber).toBe(21);
    expect(action1.toggleBop).toBeTrue();

    const action2 = service.parseAndExecuteVoiceCommand('سن 11 نزيف');
    expect(action2.toothNumber).toBe(11);
    expect(action2.toggleBop).toBeTrue();
  });

  it('should parse suppuration keyword triggers', () => {
    const action = service.parseAndExecuteVoiceCommand('Tooth 36 suppuration');
    expect(action.toothNumber).toBe(36);
    expect(action.toggleSuppuration).toBeTrue();
  });

  it('should parse Miller mobility grades', () => {
    const action = service.parseAndExecuteVoiceCommand('Tooth 46 mobility 2');
    expect(action.toothNumber).toBe(46);
    expect(action.mobilityGrade).toBe(2);
  });

  it('should parse furcation involvement classes', () => {
    const action = service.parseAndExecuteVoiceCommand('Tooth 16 furcation 1');
    expect(action.toothNumber).toBe(16);
    expect(action.furcationGrade).toBe(1);
  });

  it('should parse missing tooth and implant keywords', () => {
    const missingAction = service.parseAndExecuteVoiceCommand('Tooth 18 missing');
    expect(missingAction.toothNumber).toBe(18);
    expect(missingAction.isMissing).toBeTrue();

    const implantAction = service.parseAndExecuteVoiceCommand('Tooth 26 implant');
    expect(implantAction.toothNumber).toBe(26);
    expect(implantAction.isImplant).toBeTrue();
  });

  it('should broadcast parsed action via action$ observable and update lastActionMessage', (done) => {
    service.action$.subscribe(act => {
      expect(act.toothNumber).toBe(16);
      expect(act.probingDepths).toEqual([4, 2, 3]);
      expect(service.lastActionMessage()).toContain('Tooth 16');
      done();
    });

    service.simulateVoiceInput('Tooth 16, 4 2 3');
  });
});
