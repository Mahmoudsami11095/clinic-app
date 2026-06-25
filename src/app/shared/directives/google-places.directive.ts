import { Directive, ElementRef, OnInit, Output, EventEmitter, inject, NgZone, OnDestroy } from '@angular/core';
import { GoogleMapsService } from '../../core/services/google-maps.service';

@Directive({
  selector: '[appGooglePlaces]',
  standalone: true
})
export class GooglePlacesDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private googleMapsService = inject(GoogleMapsService);
  private ngZone = inject(NgZone);
  private autocomplete: google.maps.places.Autocomplete | null = null;

  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      this.initAutocomplete();
    }).catch(err => console.error('Failed to load Google Maps script', err));
  }

  private initAutocomplete() {
    this.ngZone.runOutsideAngular(() => {
      this.autocomplete = new google.maps.places.Autocomplete(this.el.nativeElement, {
        types: ['address']
      });

      this.autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = this.autocomplete?.getPlace();
          if (place && place.formatted_address) {
            this.el.nativeElement.value = place.formatted_address;
            this.el.nativeElement.dispatchEvent(new Event('input'));
            this.onSelect.emit(place);
          }
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.autocomplete) {
      google.maps.event.clearInstanceListeners(this.autocomplete);
    }
  }
}
