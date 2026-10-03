import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ClinicalNoteAmendment {
  id: string;
  originalNoteId: string;
  amendedText: string;
  reason?: string;
  authorId: string;
  authorName: string;
  timestamp: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  clinicId?: string;
  createdAt: string;
  title: string;
  category: string;
  notes: string; // BR-RX-03 / BR-MED-01: Immutable original text
  amendments: ClinicalNoteAmendment[];
}

export interface CreateClinicalNoteRequest {
  patientId: string;
  title?: string;
  category?: string;
  notes: string;
  clinicId?: string;
}

export interface AmendClinicalNoteRequest {
  amendedText: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClinicalNotesService {
  private http = inject(HttpClient);

  /**
   * Retrieves all clinical encounter notes for a patient along with their amendment trails.
   */
  getNotes(patientId: string): Observable<ClinicalNote[]> {
    return this.http.get<{ data: ClinicalNote[] }>(`/api/clinical-notes?patientId=${encodeURIComponent(patientId)}`).pipe(
      map(res => res.data || [])
    );
  }

  /**
   * Retrieves a single clinical note by ID with complete amendment history.
   */
  getNoteById(id: string): Observable<ClinicalNote> {
    return this.http.get<{ data: ClinicalNote }>(`/api/clinical-notes/${encodeURIComponent(id)}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Records a new permanent clinical encounter note.
   */
  createNote(payload: CreateClinicalNoteRequest): Observable<ClinicalNote> {
    return this.http.post<{ message: string; data: ClinicalNote }>('/api/clinical-notes', payload).pipe(
      map(res => res.data)
    );
  }

  /**
   * Appends a timestamped amendment preserving author identity (BR-RX-03 / BR-MED-01).
   * Note: The original clinical note text is NEVER overwritten or modified.
   */
  amendNote(id: string, payload: AmendClinicalNoteRequest): Observable<ClinicalNote> {
    return this.http.put<{ message: string; data: ClinicalNote }>(`/api/clinical-notes/${encodeURIComponent(id)}`, payload).pipe(
      map(res => res.data)
    );
  }

  // NOTE: In strict accordance with BR-RX-03 and BR-MED-01, clinical notes cannot be deleted.
  // No deleteNote() method exists in this service to prevent accidental invocations.
}
