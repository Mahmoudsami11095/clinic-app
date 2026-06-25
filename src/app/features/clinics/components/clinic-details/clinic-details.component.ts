import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClinicService } from '../../../../core/services/clinic.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { Clinic } from '../../../../core/models/clinic.model';

@Component({
  selector: 'app-clinic-details',
  imports: [CommonModule, RouterModule],
  templateUrl: './clinic-details.component.html',
  styleUrl: './clinic-details.component.css'
})
export class ClinicDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clinicService = inject(ClinicService);
  private doctorService = inject(DoctorService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);

  clinicId = signal<string | null>(null);
  clinic = computed(() => {
    const id = this.clinicId();
    if (!id) return undefined;
    return this.clinicService.clinics().find(c => c.id === id);
  });


  doctors = signal<any[]>([]);
  patients = signal<any[]>([]);
  appointments = signal<any[]>([]);

  clinicDoctors = computed(() => {
    const id = this.clinicId();
    if (!id) return [];
    return this.doctors().filter(d => d.clinicIds?.includes(id));
  });

  clinicPatients = computed(() => {
    const id = this.clinicId();
    if (!id) return [];
    return this.patients().filter(p => p.clinicId === id);
  });

  clinicAppointments = computed(() => {
    const id = this.clinicId();
    if (!id) return [];
    return this.appointments().filter(a => a.clinicId === id);
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clinicId.set(id);
        if (this.clinicService.clinics().length === 0) {
          this.clinicService.loadClinics();
        }
        this.doctorService.getAll().subscribe(docs => this.doctors.set(docs));
        this.patientService.getAll().subscribe(pats => this.patients.set(pats));
        this.appointmentService.getAll().subscribe(appts => this.appointments.set(appts));
      } else {
        this.router.navigate(['/clinics']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/clinics']);
  }
}
