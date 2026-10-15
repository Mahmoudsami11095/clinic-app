import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PostOpTriageDashboardComponent } from './post-op-triage-dashboard.component';
import { PostOpTriageService, PostOpTriageSession } from '../../services/post-op-triage.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('PostOpTriageDashboardComponent (Release v8.3.0)', () => {
  let component: PostOpTriageDashboardComponent;
  let fixture: ComponentFixture<PostOpTriageDashboardComponent>;

  const mockSessions: PostOpTriageSession[] = [
    {
      id: 'postop-101',
      clinicId: 'clinic-1',
      patientId: 'pat-1',
      patientName: 'Sarah Jenkins',
      patientPhone: '+15551112233',
      procedureName: 'Impacted Molar Extraction #38',
      procedureDate: '2026-10-14T10:00:00Z',
      intervalHours: 24,
      triageStatus: 'Escalated',
      scheduledDispatchUtc: '2026-10-15T10:00:00Z',
      painScore: 9,
      bleedingSeverity: 'Severe',
      swellingSeverity: 'Severe',
      patientFeedback: 'Severe bleeding and intense throbbing pain.',
      isEscalated: true,
      escalationReason: 'Severe pain level reported (9/10)',
      createdAtUtc: '2026-10-14T10:00:00Z'
    },
    {
      id: 'postop-102',
      clinicId: 'clinic-1',
      patientId: 'pat-2',
      patientName: 'Michael Chang',
      patientPhone: '+15552223344',
      procedureName: 'Implant Placement #46',
      procedureDate: '2026-10-14T14:00:00Z',
      intervalHours: 24,
      triageStatus: 'Recovering',
      scheduledDispatchUtc: '2026-10-15T14:00:00Z',
      painScore: 3,
      bleedingSeverity: 'None',
      swellingSeverity: 'Moderate',
      patientFeedback: 'Doing well.',
      isEscalated: false,
      createdAtUtc: '2026-10-14T14:00:00Z'
    }
  ];

  const mockTriageService = {
    getTriageSessions: jasmine.createSpy('getTriageSessions').and.returnValue(of(mockSessions)),
    triggerTriage: jasmine.createSpy('triggerTriage').and.returnValue(of({
      id: 'postop-new',
      patientName: 'New Patient',
      procedureName: 'Crown Prep',
      isEscalated: false,
      triageStatus: 'PendingResponse'
    })),
    simulateResponse: jasmine.createSpy('simulateResponse').and.callFake((id: string, req: any) => {
      return of({
        id,
        isEscalated: req.painScore > 7,
        triageStatus: req.painScore > 7 ? 'Escalated' : 'Recovering',
        painScore: req.painScore,
        bleedingSeverity: req.bleedingSeverity,
        swellingSeverity: req.swellingSeverity
      });
    }),
    resolveTriage: jasmine.createSpy('resolveTriage').and.callFake((id: string, action: string) => {
      return of({
        id,
        isEscalated: false,
        triageStatus: 'Resolved',
        doctorClinicalAction: action
      });
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PostOpTriageDashboardComponent],
      providers: [
        {
          provide: PostOpTriageService,
          useValue: mockTriageService
        },
        {
          provide: LanguageService,
          useValue: {
            translate: (k: string) => k,
            isLoaded: signal(true)
          }
        }
      ]
    });

    fixture = TestBed.createComponent(PostOpTriageDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load sessions on init', () => {
    expect(component).toBeTruthy();
    expect(mockTriageService.getTriageSessions).toHaveBeenCalled();
    expect(component.sessions().length).toBe(2);
    expect(component.escalatedCount()).toBe(1);
  });

  it('should filter sessions by active tab', () => {
    component.activeTab.set('escalated');
    expect(component.filteredSessions().length).toBe(1);
    expect(component.filteredSessions()[0].patientName).toBe('Sarah Jenkins');

    component.activeTab.set('recovering');
    expect(component.filteredSessions().length).toBe(1);
    expect(component.filteredSessions()[0].patientName).toBe('Michael Chang');

    component.activeTab.set('all');
    expect(component.filteredSessions().length).toBe(2);
  });

  it('should trigger check-in modal and submit new session', () => {
    component.newPatientName = 'David Harrison';
    component.newPatientPhone = '+15559998877';
    component.newProcedureName = 'Wisdom Extraction #18';
    component.newIntervalHours = 48;
    component.newImmediateDispatch = true;

    component.submitTrigger();

    expect(mockTriageService.triggerTriage).toHaveBeenCalledWith(
      jasmine.objectContaining({
        patientName: 'David Harrison',
        patientPhone: '+15559998877',
        procedureName: 'Wisdom Extraction #18'
      })
    );
    expect(component.showTriggerModal()).toBeFalse();
  });

  it('should simulate severe response and trigger escalation', () => {
    const session = mockSessions[1];
    component.simulateSevereReply(session);

    expect(mockTriageService.simulateResponse).toHaveBeenCalledWith(
      session.id,
      jasmine.objectContaining({
        painScore: 9,
        bleedingSeverity: 'Severe'
      })
    );
  });

  it('should open resolve modal and submit clinical intervention', () => {
    const escalatedSession = mockSessions[0];
    component.openResolveModal(escalatedSession);

    expect(component.showResolveModal()).toBeTrue();
    expect(component.selectedSession()).toBe(escalatedSession);

    component.doctorActionInput.set('Contacted patient. Prescribed Tramadol and advised cold compress.');
    component.submitResolve();

    expect(mockTriageService.resolveTriage).toHaveBeenCalledWith(
      escalatedSession.id,
      'Contacted patient. Prescribed Tramadol and advised cold compress.'
    );
    expect(component.showResolveModal()).toBeFalse();
  });

  it('should format pain and status badges correctly', () => {
    expect(component.getPainBadgeClass(9)).toContain('text-rose');
    expect(component.getPainBadgeClass(5)).toContain('text-amber');
    expect(component.getPainBadgeClass(2)).toContain('text-emerald');

    expect(component.getStatusBadgeClass('Escalated')).toContain('bg-rose');
    expect(component.getStatusBadgeClass('Recovering')).toContain('bg-emerald');
    expect(component.getStatusBadgeClass('Resolved')).toContain('bg-blue');
  });
});
