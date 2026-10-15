import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MobileDownloadComponent } from './mobile-download.component';
import { NativeDeviceService } from '../../core/services/mobile/native-device.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { LanguageService } from '../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('MobileDownloadComponent', () => {
  let component: MobileDownloadComponent;
  let fixture: ComponentFixture<MobileDownloadComponent>;
  let mockDeviceService: any;
  let mockPwaService: any;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockDeviceService = {
      platform: signal('android'),
      isIOS: signal(false),
      isAndroid: signal(true)
    };

    mockPwaService = {
      installPwa: jasmine.createSpy('installPwa')
    };

    mockLanguageService = {
      currentLang: signal('en'),
      translate: (k: string) => k,
      isLoaded: signal(true),
      setLanguage: jasmine.createSpy('setLanguage')
    };

    await TestBed.configureTestingModule({
      imports: [MobileDownloadComponent],
      providers: [
        provideRouter([]),
        { provide: NativeDeviceService, useValue: mockDeviceService },
        { provide: PwaInstallService, useValue: mockPwaService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MobileDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and detect Android device', () => {
    expect(component).toBeTruthy();
    expect(component.isAndroid()).toBeTrue();
    expect(component.isIOS()).toBeFalse();
    expect(component.isDesktop()).toBeFalse();
  });

  it('should trigger PWA install when clicking button', () => {
    component.installPwa();
    expect(mockPwaService.installPwa).toHaveBeenCalled();
  });

  it('should toggle language between en and ar', () => {
    component.toggleLanguage();
    expect(mockLanguageService.setLanguage).toHaveBeenCalledWith('ar');
  });

  it('should detect iOS platform when configured', () => {
    mockDeviceService.isAndroid.set(false);
    mockDeviceService.isIOS.set(true);
    mockDeviceService.platform.set('ios');

    expect(component.isIOS()).toBeTrue();
    expect(component.isAndroid()).toBeFalse();
  });
});
