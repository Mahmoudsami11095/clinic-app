import { HttpInterceptorFn, HttpResponse, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  readMockList,
  resolveMockEntity,
  writeMockList,
} from '../mock/mock-data.store';

const entityMemoryCache: Partial<Record<string, unknown[]>> = {};

function getList(entity: string): unknown[] {
  if (!entityMemoryCache[entity]) {
    entityMemoryCache[entity] = readMockList(entity);
  }
  return entityMemoryCache[entity]!;
}

function setList(entity: string, list: unknown[]): void {
  entityMemoryCache[entity] = list;
  writeMockList(entity, list);
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  // Intercept authentication calls
  if (req.url.includes('/api/auth/login')) {
    if (req.method === 'POST') {
      const credentials = req.body as { email: string; password?: string } | null;
      if (!credentials || !credentials.email) {
        return of(new HttpResponse({ status: 400, body: { message: 'Missing credentials' } })).pipe(delay(400));
      }
      
      const usersList = getList('users');
      const user = usersList.find((u: any) => u.email.toLowerCase() === credentials.email.toLowerCase());
      
      if (user) {
        const { password, ...safeUser } = user as any;
        return of(new HttpResponse({ status: 200, body: { message: 'Login successful', data: safeUser } })).pipe(delay(400));
      } else {
        return throwError(() => new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          error: { message: 'Invalid credentials' },
          url: req.url
        })).pipe(delay(400));
      }
    }
  }

  if (req.url.includes('/api/auth/register')) {
    if (req.method === 'POST') {
      const userData = req.body as any;
      if (!userData || !userData.email || !userData.name || !userData.role) {
        return of(new HttpResponse({ status: 400, body: { message: 'Missing required registration details' } })).pipe(delay(400));
      }

      const usersList = [...getList('users')];
      
      if (usersList.some((u: any) => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return throwError(() => new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: { message: 'Email already registered' },
          url: req.url
        })).pipe(delay(400));
      }

      const nextPatientId = String(usersList.filter((u: any) => u.role === 'patient').length + 3); // starts after pat-1, pat-2

      const newUser = {
        id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        title: userData.role === 'patient' ? 'Registered Patient' : 
               userData.role === 'doctor' ? (userData.title || 'Specialist') : 
               userData.role === 'assistant' ? 'Clinical Assistant' : 'Clinic Staff',
        clinicId: userData.clinicId || undefined,
        clinicIds: userData.clinicIds || (userData.clinicId ? [userData.clinicId] : []),
        doctorId: userData.doctorId || undefined,
        patientId: userData.patientId || (userData.role === 'patient' ? nextPatientId : undefined),
        password: userData.password || 'password123'
      };

      usersList.push(newUser);
      setList('users', usersList);

      // Create a corresponding patient record if role is patient
      if (newUser.role === 'patient') {
        const patientsList = [...getList('patients')];
        const newPatientRecord = {
          id: newUser.patientId,
          firstName: userData.name.split(' ')[0] || userData.name,
          lastName: userData.name.split(' ').slice(1).join(' ') || '',
          email: newUser.email,
          contactNumber: userData.phone || '+1234567890',
          gender: userData.gender || 'Male',
          age: userData.age || 30,
          dateOfBirth: userData.dob || '1996-01-01',
          bloodGroup: userData.bloodGroup || 'O+',
          allergies: [],
          medications: [],
          clinicId: newUser.clinicId || 'clinic-1',
          registeredDate: new Date().toISOString().split('T')[0]
        };
        patientsList.push(newPatientRecord);
        setList('patients', patientsList);
      }

      const { password, ...safeUser } = newUser;
      return of(new HttpResponse({ status: 200, body: { message: 'Registration successful', data: safeUser } })).pipe(delay(400));
    }
  }

  // Intercept OTP sending
  if (req.url.includes('/api/auth/send-otp')) {
    if (req.method === 'POST') {
      const { email } = req.body as { email: string };
      if (!email) {
        return throwError(() => new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: { message: 'Email required' },
          url: req.url
        })).pipe(delay(400));
      }

      const usersList = getList('users');
      const user = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return throwError(() => new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          error: { message: 'Email not registered' },
          url: req.url
        })).pipe(delay(400));
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      localStorage.setItem(`otp_${email.toLowerCase()}`, code);

      return of(new HttpResponse({ status: 200, body: { message: 'OTP sent', otp: code } })).pipe(delay(400));
    }
  }

  // Intercept OTP verifying
  if (req.url.includes('/api/auth/verify-otp')) {
    if (req.method === 'POST') {
      const { email, code } = req.body as { email: string; code: string };
      if (!email || !code) {
        return throwError(() => new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: { message: 'Email and verification code are required' },
          url: req.url
        })).pipe(delay(400));
      }

      const storedCode = localStorage.getItem(`otp_${email.toLowerCase()}`);
      if (storedCode === code) {
        const usersList = getList('users');
        const user = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
          localStorage.removeItem(`otp_${email.toLowerCase()}`);
          const { password, ...safeUser } = user as any;
          return of(new HttpResponse({ status: 200, body: { message: 'OTP verified', data: safeUser } })).pipe(delay(400));
        }
      }

      return throwError(() => new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        error: { message: 'Invalid verification code' },
        url: req.url
      })).pipe(delay(400));
    }
  }

  // Intercept Social Sign In
  if (req.url.includes('/api/auth/social')) {
    if (req.method === 'POST') {
      const { provider } = req.body as { provider: string };
      const usersList = getList('users');
      // Google -> Dr. Jenkins, Microsoft/Apple -> John Doe
      const email = provider === 'google' ? 'dr.jenkins@clinic.com' : 'john.doe@example.com';
      const user = usersList.find((u: any) => u.email === email);

      if (user) {
        const { password, ...safeUser } = user as any;
        return of(new HttpResponse({ status: 200, body: { message: `Logged in via ${provider}`, data: safeUser } })).pipe(delay(500));
      }

      return throwError(() => new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: { message: 'Social authentication failed' },
        url: req.url
      }));
    }
  }

  const entity = resolveMockEntity(req.url);
  if (!entity) {
    return next(req);
  }

  if (req.method === 'GET') {
    const data = getList(entity);
    return of(new HttpResponse({ status: 200, body: { data } })).pipe(delay(400));
  }

  if (req.method === 'POST') {
    const newItem = req.body as Record<string, unknown> | null;
    const list = [...getList(entity)];

    if (newItem && typeof newItem === 'object') {
      if (!newItem['id']) {
        newItem['id'] = crypto.randomUUID();
      }
      list.push(newItem);
      setList(entity, list);
    }

    return of(new HttpResponse({ status: 200, body: { message: 'Success', data: newItem } })).pipe(delay(400));
  }

  if (req.method === 'PUT') {
    const updatedItem = req.body as Record<string, unknown> | null;
    const list = [...getList(entity)];

    if (updatedItem && typeof updatedItem === 'object') {
      const index = list.findIndex(
        item => (item as Record<string, unknown>)['id'] === updatedItem['id']
      );
      if (index !== -1) {
        list[index] = { ...(list[index] as object), ...updatedItem };
        setList(entity, list);
        return of(new HttpResponse({ status: 200, body: { message: 'Success', data: list[index] } })).pipe(
          delay(400)
        );
      }
    }

    const urlParts = req.url.split('/');
    const idFromUrl = urlParts[urlParts.length - 1];
    if (idFromUrl && updatedItem) {
      const index = list.findIndex(
        item => String((item as Record<string, unknown>)['id']) === idFromUrl
      );
      if (index !== -1) {
        list[index] = { ...(list[index] as object), ...updatedItem };
        setList(entity, list);
        return of(new HttpResponse({ status: 200, body: { message: 'Success', data: list[index] } })).pipe(
          delay(400)
        );
      }
    }

    return of(new HttpResponse({ status: 200, body: { message: 'Success' } })).pipe(delay(400));
  }

  if (req.method === 'DELETE') {
    const urlParts = req.url.split('/').filter(Boolean);
    const idFromUrl = urlParts[urlParts.length - 1];
    const list = [...getList(entity)];
    const index = list.findIndex(
      item => String((item as Record<string, unknown>)['id']) === idFromUrl
    );

    if (index !== -1) {
      list.splice(index, 1);
      setList(entity, list);
      return of(new HttpResponse({ status: 200, body: { message: 'Deleted' } })).pipe(delay(400));
    }

    return of(new HttpResponse({ status: 404, body: { message: 'Not found' } })).pipe(delay(400));
  }

  return next(req);
};
