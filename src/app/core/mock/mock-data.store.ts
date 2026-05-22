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
    const doctors = readMockList('doctors');
    const hasVance = doctors.some((d: any) => d.id === '106');
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

  localStorage.setItem(INIT_FLAG_KEY, 'true');
}
