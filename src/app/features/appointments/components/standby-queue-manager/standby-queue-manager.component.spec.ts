import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StandbyQueueManagerComponent } from './standby-queue-manager.component';
import { AiNoShowService } from '../../../../core/services/ai-no-show/ai-no-show.service';
import { AuthService, User } from '../../../../core/auth/auth.service';
import { of } from 'rxjs';

describe('StandbyQueueManagerComponent', () => {
  let component: StandbyQueueManagerComponent;
  let fixture: ComponentFixture<StandbyQueueManagerComponent>;
  let mockAiNoShowService: jasmine.SpyObj<AiNoShowService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockAiNoShowService = jasmine.createSpyObj('AiNoShowService', ['getStandbyQueue']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['currentUser']);

    mockAiNoShowService.getStandbyQueue.and.returnValue(of([]));
    mockAuthService.currentUser.and.returnValue({ clinicId: 'c1' } as User);

    await TestBed.configureTestingModule({
      imports: [StandbyQueueManagerComponent],
      providers: [
        { provide: AiNoShowService, useValue: mockAiNoShowService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StandbyQueueManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load queue on init', () => {
    expect(mockAiNoShowService.getStandbyQueue).toHaveBeenCalledWith('c1');
  });
});
