import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PostOpTriageService, TriggerTriageRequest, SimulateResponseRequest } from './post-op-triage.service';

describe('PostOpTriageService', () => {
  let service: PostOpTriageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PostOpTriageService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PostOpTriageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and fetch triage sessions', (done) => {
    expect(service).toBeTruthy();

    service.getTriageSessions().subscribe(sessions => {
      expect(sessions.length).toBeGreaterThan(0);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'postop-1',
        patientName: 'Jane Smith',
        procedureName: 'Implant #11',
        isEscalated: false,
        triageStatus: 'Recovering'
      }
    ]);
  });

  it('should trigger new triage session via HTTP', (done) => {
    const triggerReq: TriggerTriageRequest = {
      patientId: 'pat-200',
      patientName: 'Robert Davis',
      patientPhone: '+15559876543',
      procedureName: 'Molar Extraction #36',
      immediateDispatch: true
    };

    service.triggerTriage(triggerReq).subscribe(session => {
      expect(session.patientName).toBe('Robert Davis');
      expect(session.triageStatus).toBe('PendingResponse');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/trigger`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'postop-new-1',
      ...triggerReq,
      triageStatus: 'PendingResponse',
      dispatchedAtUtc: new Date().toISOString()
    });
  });

  it('should simulate patient response and update escalation status', (done) => {
    const simReq: SimulateResponseRequest = {
      painScore: 9,
      bleedingSeverity: 'Severe',
      swellingSeverity: 'Severe',
      patientFeedback: 'Continuous bleeding and intense pain.'
    };

    service.simulateResponse('postop-1', simReq).subscribe(session => {
      expect(session.isEscalated).toBeTrue();
      expect(session.triageStatus).toBe('Escalated');
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/postop-1/simulate-response`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'postop-1',
      isEscalated: true,
      triageStatus: 'Escalated',
      painScore: 9,
      bleedingSeverity: 'Severe',
      swellingSeverity: 'Severe'
    });
  });

  it('should resolve triage session with doctor clinical action', (done) => {
    const action = 'Called patient. Prescribed Ketorolac. Advised ice packs.';

    service.resolveTriage('postop-1', action).subscribe(session => {
      expect(session.isEscalated).toBeFalse();
      expect(session.triageStatus).toBe('Resolved');
      expect(session.doctorClinicalAction).toBe(action);
      done();
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/postop-1/resolve`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'postop-1',
      isEscalated: false,
      triageStatus: 'Resolved',
      doctorClinicalAction: action
    });
  });
});
