import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClinicService } from '../../../../core/services/clinic.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { Clinic } from '../../../../core/models/clinic.model';

import { LocationMapComponent } from '../../../../shared/components/location-map/location-map.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WhatsappConnectionComponent } from '../whatsapp-connection/whatsapp-connection.component';

@Component({
  selector: 'app-clinic-details',
  imports: [CommonModule, RouterModule, LocationMapComponent, WhatsappConnectionComponent],
  templateUrl: './clinic-details.component.html',
  styleUrl: './clinic-details.component.css'
})
export class ClinicDetailsComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
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

  formattedAvailabilityDays = computed(() => {
    const clinic = this.clinic();
    if (!clinic || !clinic.availabilityDays) return 'Not specified';
    try {
      const daysArray = JSON.parse(clinic.availabilityDays);
      if (Array.isArray(daysArray)) {
        return daysArray.join(', ');
      }
    } catch (e) {
      // If it's not valid JSON, just return the string as is
      return clinic.availabilityDays;
    }
    return clinic.availabilityDays;
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
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clinicId.set(id);
        if (this.clinicService.clinics().length === 0) {
          this.clinicService.loadClinics();
        }
        this.doctorService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(docs => this.doctors.set(docs));
        this.patientService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pats => this.patients.set(pats));
        this.appointmentService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(appts => this.appointments.set(appts));
      } else {
        this.router.navigate(['/clinics']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/clinics']);
  }
}
