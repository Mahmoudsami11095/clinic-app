import { Directive, ElementRef, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { GoogleMapsService } from '../../core/services/google-maps.service';

@Directive({
  selector: '[appGooglePlaces]',
  standalone: true
})
export class GooglePlacesDirective implements OnInit {
  private el = inject(ElementRef);
  private googleMapsService = inject(GoogleMapsService);

  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      this.initAutocomplete();
    }).catch(err => console.error('Failed to load Google Maps script', err));
  }

  private initAutocomplete() {
    const autocomplete = new google.maps.places.Autocomplete(this.el.nativeElement, {
      types: ['address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        this.el.nativeElement.value = place.formatted_address;
        this.el.nativeElement.dispatchEvent(new Event('input'));
        this.onSelect.emit(place);
      }
    });
  }
}
