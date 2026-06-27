import { Component, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputFieldComponent } from '../input-field/input-field.component';
import { PhoneInputFieldComponent } from '../phone-input-field/phone-input-field.component';
import { LocationMapComponent } from '../location-map/location-map.component';
import { SpecializationGroup } from '../../../core/services/specialization.service';

@Component({
  selector: 'app-profile-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    InputFieldComponent,
    PhoneInputFieldComponent,
    LocationMapComponent
  ],
  templateUrl: './profile-details-form.html',
})
export class ProfileDetailsForm {
  parentFormGroup = input.required<FormGroup>();
  role = input.required<string>();
  specializationGroups = input<SpecializationGroup[]>([]);

  onLocationPicked(loc: any) {
    if (loc && loc.address) {
      this.parentFormGroup().get('address')?.setValue(loc.address);
    }
  }
}
