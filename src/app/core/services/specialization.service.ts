import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SpecializationDto {
  id: string;
  name: string;
  translationKey: string;
  category: string;
}

export interface SpecializationGroup {
  groupLabelKey: string;
  options: {
    value: string;
    labelKey: string;
    id: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class SpecializationService {
  private apiUrl = `${environment.apiUrl}/specializations`;

  constructor(private http: HttpClient) {}

  getSpecializations(): Observable<SpecializationDto[]> {
    return this.http.get<{ success: boolean; data: SpecializationDto[] }>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getGroupedSpecializations(): Observable<SpecializationGroup[]> {
    return this.getSpecializations().pipe(
      map(specializations => {
        const groups: { [key: string]: SpecializationGroup } = {};

        specializations.forEach(spec => {
          const groupKey = spec.category;
          if (!groups[groupKey]) {
            groups[groupKey] = {
              groupLabelKey: groupKey === 'Dentistry' ? 'auth.spec_group_dentistry' : 'auth.spec_group_medicine',
              options: []
            };
          }

          groups[groupKey].options.push({
            value: spec.name,
            labelKey: spec.translationKey,
            id: spec.id
          });
        });

        return Object.values(groups);
      })
    );
  }
}
