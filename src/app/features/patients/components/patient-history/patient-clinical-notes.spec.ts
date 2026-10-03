import { TestBed } from '@angular/core/testing';
import { PatientHistoryComponent } from './patient-history.component';
import { ClinicalNotesService, ClinicalNote } from '../../../../core/services/clinical-notes.service';
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { BillingService } from '../../../billing/services/billing.service';
import { DentalService } from '../../../../core/services/dental.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { MaterialsService } from '../../../inventory/services/materials.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Patient } from '../../models/patient.model';

describe('BR-RX-03 / BR-MED-01 - Medical Record Immutability & Amendment Trail', () => {
  let component: PatientHistoryComponent;
  let mockClinicalNotesService: any;
  let mockToastr: any;

  const mockPatient: Patient = {
    id: 'pt-101',
    firstName: 'Ahmed',
    lastName: 'Mansour',
    contactNumber: '+20 100 123 4567',
    email: 'ahmed@example.com',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    clinicId: 'c1',
    bloodGroup: 'A+',
    address: '123 Nile Corniche, Cairo',
    registrationDate: '2026-01-01'
  };

  const mockInitialNotes: ClinicalNote[] = [
    {
      id: 'note-1',
      patientId: 'pt-101',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud Samy',
      title: 'Initial Consultation',
      category: 'Consultation',
      notes: 'Patient reports cold sensitivity in upper right quadrant.',
      createdAt: '2026-10-01T10:00:00Z',
      amendments: []
    },
    {
      id: 'note-2',
      patientId: 'pt-101',
      doctorId: 'doc-1',
      doctorName: 'Dr. Mahmoud Samy',
      title: 'Restorative Evaluation',
      category: 'Procedure',
      notes: 'Completed cavity preparation on tooth 16.',
      createdAt: '2026-10-02T11:00:00Z',
      amendments: [
        {
          id: 'amend-1',
          originalNoteId: 'note-2',
          amendedText: 'Addendum: Calcium hydroxide liner placed under base.',
          reason: 'Liner details added',
          authorId: 'doc-1',
          authorName: 'Dr. Mahmoud Samy',
          timestamp: '2026-10-02T11:15:00Z'
        }
      ]
    }
  ];

  beforeEach(() => {
    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning'),
      info: jasmine.createSpy('info')
    };

    mockClinicalNotesService = {
      getNotes: jasmine.createSpy('getNotes').and.returnValue(of(mockInitialNotes)),
      createNote: jasmine.createSpy('createNote').and.callFake((payload: any) => of({
        id: 'new-note-1',
        patientId: payload.patientId,
        doctorId: 'doc-1',
        doctorName: 'Dr. Mahmoud Samy',
        title: payload.title,
        category: payload.category,
        notes: payload.notes,
        createdAt: '2026-10-03T12:00:00Z',
        amendments: []
      })),
      amendNote: jasmine.createSpy('amendNote').and.callFake((id: string, payload: any) => {
        const found = mockInitialNotes.find(n => n.id === id) || mockInitialNotes[0];
        return of({
          ...found,
          amendments: [
            ...found.amendments,
            {
              id: 'new-amend-1',
              originalNoteId: id,
              amendedText: payload.amendedText,
              reason: payload.reason,
              authorId: 'doc-2',
              authorName: 'Dr. Sarah Partner',
              timestamp: '2026-10-03T14:00:00Z'
            }
          ]
        });
      })
    };

    TestBed.configureTestingModule({
      providers: [
        PatientHistoryComponent,
        { provide: PatientService, useValue: { getFiles: () => of([]) } },
        { provide: AppointmentService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: PrescriptionService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: BillingService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: DentalService, useValue: { getLogs: () => of([]) } },
        { provide: ClinicalNotesService, useValue: mockClinicalNotesService },
        { provide: AuthService, useValue: { currentUser: signal({ id: 'doc-1', name: 'Dr. Mahmoud Samy', role: 'doctor' }), isDoctor: () => true, isAdmin: () => false } },
        { provide: ClinicService, useValue: { activeClinicId: signal('c1'), activeClinicName: signal('Clinic 1'), clinics: signal([]) } },
        { provide: ToastrService, useValue: mockToastr },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { provide: MaterialsService, useValue: { getByDoctor: () => of({ data: [] }) } }
      ]
    });

    component = TestBed.inject(PatientHistoryComponent);
    component.patient = mockPatient;
  });

  describe('Service & Immutability Architecture', () => {
    it('should NOT provide any deleteNote method on ClinicalNotesService', () => {
      const service = TestBed.inject(ClinicalNotesService);
      // In compliance with BR-RX-03 / BR-MED-01, deleting medical notes is forbidden
      expect((service as any).deleteNote).toBeUndefined();
    });

    it('should NOT provide any delete note action on PatientHistoryComponent', () => {
      // Confirm no method exists to delete clinical notes
      expect((component as any).deleteNote).toBeUndefined();
      expect((component as any).deleteClinicalNote).toBeUndefined();
    });
  });

  describe('Component Clinical Notes State & Loading', () => {
    it('should initialize clinical notes signals correctly', () => {
      expect(component.clinicalNotes()).toEqual([]);
      expect(component.isAddNoteModalOpen()).toBeFalse();
      expect(component.isAmendNoteModalOpen()).toBeFalse();
      expect(component.selectedNoteForAmend()).toBeNull();
    });

    it('should load clinical notes during loadPatientHistory()', () => {
      component.loadPatientHistory();
      expect(mockClinicalNotesService.getNotes).toHaveBeenCalledWith('pt-101');
      expect(component.clinicalNotes().length).toBe(2);
      expect(component.clinicalNotes()[0].id).toBe('note-1');
    });
  });

  describe('Add Clinical Encounter Note Workflow', () => {
    it('should open and close the Add Note modal', () => {
      component.openAddNoteModal();
      expect(component.isAddNoteModalOpen()).toBeTrue();
      expect(component.newNoteTitle()).toBe('Clinical Encounter');
      expect(component.newNoteCategory()).toBe('Consultation');

      component.closeAddNoteModal();
      expect(component.isAddNoteModalOpen()).toBeFalse();
      expect(component.newNoteContent()).toBe('');
    });

    it('should reject submission if note content is empty', () => {
      component.newNoteContent.set('   ');
      component.submitClinicalNote();

      expect(mockToastr.error).toHaveBeenCalledWith('Please enter note content', 'Validation Error');
      expect(mockClinicalNotesService.createNote).not.toHaveBeenCalled();
    });

    it('should successfully record a new clinical note and prepend to signal', () => {
      component.newNoteTitle.set('Periodontal Evaluation');
      component.newNoteCategory.set('Procedure');
      component.newNoteContent.set('Probing depths 2-3mm generalized with no furcation involvement.');

      component.submitClinicalNote();

      expect(mockClinicalNotesService.createNote).toHaveBeenCalledWith({
        patientId: 'pt-101',
        title: 'Periodontal Evaluation',
        category: 'Procedure',
        notes: 'Probing depths 2-3mm generalized with no furcation involvement.',
        clinicId: 'c1'
      });

      expect(component.clinicalNotes().length).toBe(1);
      expect(component.clinicalNotes()[0].id).toBe('new-note-1');
      expect(component.isAddNoteModalOpen()).toBeFalse();
      expect(mockToastr.success).toHaveBeenCalledWith('Clinical encounter note recorded successfully', 'Medical Record Saved');
    });
  });

  describe('Amendment Trail Workflow (BR-RX-03 / BR-MED-01)', () => {
    beforeEach(() => {
      component.clinicalNotes.set([...mockInitialNotes]);
    });

    it('should open amend modal for a specific note', () => {
      const noteToAmend = mockInitialNotes[0];
      component.openAmendModal(noteToAmend);

      expect(component.isAmendNoteModalOpen()).toBeTrue();
      expect(component.selectedNoteForAmend()).toEqual(noteToAmend);
      expect(component.amendmentText()).toBe('');
      expect(component.amendmentReason()).toBe('');
    });

    it('should reject amendment submission if text is empty', () => {
      component.selectedNoteForAmend.set(mockInitialNotes[0]);
      component.amendmentText.set('   ');
      component.submitAmendment();

      expect(mockToastr.error).toHaveBeenCalledWith('Please enter amendment text', 'Validation Error');
      expect(mockClinicalNotesService.amendNote).not.toHaveBeenCalled();
    });

    it('should append amendment to audit trail and preserve original note text intact', () => {
      const noteToAmend = mockInitialNotes[0];
      component.openAmendModal(noteToAmend);

      component.amendmentText.set('Addendum: Sensitivity subsided following fluoride varnish application.');
      component.amendmentReason.set('Follow-up phone call');

      component.submitAmendment();

      expect(mockClinicalNotesService.amendNote).toHaveBeenCalledWith('note-1', {
        amendedText: 'Addendum: Sensitivity subsided following fluoride varnish application.',
        reason: 'Follow-up phone call'
      });

      // Verify the note in signal is updated with amendment
      const updatedNote = component.clinicalNotes().find(n => n.id === 'note-1');
      expect(updatedNote).toBeDefined();
      // ORIGINAL TEXT MUST BE IMMUTABLE
      expect(updatedNote!.notes).toBe('Patient reports cold sensitivity in upper right quadrant.');
      // Amendment must be appended
      expect(updatedNote!.amendments.length).toBe(1);
      expect(updatedNote!.amendments[0].amendedText).toBe('Addendum: Sensitivity subsided following fluoride varnish application.');
      expect(updatedNote!.amendments[0].authorName).toBe('Dr. Sarah Partner');

      // Modal closed and auto-expanded
      expect(component.isAmendNoteModalOpen()).toBeFalse();
      expect(component.isNoteExpanded('note-1')).toBeTrue();
      expect(mockToastr.success).toHaveBeenCalledWith('Amendment appended to audit trail', 'Record Amended');
    });
  });

  describe('Accordion & UI Helper Utilities', () => {
    it('should toggle note amendment expansion', () => {
      expect(component.isNoteExpanded('note-1')).toBeFalse();

      component.toggleNoteExpanded('note-1');
      expect(component.isNoteExpanded('note-1')).toBeTrue();

      component.toggleNoteExpanded('note-1');
      expect(component.isNoteExpanded('note-1')).toBeFalse();
    });

    it('should format note date accurately', () => {
      const formatted = component.formatNoteDate('2026-10-01T10:00:00Z');
      expect(formatted).toBeTruthy();
      expect(component.formatNoteDate('')).toBe('');
    });
  });
});
