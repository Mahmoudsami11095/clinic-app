import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface PostOpTriageSession {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  procedureName: string;
  procedureDate: string;
  intervalHours: number;
  triageStatus: 'Scheduled' | 'PendingResponse' | 'Recovering' | 'Escalated' | 'Resolved';
  scheduledDispatchUtc: string;
  dispatchedAtUtc?: string;
  respondedAtUtc?: string;
  painScore?: number;
  bleedingSeverity?: 'None' | 'Slight' | 'Severe';
  swellingSeverity?: 'None' | 'Moderate' | 'Severe';
  patientFeedback?: string;
  isEscalated: boolean;
  escalationReason?: string;
  doctorClinicalAction?: string;
  resolvedAtUtc?: string;
  resolvedByDoctorId?: string;
  resolvedByDoctorName?: string;
  createdAtUtc: string;
}

export interface TriggerTriageRequest {
  patientId: string;
  patientName: string;
  patientPhone: string;
  procedureName: string;
  intervalHours?: number;
  immediateDispatch: boolean;
}

export interface SimulateResponseRequest {
  painScore: number;
  bleedingSeverity: 'None' | 'Slight' | 'Severe';
  swellingSeverity: 'None' | 'Moderate' | 'Severe';
  patientFeedback?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostOpTriageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/PostOpTriage`;

  private mockSessions: PostOpTriageSession[] = [
    {
      id: 'postop-mock-1',
      clinicId: 'clinic-main',
      patientId: 'pat-101',
      patientName: 'Sarah Jenkins',
      patientPhone: '+15550192834',
      procedureName: 'Surgical Extraction of Impacted Wisdom Tooth #38',
      procedureDate: new Date(Date.now() - 86400000).toISOString(),
      intervalHours: 24,
      triageStatus: 'Escalated',
      scheduledDispatchUtc: new Date(Date.now() - 21600000).toISOString(),
      dispatchedAtUtc: new Date(Date.now() - 21600000).toISOString(),
      respondedAtUtc: new Date(Date.now() - 18000000).toISOString(),
      painScore: 9,
      bleedingSeverity: 'Severe',
      swellingSeverity: 'Severe',
      patientFeedback: 'Severe throbbing pain keeping me awake. Gauze pad is soaked every 20 minutes.',
      isEscalated: true,
      escalationReason: 'Severe pain level reported (9/10); Persistent severe active bleeding; Significant acute facial/intraoral swelling',
      createdAtUtc: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'postop-mock-2',
      clinicId: 'clinic-main',
      patientId: 'pat-102',
      patientName: 'Michael Chang',
      patientPhone: '+15550293847',
      procedureName: 'Dental Implant Placement #46 (Titanium Fixture)',
      procedureDate: new Date(Date.now() - 86400000).toISOString(),
      intervalHours: 24,
      triageStatus: 'Recovering',
      scheduledDispatchUtc: new Date(Date.now() - 28800000).toISOString(),
      dispatchedAtUtc: new Date(Date.now() - 28800000).toISOString(),
      respondedAtUtc: new Date(Date.now() - 25200000).toISOString(),
      painScore: 3,
      bleedingSeverity: 'None',
      swellingSeverity: 'Moderate',
      patientFeedback: 'Pain is well managed with prescribed Ibuprofen. Mild cheek swelling but overall comfortable.',
      isEscalated: false,
      createdAtUtc: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  getTriageSessions(escalatedOnly?: boolean, status?: string): Observable<PostOpTriageSession[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (escalatedOnly !== undefined) params.push(`escalatedOnly=${escalatedOnly}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<PostOpTriageSession[]>(url).pipe(
      catchError(() => {
        let results = [...this.mockSessions];
        if (escalatedOnly) results = results.filter(s => s.isEscalated);
        if (status) results = results.filter(s => s.triageStatus.toLowerCase() === status.toLowerCase());
        return of(results);
      })
    );
  }

  triggerTriage(request: TriggerTriageRequest): Observable<PostOpTriageSession> {
    return this.http.post<PostOpTriageSession>(`${this.apiUrl}/trigger`, request).pipe(
      catchError(() => {
        const newSession: PostOpTriageSession = {
          id: `postop-mock-${Date.now()}`,
          clinicId: 'clinic-main',
          patientId: request.patientId,
          patientName: request.patientName,
          patientPhone: request.patientPhone,
          procedureName: request.procedureName,
          procedureDate: new Date().toISOString(),
          intervalHours: request.intervalHours || 24,
          triageStatus: request.immediateDispatch ? 'PendingResponse' : 'Scheduled',
          scheduledDispatchUtc: new Date().toISOString(),
          dispatchedAtUtc: request.immediateDispatch ? new Date().toISOString() : undefined,
          isEscalated: false,
          createdAtUtc: new Date().toISOString()
        };
        this.mockSessions.unshift(newSession);
        return of(newSession);
      })
    );
  }

  simulateResponse(id: string, request: SimulateResponseRequest): Observable<PostOpTriageSession> {
    return this.http.post<PostOpTriageSession>(`${this.apiUrl}/${id}/simulate-response`, request).pipe(
      catchError(() => {
        const session = this.mockSessions.find(s => s.id === id);
        if (session) {
          session.respondedAtUtc = new Date().toISOString();
          session.painScore = request.painScore;
          session.bleedingSeverity = request.bleedingSeverity;
          session.swellingSeverity = request.swellingSeverity;
          session.patientFeedback = request.patientFeedback;

          const isEscalated = request.painScore > 7 || request.bleedingSeverity === 'Severe' || request.swellingSeverity === 'Severe';
          session.isEscalated = isEscalated;
          session.triageStatus = isEscalated ? 'Escalated' : 'Recovering';
          session.escalationReason = isEscalated ? 'Symptoms breach clinical thresholds' : undefined;
          return of(session);
        }
        return of({} as PostOpTriageSession);
      })
    );
  }

  resolveTriage(id: string, doctorAction: string): Observable<PostOpTriageSession> {
    return this.http.post<PostOpTriageSession>(`${this.apiUrl}/${id}/resolve`, { doctorClinicalAction: doctorAction }).pipe(
      catchError(() => {
        const session = this.mockSessions.find(s => s.id === id);
        if (session) {
          session.isEscalated = false;
          session.triageStatus = 'Resolved';
          session.doctorClinicalAction = doctorAction;
          session.resolvedAtUtc = new Date().toISOString();
          session.resolvedByDoctorName = 'Dr. Attending Surgeon';
          return of(session);
        }
        return of({} as PostOpTriageSession);
      })
    );
  }
}
