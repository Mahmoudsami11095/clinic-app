import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin, map } from 'rxjs';

export const MOCK_ENTITIES_WITH_JSON = [
  'patients',
  'appointments',
  'doctors',
  'billing',
  'clinics',
] as const;

export type MockEntity = (typeof MOCK_ENTITIES_WITH_JSON)[number] | 'prescriptions';

export const MOCK_STORAGE_PREFIX = 'mock_';
const INIT_FLAG_KEY = 'mock_db_initialized';

export function mockStorageKey(entity: string): string {
  return `${MOCK_STORAGE_PREFIX}${entity}`;
}

export function resolveMockEntity(url: string): string | null {
  if (url.includes('/api/patients')) return 'patients';
  if (url.includes('/api/appointments')) return 'appointments';
  if (url.includes('/api/doctors')) return 'doctors';
  if (url.includes('/api/billing')) return 'billing';
  if (url.includes('/api/prescriptions')) return 'prescriptions';
  if (url.includes('/api/clinics')) return 'clinics';
  if (url.includes('/api/dental')) return 'dental';
  if (url.includes('/api/users')) return 'users';
  return null;
}

export function readMockList(entity: string): unknown[] {
  const raw = localStorage.getItem(mockStorageKey(entity));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMockList(entity: string, list: unknown[]): void {
  localStorage.setItem(mockStorageKey(entity), JSON.stringify(list));
}

export function isMockDatabaseInitialized(): boolean {
  return localStorage.getItem(INIT_FLAG_KEY) === 'true';
}

/** Load all JSON seed files into localStorage (runs once until storage is cleared). */
export async function initializeMockDatabase(http: HttpClient): Promise<void> {
  if (isMockDatabaseInitialized()) {
    // Ensure Dr. Marcus Vance (id: '106') is loaded into the mock database even if it was previously initialized
    const doctors = readMockList('doctors') as { id?: string }[];
    const hasVance = doctors.some(d => d.id === '106');
    if (!hasVance) {
      const vance = {
        id: '106',
        firstName: 'Marcus',
        lastName: 'Vance',
        specialization: 'Dentistry',
        email: 'dr.vance@clinic.com',
        contactNumber: '+1234567890',
        avatar: null,
        clinicIds: ['clinic-1', 'clinic-2', 'clinic-3'],
        availability: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          hours: '09:00-17:00'
        }
      };
      writeMockList('doctors', [...doctors, vance]);
    }
    return;
  }

  const missingJsonEntities = MOCK_ENTITIES_WITH_JSON.filter(
    entity => !localStorage.getItem(mockStorageKey(entity))
  );

  if (missingJsonEntities.length > 0) {
    const seeded = await firstValueFrom(
      forkJoin(
        missingJsonEntities.map(entity =>
          http.get<{ data: unknown[] }>(`/assets/mock-data/${entity}.json`).pipe(
            map(res => ({ entity, data: res.data ?? [] }))
          )
        )
      )
    );
    for (const { entity, data } of seeded) {
      writeMockList(entity, data);
    }
  }

  if (!localStorage.getItem(mockStorageKey('prescriptions'))) {
    writeMockList('prescriptions', []);
  }

  if (!localStorage.getItem(mockStorageKey('dental'))) {
    writeMockList('dental', []);
  }

  if (!localStorage.getItem(mockStorageKey('users'))) {
    const defaultUsers = [
      {
        id: 'super-admin',
        name: 'Super Admin User',
        role: 'admin',
        email: 'superadmin@medclinic.com',
        title: 'System Director',
        password: 'password123'
      },
      {
        id: 'admin-1',
        name: 'City Clinic Admin',
        role: 'admin',
        clinicId: 'clinic-1',
        email: 'admin.city@clinic.com',
        title: 'Clinic Director',
        password: 'password123'
      },
      {
        id: 'admin-2',
        name: 'Metro Clinic Admin',
        role: 'admin',
        clinicId: 'clinic-2',
        email: 'admin.metro@clinic.com',
        title: 'Clinic Director',
        password: 'password123'
      },
      {
        id: 'doc-101',
        name: 'Dr. Sarah Jenkins',
        role: 'doctor',
        doctorId: '101',
        clinicIds: ['clinic-1', 'clinic-2'],
        email: 'dr.jenkins@clinic.com',
        title: 'Chief Cardiologist',
        password: 'password123'
      },
      {
        id: 'doc-102',
        name: 'Dr. Michael Chen',
        role: 'doctor',
        doctorId: '102',
        clinicIds: ['clinic-2', 'clinic-3'],
        email: 'dr.chen@clinic.com',
        title: 'Pediatric Specialist',
        password: 'password123'
      },
      {
        id: 'doc-105',
        name: 'Dr. Zidan Kareem',
        role: 'doctor',
        doctorId: '105',
        clinicIds: ['clinic-3', 'clinic-1'],
        email: 'dr.zidan@clinic.com',
        title: 'Senior Dentist',
        password: 'password123'
      },
      {
        id: 'doc-106',
        name: 'Dr. Marcus Vance',
        role: 'doctor',
        doctorId: '106',
        clinicIds: ['clinic-1', 'clinic-2', 'clinic-3'],
        email: 'dr.vance@clinic.com',
        title: 'Dentist Practitioner',
        password: 'password123'
      },
      {
        id: 'asst-101',
        name: 'City Clinic Assistant',
        role: 'assistant',
        clinicId: 'clinic-1',
        doctorId: '101',
        email: 'asst.city@clinic.com',
        title: 'Clinical Assistant',
        password: 'password123'
      },
      {
        id: 'asst-102',
        name: 'Metro Clinic Assistant',
        role: 'assistant',
        clinicId: 'clinic-2',
        doctorId: '101',
        email: 'asst.metro@clinic.com',
        title: 'Clinical Assistant',
        password: 'password123'
      },
      {
        id: 'pat-1',
        name: 'John Doe',
        role: 'patient',
        clinicId: 'clinic-1',
        patientId: '1',
        email: 'john.doe@example.com',
        title: 'Registered Patient',
        password: 'password123'
      },
      {
        id: 'pat-2',
        name: 'Jane Smith',
        role: 'patient',
        clinicId: 'clinic-2',
        patientId: '2',
        email: 'jane.smith@example.com',
        title: 'Registered Patient',
        password: 'password123'
      }
    ];
    writeMockList('users', defaultUsers);
  }

  localStorage.setItem(INIT_FLAG_KEY, 'true');
}
