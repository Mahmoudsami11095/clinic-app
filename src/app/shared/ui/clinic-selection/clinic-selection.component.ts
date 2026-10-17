import { Component, Input, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { InputFieldComponent } from '../input-field/input-field.component';
import { PhoneInputFieldComponent } from '../phone-input-field/phone-input-field.component';
import { LocationMapComponent } from '../location-map/location-map.component';
import { phoneValidator } from '../../../core/validators/phone.validator';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-clinic-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputFieldComponent, PhoneInputFieldComponent, LocationMapComponent],
  templateUrl: './clinic-selection.component.html'
})
export class ClinicSelectionComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  @Input({ required: true }) formGroup!: FormGroup;
  
  // Array of clinics from the parent
  @Input() clinics: { id: string; name: string; hours: string; days: string[]; selected: boolean }[] = [];

  showCreateClinic = signal<boolean>(false);
  selectedClinicDays = signal<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  ngOnInit() {
    if (this.clinics.length === 0) {
      this.showCreateClinic.set(true);
    }

    this.formGroup.get('clinicName')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      const phoneCtrl = this.formGroup.get('newClinicPhoneNumber');
      const addressCtrl = this.formGroup.get('clinicAddress');
      const startCtrl = this.formGroup.get('clinicAvailabilityStart');
      const endCtrl = this.formGroup.get('clinicAvailabilityEnd');
      const daysCtrl = this.formGroup.get('clinicAvailabilityDays');
      
      if (val && val.trim().length >= 3) {
        phoneCtrl?.setValidators([Validators.required, phoneValidator('newClinicCountryCode')]);
        addressCtrl?.setValidators([Validators.required]);
        startCtrl?.setValidators([Validators.required]);
        endCtrl?.setValidators([Validators.required]);
        daysCtrl?.setValidators([Validators.required]);
      } else {
        phoneCtrl?.setValidators([phoneValidator('newClinicCountryCode')]);
        addressCtrl?.clearValidators();
        startCtrl?.clearValidators();
        endCtrl?.clearValidators();
        daysCtrl?.clearValidators();
      }
      phoneCtrl?.updateValueAndValidity();
      addressCtrl?.updateValueAndValidity();
      startCtrl?.updateValueAndValidity();
      endCtrl?.updateValueAndValidity();
      daysCtrl?.updateValueAndValidity();
    });

    this.formGroup.get('newClinicCountryCode')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formGroup.get('newClinicPhoneNumber')?.updateValueAndValidity();
    });
  }

  toggleClinicSelection(clinicId: string) {
    const clinic = this.clinics.find(c => c.id === clinicId);
    if (clinic) {
      clinic.selected = !clinic.selected;
    }
  }

  toggleClinicDay(clinicId: string, day: string) {
    const clinic = this.clinics.find(c => c.id === clinicId);
    if (clinic) {
      if (clinic.days.includes(day)) {
        clinic.days = clinic.days.filter(d => d !== day);
      } else {
        clinic.days = [...clinic.days, day];
      }
    }
  }

  toggleRegisterClinicDay(day: string) {
    this.selectedClinicDays.update(days => {
      const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
      this.formGroup.get('clinicAvailabilityDays')?.setValue(JSON.stringify(newDays));
      return newDays;
    });
  }

  onClinicLocationPicked(location: any) {
    this.formGroup.get('clinicAddress')?.setValue(location.address);
    this.formGroup.patchValue({
      latitude: location.lat,
      longitude: location.lng,
      city: location.city,
      state: location.state,
      country: location.country
    });
  }
}
