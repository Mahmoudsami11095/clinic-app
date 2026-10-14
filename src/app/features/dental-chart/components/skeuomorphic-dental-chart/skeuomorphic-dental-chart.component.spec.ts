import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeuomorphicDentalChartComponent } from './skeuomorphic-dental-chart.component';
import { DentalDataService } from '../../services/dental-data.service';
import { DentalNotationService } from '../../../../core/services/dental-notation.service';
import { NativeHapticsService } from '../../../../core/services/mobile/native-haptics.service';
import { NativeCameraService } from '../../../../core/services/mobile/native-camera.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('SkeuomorphicDentalChartComponent - Mobile & Camera Integration', () => {
  let component: SkeuomorphicDentalChartComponent;
  let fixture: ComponentFixture<SkeuomorphicDentalChartComponent>;
  let mockDentalDataService: any;
  let mockNotationService: any;
  let mockHapticsService: any;
  let mockCameraService: any;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockDentalDataService = {
      getAllRecords: () => of({}),
      getEndodonticRecord: (id: string) => of({} as any),
      updateEndodonticRecord: (r: any) => of(r)
    };

    mockNotationService = {
      notation: signal('FDI'),
      formatToothNumber: (n: any) => String(n),
      getDualDisplay: () => ({ primary: '11', secondary: '11', primarySystem: 'FDI', secondarySystem: 'Universal' }),
      toUniversal: (n: any) => String(n)
    };

    mockHapticsService = {
      impact: jasmine.createSpy('impact'),
      notification: jasmine.createSpy('notification'),
      selectionChanged: jasmine.createSpy('selectionChanged')
    };

    mockCameraService = {
      captureClinicalPhoto: jasmine.createSpy('captureClinicalPhoto').and.returnValue(Promise.resolve({
        dataUrl: 'data:image/jpeg;base64,sample-tooth-photo',
        format: 'jpeg'
      }))
    };

    mockLanguageService = {
      currentLang: signal('en'),
      translate: (k: string) => k,
      isLoaded: signal(true)
    };

    await TestBed.configureTestingModule({
      imports: [SkeuomorphicDentalChartComponent],
      providers: [
        { provide: DentalDataService, useValue: mockDentalDataService },
        { provide: DentalNotationService, useValue: mockNotationService },
        { provide: NativeHapticsService, useValue: mockHapticsService },
        { provide: NativeCameraService, useValue: mockCameraService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeuomorphicDentalChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render skeuomorphic chart', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger tactile selectionChanged haptics on tooth click', () => {
    component.selectTooth('11');
    expect(component.selectedToothNum()).toBe('11');
    expect(mockHapticsService.selectionChanged).toHaveBeenCalled();
  });

  it('should trigger light impact haptics when changing tooth status', () => {
    component.toggleStatus('caries');
    expect(component.isStatusSelected('caries')).toBeTrue();
    expect(mockHapticsService.impact).toHaveBeenCalledWith('light');
  });

  it('should capture intraoral clinical photo using NativeCameraService', async () => {
    expect(component.attachedPhotos().length).toBe(0);

    await component.captureToothPhoto();

    expect(mockCameraService.captureClinicalPhoto).toHaveBeenCalled();
    expect(component.attachedPhotos().length).toBe(1);
    expect(component.attachedPhotos()[0]).toContain('sample-tooth-photo');
    expect(mockHapticsService.notification).toHaveBeenCalledWith('success');
  });

  it('should remove clinical photo and trigger light haptic feedback', async () => {
    await component.captureToothPhoto();
    expect(component.attachedPhotos().length).toBe(1);

    component.removePhoto(0);
    expect(component.attachedPhotos().length).toBe(0);
    expect(mockHapticsService.impact).toHaveBeenCalledWith('light');
  });
});
