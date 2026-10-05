import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { OfflineBannerComponent } from './offline-banner.component';
import { OfflineService } from '../../services/offline.service';

describe('OfflineBannerComponent - Level 1 (SW/Unit)', () => {
  let component: OfflineBannerComponent;
  let fixture: ComponentFixture<OfflineBannerComponent>;
  let offlineService: OfflineService;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      providers: [
        OfflineService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: jasmine.createSpyObj('ToastrService', ['success', 'warning', 'info']) },
        provideTranslateService({ fallbackLang: 'en' })
      ]
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('en', {
      offline: {
        title: 'Offline Mode Active',
        description: 'Browsing cached clinic records. Mutations will synchronize when connectivity returns.',
        changes_queued: 'changes queued',
        retry: 'Retry Connection',
        reconnected_title: 'Back Online!',
        reconnected_description: 'Connected to MedClinic Cloud. Local state is synchronized.'
      }
    });
    translateService.use('en');

    fixture = TestBed.createComponent(OfflineBannerComponent);
    component = fixture.componentInstance;
    offlineService = TestBed.inject(OfflineService);
    fixture.detectChanges();
  });

  it('1. should create component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should NOT render banner when online and not reconnected', () => {
    offlineService.isOnline.set(true);
    offlineService.isReconnected.set(false);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner).toBeNull();
  });

  it('3. should render offline alert banner when isOnline is false', () => {
    offlineService.isOnline.set(false);
    fixture.detectChanges();

    const alertEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alertEl).not.toBeNull();
    expect(alertEl.textContent).toContain('Offline Mode Active');
  });

  it('4. should render reconnected banner when isReconnected is true', () => {
    offlineService.isOnline.set(true);
    offlineService.isReconnected.set(true);
    fixture.detectChanges();

    const statusEl = fixture.nativeElement.querySelector('[role="status"]');
    expect(statusEl).not.toBeNull();
    expect(statusEl.textContent).toContain('Back Online!');
  });

  it('5. should trigger checkConnection when Retry button is clicked', () => {
    offlineService.isOnline.set(false);
    fixture.detectChanges();

    spyOn(offlineService, 'checkConnection');

    const retryBtn = fixture.nativeElement.querySelector('button');
    expect(retryBtn).not.toBeNull();
    retryBtn.click();

    expect(offlineService.checkConnection).toHaveBeenCalled();
  });
});
