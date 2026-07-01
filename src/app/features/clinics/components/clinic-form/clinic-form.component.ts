import { Component, Input, Output, EventEmitter, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClinicService } from '../../../../core/services/clinic.service';
import { Clinic } from '../../../../core/models/clinic.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { splitPhoneNumber, combinePhoneNumber } from '../../../../core/utils/phone.utils';
import { phoneValidator } from '../../../../core/validators/phone.validator';
import { PhoneInputFieldComponent } from '../../../../shared/components/phone-input-field/phone-input-field.component';
import { GooglePlacesDirective } from '../../../../shared/directives/google-places.directive';
import { LocationMapComponent } from '../../../../shared/components/location-map/location-map.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { WhatsappConnectionComponent } from '../whatsapp-connection/whatsapp-connection.component';

@Component({
  selector: 'app-clinic-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, PhoneInputFieldComponent, GooglePlacesDirective, LocationMapComponent, WhatsappConnectionComponent],
  templateUrl: './clinic-form.component.html',
  styleUrl: './clinic-form.component.css'
})
export class ClinicFormComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
  @Input() clinic?: Clinic;
  @Output() saved = new EventEmitter<Clinic>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clinicService = inject(ClinicService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  submitting = false;
  showWhatsappSetup = false;
  createdClinic: Clinic | null = null;
  selectedPlace: google.maps.places.PlaceResult | null = null;
  locationData?: {address: string, lat: number, lng: number, city?: string, state?: string, country?: string};

  selectedDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    countryCode: ['+20', Validators.required],
    phoneNumber: ['', [Validators.required, phoneValidator('countryCode')]],
    availabilityHours: ['09:00-17:00', [Validators.required]],
    availabilityDays: [JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']), [Validators.required]]
  });

  constructor() {
    this.form.get('countryCode')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form.get('phoneNumber')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    if (this.clinic) {
      const phoneData = splitPhoneNumber(this.clinic.phone);
      this.form.patchValue({
        name: this.clinic.name,
        address: this.clinic.address,
        countryCode: phoneData.countryCode,
        phoneNumber: phoneData.phoneNumber,
        availabilityHours: this.clinic.availabilityHours || '09:00-17:00',
        availabilityDays: this.clinic.availabilityDays || JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
      });
      if (this.clinic.availabilityDays) {
        try {
          this.selectedDays = JSON.parse(this.clinic.availabilityDays);
        } catch (e) {
          this.selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        }
      }
    }
  }

  toggleDay(day: string) {
    const hasDay = this.selectedDays.includes(day);
    if (hasDay) {
      this.selectedDays = this.selectedDays.filter(d => d !== day);
    } else {
      this.selectedDays = [...this.selectedDays, day];
    }
    this.form.get('availabilityDays')?.setValue(JSON.stringify(this.selectedDays));
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onMapLocationPicked(locationData: {address: string, lat: number, lng: number, city?: string, state?: string, country?: string}) {
    this.form.patchValue({
      address: locationData.address
    });
    this.locationData = locationData;
  }

  onPlaceSelect(place: google.maps.places.PlaceResult) {
    this.selectedPlace = place;
    this.form.patchValue({
      address: place.formatted_address || (place.name as string)
    });

    if (place.geometry?.location) {
      let city, state, country;
      if (place.address_components) {
        for (const component of place.address_components) {
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        }
      }
      this.locationData = {
        address: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        city, state, country
      };
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.form.value;
    const combinedPhone = combinePhoneNumber(formValue.countryCode, formValue.phoneNumber);

    if (this.clinic) {
      const updatedClinic: Clinic = {
        ...this.clinic,
        name: formValue.name || '',
        address: formValue.address || '',
        phone: combinedPhone,
        availabilityHours: formValue.availabilityHours || '09:00-17:00',
        availabilityDays: formValue.availabilityDays || JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        latitude: this.locationData?.lat ?? this.clinic.latitude,
        longitude: this.locationData?.lng ?? this.clinic.longitude,
        city: this.locationData?.city ?? this.clinic.city,
        state: this.locationData?.state ?? this.clinic.state,
        country: this.locationData?.country ?? this.clinic.country
      };

      this.clinicService.update(updatedClinic).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          this.submitting = false;
          this.toastr.success(
            this.langService.translate('toast.clinic_updated'),
            this.langService.translate('toast.success')
          );
          this.saved.emit(data);
          this.form.reset();
        },
        error: () => {
          this.submitting = false;
          this.toastr.error(
            this.langService.translate('toast.clinic_update_error'),
            this.langService.translate('toast.error')
          );
        }
      });
    } else {
      const newClinic: Clinic = {
        id: crypto.randomUUID(),
        name: formValue.name || '',
        address: formValue.address || '',
        phone: combinedPhone,
        availabilityHours: formValue.availabilityHours || '09:00-17:00',
        availabilityDays: formValue.availabilityDays || JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        latitude: this.locationData?.lat,
        longitude: this.locationData?.lng,
        city: this.locationData?.city,
        state: this.locationData?.state,
        country: this.locationData?.country
      };

      this.clinicService.create(newClinic).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          this.submitting = false;
          this.toastr.success(
            this.langService.translate('toast.clinic_created'),
            this.langService.translate('toast.success')
          );
          this.createdClinic = data;
          this.showWhatsappSetup = true;
        },
        error: () => {
          this.submitting = false;
          this.toastr.error(
            this.langService.translate('toast.clinic_create_error'),
            this.langService.translate('toast.error')
          );
        }
      });
    }
  }

  finishClinicCreation() {
    if (this.createdClinic) {
      this.saved.emit(this.createdClinic);
    }
    this.form.reset();
    this.showWhatsappSetup = false;
    this.createdClinic = null;
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}
