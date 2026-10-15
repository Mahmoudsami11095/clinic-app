import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SmartAppBannerComponent } from './smart-app-banner.component';
import { NativeDeviceService } from '../../services/mobile/native-device.service';
import { LanguageService } from '../../i18n/language.service';
import { signal } from '@angular/core';

describe('SmartAppBannerComponent', () => {
  let component: SmartAppBannerComponent;
  let fixture: ComponentFixture<SmartAppBannerComponent>;
  let mockDeviceService: any;
  let mockRouter: any;
  let mockLanguageService: any;

  beforeEach(() => {
    localStorage.removeItem('smart_app_banner_dismissed_until');

    mockDeviceService = {
      isNative: signal(false),
      isIOS: signal(true),
      isAndroid: signal(false),
      platform: signal('ios')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockLanguageService = {
      currentLang: signal('en'),
      translate: (k: string) => k,
      isLoaded: signal(true)
    };

    TestBed.configureTestingModule({
      imports: [SmartAppBannerComponent],
      providers: [
        { provide: NativeDeviceService, useValue: mockDeviceService },
        { provide: Router, useValue: mockRouter },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    });

    fixture = TestBed.createComponent(SmartAppBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('smart_app_banner_dismissed_until');
  });

  it('should create and be visible on mobile browser', () => {
    expect(component).toBeTruthy();
    expect(component.isVisible()).toBeTrue();
  });

  it('should navigate to /download when clicking CTA button', () => {
    component.openDownloadPage();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/download']);
  });

  it('should dismiss banner and persist 14-day expiry in localStorage', () => {
    expect(component.isDismissed()).toBeFalse();
    component.dismissBanner();
    expect(component.isDismissed()).toBeTrue();
    expect(component.isVisible()).toBeFalse();

    const stored = localStorage.getItem('smart_app_banner_dismissed_until');
    expect(stored).not.toBeNull();
    const expiry = parseInt(stored!, 10);
    expect(expiry).toBeGreaterThan(Date.now() + 13 * 24 * 60 * 60 * 1000);
  });

  it('should not be visible if running inside native app wrapper', () => {
    mockDeviceService.isNative.set(true);
    expect(component.isVisible()).toBeFalse();
  });
});
