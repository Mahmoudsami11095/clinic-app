import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { OtpInputFieldComponent } from '../../shared/components/otp-input-field/otp-input-field.component';
import { SignaturePadModalComponent } from '../../shared/components/signature-pad-modal/signature-pad-modal.component';
import { LanguageService } from '../i18n/language.service';

describe('Angular 19 Signal Primitives Modernization - Level 1 (SW/Unit)', () => {

  describe('ModalComponent Signal Primitives', () => {
    let fixture: ComponentFixture<ModalComponent>;
    let component: ModalComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ModalComponent]
      }).compileComponents();

      fixture = TestBed.createComponent(ModalComponent);
      component = fixture.componentInstance;
    });

    it('1. should accept signal inputs and reflect in reactive DOM template', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', 'Executive Financial Report');
      fixture.componentRef.setInput('subtitle', 'Quarterly Revenue Analysis');
      fixture.detectChanges();

      expect(component.isOpen()).toBeTrue();
      expect(component.title()).toBe('Executive Financial Report');
      expect(component.subtitle()).toBe('Quarterly Revenue Analysis');

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h2')?.textContent).toContain('Executive Financial Report');
      expect(compiled.querySelector('p')?.textContent).toContain('Quarterly Revenue Analysis');
    });

    it('2. should emit close output on backdrop click', () => {
      let emitted = false;
      component.close.subscribe(() => (emitted = true));

      component.onBackdropClick();
      expect(emitted).toBeTrue();
    });
  });

  describe('OtpInputFieldComponent Signal Primitives & Two-Way Model', () => {
    let fixture: ComponentFixture<OtpInputFieldComponent>;
    let component: OtpInputFieldComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [OtpInputFieldComponent]
      }).compileComponents();

      fixture = TestBed.createComponent(OtpInputFieldComponent);
      component = fixture.componentInstance;
    });

    it('3. should reactively compute lengthArray from length signal input', () => {
      fixture.componentRef.setInput('length', 4);
      fixture.detectChanges();

      expect(component.length()).toBe(4);
      expect(component.lengthArray()).toEqual([0, 1, 2, 3]);
    });

    it('4. should update two-way model code and emit otpComplete when full', (done) => {
      fixture.componentRef.setInput('length', 4);
      fixture.detectChanges();

      let completedCode = '';
      component.otpComplete.subscribe((code) => {
        completedCode = code;
        expect(completedCode).toBe('1234');
        done();
      });

      const input = document.createElement('input');
      input.value = '1234';
      const event = { target: input } as unknown as Event;

      component.onInput(event);
      expect(component.code()).toBe('1234');
    });
  });

  describe('SignaturePadModalComponent Signal Primitives', () => {
    let fixture: ComponentFixture<SignaturePadModalComponent>;
    let component: SignaturePadModalComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SignaturePadModalComponent],
        providers: [
          {
            provide: LanguageService,
            useValue: {
              translate: (k: string) => k,
              isLoaded: () => true
            }
          }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(SignaturePadModalComponent);
      component = fixture.componentInstance;
    });

    it('5. should bind signal inputs and trigger close signal output', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', 'Patient Informed Consent');
      fixture.detectChanges();

      expect(component.isOpen()).toBeTrue();
      expect(component.title()).toBe('Patient Informed Consent');

      let closed = false;
      component.close.subscribe(() => (closed = true));
      component.onClose();
      expect(closed).toBeTrue();
    });
  });
});
