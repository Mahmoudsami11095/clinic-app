import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'doctor' | 'assistant' | 'patient';
  doctorId?: string; // Associated doctor record ID
  patientId?: string; // Associated patient record ID
  email: string;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Available mock users for switcher
  readonly mockUsers: User[] = [
    {
      id: 'admin-1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@medclinic.com',
      title: 'Clinic Director'
    },
    {
      id: 'doc-101',
      name: 'Dr. Sarah Jenkins',
      role: 'doctor',
      doctorId: '101',
      email: 'dr.jenkins@clinic.com',
      title: 'Chief Cardiologist'
    },
    {
      id: 'doc-102',
      name: 'Dr. Michael Chen',
      role: 'doctor',
      doctorId: '102',
      email: 'dr.chen@clinic.com',
      title: 'Pediatric Specialist'
    },
    {
      id: 'doc-105',
      name: 'Dr. Zidan Kareem',
      role: 'doctor',
      doctorId: '105',
      email: 'dr.zidan@clinic.com',
      title: 'Senior Dentist'
    },
    {
      id: 'asst-101',
      name: 'Sarah\'s Assistant',
      role: 'assistant',
      doctorId: '101',
      email: 'asst.jenkins@clinic.com',
      title: 'Clinical Assistant'
    },
    {
      id: 'pat-1',
      name: 'John Doe',
      role: 'patient',
      patientId: '1',
      email: 'john.doe@example.com',
      title: 'Registered Patient'
    },
    {
      id: 'pat-2',
      name: 'Jane Smith',
      role: 'patient',
      patientId: '2',
      email: 'jane.smith@example.com',
      title: 'Registered Patient'
    }
  ];

  private currentUserSignal = signal<User>(this.getInitialUser());

  currentUser = this.currentUserSignal.asReadonly();

  isAdmin = computed(() => this.currentUserSignal().role === 'admin');
  isDoctor = computed(() => this.currentUserSignal().role === 'doctor');
  isAssistant = computed(() => this.currentUserSignal().role === 'assistant');
  isPatient = computed(() => this.currentUserSignal().role === 'patient');

  currentDoctorId = computed(() => this.currentUserSignal().doctorId);
  currentPatientId = computed(() => this.currentUserSignal().patientId);

  private getInitialUser(): User {
    const saved = localStorage.getItem('clinic_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = this.mockUsers.find(u => u.id === parsed.id);
        if (match) return match;
      } catch (e) {
        // Fallback
      }
    }
    return this.mockUsers[0]; // Admin by default
  }

  setCurrentUser(user: User) {
    this.currentUserSignal.set(user);
    localStorage.setItem('clinic_current_user', JSON.stringify(user));
  }

  logout() {
    this.setCurrentUser(this.mockUsers[0]);
  }
}
