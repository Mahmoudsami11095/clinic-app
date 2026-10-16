import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DesktopTitlebarComponent } from './desktop-titlebar.component';
import { NativeDesktopService } from '../../services/desktop/native-desktop.service';
import { LanguageService } from '../../i18n/language.service';
import { Pipe, PipeTransform, signal } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: true
})
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('DesktopTitlebarComponent', () => {
  let component: DesktopTitlebarComponent;
  let fixture: ComponentFixture<DesktopTitlebarComponent>;
  let mockDesktopService: jasmine.SpyObj<NativeDesktopService>;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockDesktopService = jasmine.createSpyObj('NativeDesktopService', ['minimize', 'maximize', 'close', 'downloadUpdate', 'installUpdate', 'checkForUpdates'], {
      isDesktop: signal(true),
      isMaximized: signal(false),
      isUpdateAvailable: signal(false),
      isUpdateDownloading: signal(false),
      isUpdateDownloaded: signal(false),
      updateProgressPercent: signal(0),
      availableUpdateVersion: signal<string | null>(null)
    });

    mockLanguageService = {
      currentLang: signal('en'),
      setLanguage: jasmine.createSpy('setLanguage')
    };

    await TestBed.configureTestingModule({
      imports: [DesktopTitlebarComponent],
      providers: [
        { provide: NativeDesktopService, useValue: mockDesktopService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    })
    .overrideComponent(DesktopTitlebarComponent, {
      remove: { imports: [] },
      add: { imports: [MockTranslatePipe] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesktopTitlebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the titlebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should call minimize when minimize button is clicked', () => {
    component.minimize();
    expect(mockDesktopService.minimize).toHaveBeenCalled();
  });

  it('should call maximize when maximize button is clicked', () => {
    component.maximize();
    expect(mockDesktopService.maximize).toHaveBeenCalled();
  });

  it('should call close when close button is clicked', () => {
    component.close();
    expect(mockDesktopService.close).toHaveBeenCalled();
  });

  // --- Silent Background Auto-Updater (BR-DESK-07) Tests ---

  it('should delegate updater calls to nativeDesktopService', () => {
    component.downloadUpdate();
    expect(mockDesktopService.downloadUpdate).toHaveBeenCalled();

    component.installUpdate();
    expect(mockDesktopService.installUpdate).toHaveBeenCalled();

    component.checkForUpdates();
    expect(mockDesktopService.checkForUpdates).toHaveBeenCalled();
  });

  it('should render update available badge and trigger download on click', () => {
    (mockDesktopService.isUpdateAvailable as any).set(true);
    (mockDesktopService.availableUpdateVersion as any).set('8.1.0');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('#titlebar-update-available-btn');
    expect(btn).toBeTruthy();

    btn.click();
    expect(mockDesktopService.downloadUpdate).toHaveBeenCalled();
  });

  it('should render downloading progress badge when update is in progress', () => {
    (mockDesktopService.isUpdateDownloading as any).set(true);
    (mockDesktopService.updateProgressPercent as any).set(65);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('#titlebar-update-downloading-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('65%');
  });

  it('should render ready badge and trigger install on click', () => {
    (mockDesktopService.isUpdateDownloaded as any).set(true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('#titlebar-update-ready-btn');
    expect(btn).toBeTruthy();

    btn.click();
    expect(mockDesktopService.installUpdate).toHaveBeenCalled();
  });
});
