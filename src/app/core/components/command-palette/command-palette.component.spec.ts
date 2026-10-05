import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from '../../services/command-palette.service';
import { LanguageService } from '../../i18n/language.service';

describe('CommandPaletteComponent - Level 1 (SW/Unit)', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let paletteService: CommandPaletteService;
  let languageService: LanguageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        CommandPaletteService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    paletteService = TestBed.inject(CommandPaletteService);
    languageService = TestBed.inject(LanguageService);
    fixture.detectChanges();
  });

  it('1. should create and initially not render dialog when closed', () => {
    expect(component).toBeTruthy();
    const modalEl = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(modalEl).toBeNull();
  });

  it('2. should render dialog and search input when opened', () => {
    paletteService.open();
    fixture.detectChanges();

    const modalEl = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(modalEl).not.toBeNull();

    const input = fixture.nativeElement.querySelector('input');
    expect(input).not.toBeNull();
  });

  it('3. should toggle palette on Ctrl + K global shortcut', () => {
    expect(paletteService.isOpen()).toBeFalse();

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    window.dispatchEvent(event);
    fixture.detectChanges();

    expect(paletteService.isOpen()).toBeTrue();

    window.dispatchEvent(event);
    fixture.detectChanges();

    expect(paletteService.isOpen()).toBeFalse();
  });

  it('4. should close palette on Escape key', () => {
    paletteService.open();
    fixture.detectChanges();
    expect(paletteService.isOpen()).toBeTrue();

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escEvent);
    fixture.detectChanges();

    expect(paletteService.isOpen()).toBeFalse();
  });

  it('5. should cycle active index on ArrowDown and ArrowUp', () => {
    paletteService.open();
    fixture.detectChanges();

    expect(paletteService.activeIndex()).toBe(0);

    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    window.dispatchEvent(downEvent);
    fixture.detectChanges();

    expect(paletteService.activeIndex()).toBe(1);

    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    window.dispatchEvent(upEvent);
    fixture.detectChanges();

    expect(paletteService.activeIndex()).toBe(0);
  });

  it('6. should execute active command on Enter key', () => {
    paletteService.open();
    spyOn(paletteService, 'executeActive');

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    window.dispatchEvent(enterEvent);

    expect(paletteService.executeActive).toHaveBeenCalled();
  });

  it('7. should close when backdrop is clicked', () => {
    paletteService.open();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.palette-backdrop');
    expect(backdrop).not.toBeNull();

    backdrop.click();
    fixture.detectChanges();

    expect(paletteService.isOpen()).toBeFalse();
  });
});
