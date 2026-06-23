import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
    type: string;
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface PhotonResponse {
  features: PhotonFeature[];
}

@Injectable({
  providedIn: 'root'
})
export class PhotonMapService {
  private http = inject(HttpClient);
  private baseUrl = 'https://photon.komoot.io/api/';

  search(query: string, limit: number = 5): Observable<PhotonFeature[]> {
    return this.http.get<PhotonResponse>(this.baseUrl, {
      params: {
        q: query,
        limit: limit.toString()
      }
    }).pipe(
      map(res => res.features || [])
    );
  }

  reverse(lat: number, lon: number): Observable<PhotonFeature[]> {
    return this.http.get<PhotonResponse>(this.baseUrl + 'reverse', {
      params: {
        lat: lat.toString(),
        lon: lon.toString()
      }
    }).pipe(
      map(res => res.features || [])
    );
  }

  formatAddress(feature: PhotonFeature): string {
    const p = feature.properties;
    const parts = [];
    
    // Sometimes name is just the street or city, try to avoid duplicates
    if (p.name && p.name !== p.street && p.name !== p.city) {
      parts.push(p.name);
    }
    
    if (p.housenumber && p.street) {
      parts.push(`${p.housenumber} ${p.street}`);
    } else if (p.street) {
      parts.push(p.street);
    }
    
    if (p.city) parts.push(p.city);
    if (p.state && p.state !== p.city) parts.push(p.state);
    if (p.country) parts.push(p.country);
    
    // Fallback if parts is empty but name exists
    if (parts.length === 0 && p.name) {
       parts.push(p.name);
    }
    
    return parts.join(', ');
  }
}
