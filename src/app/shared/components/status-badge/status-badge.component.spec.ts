import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should render success badge classes for Received / Completed status', () => {
    fixture.componentRef.setInput('status', 'Received');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toContain('Received');
    expect(span.className).toContain('text-emerald-700');
  });

  it('should render warning badge classes for Requested / Pending status', () => {
    fixture.componentRef.setInput('status', 'Requested');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toContain('Requested');
    expect(span.className).toContain('text-amber-700');
  });

  it('should render in-transit badge classes for InTransit status', () => {
    fixture.componentRef.setInput('status', 'InTransit');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toContain('InTransit');
    expect(span.className).toContain('text-indigo-700');
  });

  it('should render pulse indicator when pulse input is true', () => {
    fixture.componentRef.setInput('status', 'InTransit');
    fixture.componentRef.setInput('pulse', true);
    fixture.detectChanges();

    const pulseEl = fixture.nativeElement.querySelector('.animate-pulse');
    expect(pulseEl).toBeTruthy();
  });
});
