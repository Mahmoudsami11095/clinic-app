import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SignaturePadModalComponent } from './signature-pad-modal.component';
import { LanguageService } from '../../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('REQ-PAT-03: Digital Signature Pad Modal', () => {
  let component: SignaturePadModalComponent;
  let fixture: ComponentFixture<SignaturePadModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SignaturePadModalComponent],
      providers: [
        {
          provide: LanguageService,
          useValue: {
            translate: (k: string) => k,
            isLoaded: signal(true)
          }
        }
      ]
    });

    fixture = TestBed.createComponent(SignaturePadModalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('should initialize with hasDrawn false', () => {
    expect(component.hasDrawn()).toBeFalse();
  });

  it('should clear canvas drawing and reset hasDrawn state', () => {
    component.hasDrawn.set(true);
    component.clearSignature();
    expect(component.hasDrawn()).toBeFalse();
  });

  it('should emit close event on modal dismissal', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.isOpen).toBeFalse();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit signatureSaved when canvas has drawn signature', () => {
    spyOn(component.signatureSaved, 'emit');
    component.hasDrawn.set(true);

    component.saveSignature();

    expect(component.signatureSaved.emit).toHaveBeenCalledWith(
      jasmine.stringMatching(/^data:image\/png;base64,/)
    );
  });
});
