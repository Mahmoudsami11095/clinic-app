import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TelehealthRoomComponent } from './telehealth-room.component';
import { TelehealthService } from '../../core/services/telehealth.service';
import { provideTranslateService } from '@ngx-translate/core';

describe('TelehealthRoomComponent - Level 1 (SW/Unit)', () => {
  let component: TelehealthRoomComponent;
  let fixture: ComponentFixture<TelehealthRoomComponent>;
  let telehealthService: TelehealthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelehealthRoomComponent],
      providers: [
        TelehealthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => key === 'token' ? 'test-room-token-123' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TelehealthRoomComponent);
    component = fixture.componentInstance;
    telehealthService = TestBed.inject(TelehealthService);
    fixture.detectChanges();
  });

  it('should create component with query param token initialized', () => {
    expect(component).toBeTruthy();
    expect(telehealthService.roomToken()).toBe('test-room-token-123');
  });

  it('should toggle audio and video via service', () => {
    expect(telehealthService.isAudioMuted()).toBeFalse();
    component.toggleAudio();
    expect(telehealthService.isAudioMuted()).toBeTrue();

    expect(telehealthService.isVideoOff()).toBeFalse();
    component.toggleVideo();
    expect(telehealthService.isVideoOff()).toBeTrue();
  });

  it('should toggle odontogram dual-view', () => {
    expect(component.showOdontogram()).toBeTrue();
    component.toggleOdontogramOverlay();
    expect(component.showOdontogram()).toBeFalse();
  });

  it('should format duration as MM:SS', () => {
    telehealthService.callDurationSeconds.set(0);
    expect(component.formattedDuration()).toBe('00:00');

    telehealthService.callDurationSeconds.set(65);
    expect(component.formattedDuration()).toBe('01:05');

    telehealthService.callDurationSeconds.set(360);
    expect(component.formattedDuration()).toBe('06:00');
  });

  it('should generate WhatsApp invite and open window', () => {
    spyOn(window, 'open');
    component.patientName.set('Omar Farooq');
    component.patientPhone.set('+201112223334');

    component.inviteViaWhatsApp();

    expect(window.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/https:\/\/wa\.me\/201112223334\?text=/),
      '_blank'
    );
  });

  it('should conclude consultation on endConsultation', () => {
    component.endConsultation();
    expect(telehealthService.connectionStatus()).toBe('completed');
  });
});
