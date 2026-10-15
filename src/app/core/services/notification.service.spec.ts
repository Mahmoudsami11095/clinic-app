import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { NotificationService, Notification } from './notification.service';
import { AuthService } from '../auth/auth.service';
import { NativeHapticsService } from './mobile/native-haptics.service';
import { environment } from '../../../environments/environment';

describe('NotificationService - Level 1 (SW/Unit)', () => {
  let service: NotificationService;
  let httpTesting: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let hapticsSpy: jasmine.SpyObj<NativeHapticsService>;

  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'user-1',
      title: 'Appointment Booked',
      message: 'New patient appointment',
      type: 'Appointment',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      title: 'Sterilization Complete',
      message: 'Chair 1 ready',
      type: 'Operatory',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-3',
      userId: 'user-1',
      title: 'Low Stock Alert',
      message: 'Anesthetic cartridges low',
      type: 'Inventory',
      isRead: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-4',
      userId: 'user-1',
      title: 'Prescription Issued',
      message: 'Amoxicillin prescribed',
      type: 'Clinical',
      isRead: true,
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getToken']);
    authSpy.isAuthenticated.and.returnValue(false);
    authSpy.getToken.and.returnValue(null);

    hapticsSpy = jasmine.createSpyObj('NativeHapticsService', ['notification']);
    hapticsSpy.notification.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: NativeHapticsService, useValue: hapticsSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be initialized with default signals', () => {
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
    expect(service.filterType()).toBe('all');
    expect(service.activeToast()).toBeNull();
  });

  it('should filter notifications by unread category', () => {
    service.notifications.set(mockNotifications);
    service.setFilter('unread');

    const filtered = service.filteredNotifications();
    expect(filtered.length).toBe(2);
    expect(filtered.every(n => !n.isRead)).toBeTrue();
  });

  it('should filter notifications by clinical category', () => {
    service.notifications.set(mockNotifications);
    service.setFilter('clinical');

    const filtered = service.filteredNotifications();
    expect(filtered.length).toBe(2);
    expect(filtered.map(n => n.id)).toEqual(['notif-1', 'notif-4']);
  });

  it('should filter notifications by operational category', () => {
    service.notifications.set(mockNotifications);
    service.setFilter('operational');

    const filtered = service.filteredNotifications();
    expect(filtered.length).toBe(2);
    expect(filtered.map(n => n.id)).toEqual(['notif-2', 'notif-3']);
  });

  it('should return all notifications when filter is all', () => {
    service.notifications.set(mockNotifications);
    service.setFilter('all');

    expect(service.filteredNotifications().length).toBe(4);
  });

  it('should optimistically mark a notification as read and send PATCH request', () => {
    service.notifications.set([...mockNotifications]);
    service.unreadCount.set(2);

    service.markAsRead('notif-1');

    const updated = service.notifications().find(n => n.id === 'notif-1');
    expect(updated?.isRead).toBeTrue();
    expect(service.unreadCount()).toBe(1);

    const req = httpTesting.expectOne(`${environment.apiUrl}/notifications/notif-1/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should mark all notifications as read and send PATCH request', () => {
    service.notifications.set([...mockNotifications]);
    service.unreadCount.set(2);

    service.markAllAsRead();

    expect(service.notifications().every(n => n.isRead)).toBeTrue();
    expect(service.unreadCount()).toBe(0);

    const req = httpTesting.expectOne(`${environment.apiUrl}/notifications/read-all`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should delete a notification optimistically and send DELETE request', () => {
    service.notifications.set([...mockNotifications]);
    service.unreadCount.set(2);

    service.deleteNotification('notif-1');

    expect(service.notifications().some(n => n.id === 'notif-1')).toBeFalse();
    expect(service.unreadCount()).toBe(1);

    const req = httpTesting.expectOne(`${environment.apiUrl}/notifications/notif-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should trigger toast alert and invoke native haptics', fakeAsync(() => {
    const notif = mockNotifications[0];
    service.triggerToastAlert(notif);

    expect(service.activeToast()).toEqual(notif);
    expect(hapticsSpy.notification).toHaveBeenCalledWith('warning');

    tick(5000);
    expect(service.activeToast()).toBeNull();
  }));

  it('should dismiss toast immediately on dismissToast', () => {
    service.activeToast.set(mockNotifications[0]);
    service.dismissToast();

    expect(service.activeToast()).toBeNull();
  });

  it('should resolve correct navigation routes by notification type', () => {
    expect(service.resolveRouteForNotification({ type: 'Appointment' } as any)).toBe('/appointments');
    expect(service.resolveRouteForNotification({ type: 'Operatory' } as any)).toBe('/chair-board');
    expect(service.resolveRouteForNotification({ type: 'Chair' } as any)).toBe('/chair-board');
    expect(service.resolveRouteForNotification({ type: 'Billing' } as any)).toBe('/billing');
    expect(service.resolveRouteForNotification({ type: 'Inventory' } as any)).toBe('/inventory');
    expect(service.resolveRouteForNotification({ type: 'Radiology' } as any)).toBe('/radiology');
    expect(service.resolveRouteForNotification({ type: 'Other' } as any)).toBe('/dashboard');
  });

  it('should mark as read and navigate when navigateAndMarkRead is called', () => {
    service.notifications.set([...mockNotifications]);
    const notif = mockNotifications[0]; // Appointment

    service.navigateAndMarkRead(notif);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/appointments']);
    const req = httpTesting.expectOne(`${environment.apiUrl}/notifications/notif-1/read`);
    req.flush({});
  });
});
