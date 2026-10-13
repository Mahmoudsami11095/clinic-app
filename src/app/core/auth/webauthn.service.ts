import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebAuthnService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/webauthn`;

  // Simulated WebAuthn navigator.credentials.create wrapper
  registerBiometrics(): Observable<{ message: string }> {
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/register/options`, {}).subscribe({
        next: (options) => {
          // Simulate browser API resolving the challenge
          const mockCredential = {
            id: btoa('mock-credential-id'),
            publicKeyBase64: btoa('mock-public-key')
          };
          this.http.post<{ message: string }>(`${this.apiUrl}/register`, mockCredential).subscribe({
            next: (res) => {
              observer.next(res);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // Simulated WebAuthn navigator.credentials.get wrapper
  loginWithBiometrics(): Observable<{ token: string; user: User }> {
    return new Observable(observer => {
      this.http.post<any>(`${this.apiUrl}/authenticate/options`, {}).subscribe({
        next: (options) => {
          // Simulate user placing their finger on TouchID
          const mockAuthAssertion = {
            id: btoa('mock-credential-id'),
            authenticatorData: btoa('auth-data'),
            signature: btoa('mock-sig'),
            clientDataJson: btoa('client-data')
          };
          
          this.http.post<{ token: string; user: User }>(`${this.apiUrl}/authenticate`, mockAuthAssertion).subscribe({
            next: (res) => {
              observer.next(res);
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }
}
