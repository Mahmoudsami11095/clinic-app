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
    mockDesktopService = jasmine.createSpyObj('NativeDesktopService', ['minimize', 'maximize', 'close'], {
      isDesktop: signal(true),
      isMaximized: signal(false)
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
});
