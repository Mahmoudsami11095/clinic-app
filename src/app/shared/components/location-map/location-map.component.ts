import { Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsService } from '../../../core/services/google-maps.service';

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-map.component.html'
})
export class LocationMapComponent implements OnInit, OnChanges {
  private ngZone = inject(NgZone);
  private googleMapsService = inject(GoogleMapsService);
  @Input() place: google.maps.places.PlaceResult | null = null;
  @Input() lat?: number;
  @Input() lng?: number;
  @Input() initialAddress?: string | null;
  @Input() height: string = '400px';
  @Input() readOnly: boolean = false;
  @Output() locationPicked = new EventEmitter<{address: string, lat: number, lng: number, city?: string, state?: string, country?: string}>();
  
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  currentLat?: number;
  currentLng?: number;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  manualAddress: string = '';

  // Default to Cairo, Egypt
  private defaultLocation = { lat: 30.0444, lng: 31.2357 };

  ngOnInit() {
    this.manualAddress = this.initialAddress || '';
    if (this.lat) this.currentLat = this.lat;
    if (this.lng) this.currentLng = this.lng;
    
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      this.geocoder = new google.maps.Geocoder();
      this.initMap();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['place'] || changes['lat'] || changes['lng']) {
      if (!changes['place']?.firstChange && !changes['lat']?.firstChange) {
        this.updateMap();
      }
    }
  }

  private initMap() {
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      let loc: any = this.defaultLocation;
      let hasPlace = false;
      
      if (this.place?.geometry?.location) {
        loc = this.place.geometry.location;
        hasPlace = true;
      } else if (this.lat && this.lng) {
        loc = { lat: this.lat, lng: this.lng };
        hasPlace = true;
      }
      
      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: loc,
        zoom: hasPlace ? 15 : 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: !this.readOnly,
        draggable: !this.readOnly,
        disableDoubleClickZoom: this.readOnly,
        keyboardShortcuts: !this.readOnly,
        scrollwheel: !this.readOnly,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      if (hasPlace) {
        this.marker = new google.maps.Marker({
          position: loc,
          map: this.map,
          animation: google.maps.Animation.DROP
        });
      } else if (navigator.geolocation && !this.readOnly) {
        // Try HTML5 geolocation if no place is selected yet
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            if (this.map) {
              this.map.panTo(pos);
              this.map.setZoom(14);
            }
          },
          () => {
            // Silently fail and keep the default location if user denies permission
          }
        );
      }

      if (!this.readOnly) {
        this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            this.handleMapClick(event.latLng);
          }
        });
      }
    });
  }

  private handleMapClick(latLng: google.maps.LatLng) {
    // Move or create marker
    if (this.marker) {
      this.marker.setPosition(latLng);
    } else {
      this.marker = new google.maps.Marker({
        position: latLng,
        map: this.map,
        animation: google.maps.Animation.DROP
      });
    }

    // Geocode the clicked location
    if (this.geocoder) {
      this.geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          this.ngZone.run(() => {
            const result = results[0];
            let city, state, country;
            
            for (const component of result.address_components) {
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

            this.currentLat = latLng.lat();
            this.currentLng = latLng.lng();
            this.currentCity = city;
            this.currentState = state;
            this.currentCountry = country;
            this.manualAddress = result.formatted_address;

            this.emitLocation();
          });
        } else {
          console.error('Geocoder failed due to: ' + status);
        }
      });
    }
  }

  onManualAddressChange(event: Event) {
    const input = event.target as HTMLTextAreaElement | HTMLInputElement;
    this.manualAddress = input.value;
    if (this.currentLat && this.currentLng) {
      this.emitLocation();
    }
  }

  private emitLocation() {
    if (!this.currentLat || !this.currentLng) return;
    this.locationPicked.emit({
      address: this.manualAddress,
      lat: this.currentLat,
      lng: this.currentLng,
      city: this.currentCity,
      state: this.currentState,
      country: this.currentCountry
    });
  }

  private updateMap() {
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      if (!this.map) {
        this.initMap();
        return;
      }

      let loc: any = null;
      if (this.place?.geometry?.location) {
        loc = this.place.geometry.location;
      } else if (this.lat && this.lng) {
        loc = { lat: this.lat, lng: this.lng };
      }

      if (!loc) return;

      this.map.panTo(loc);
      this.map.setZoom(15);
      
      if (this.marker) {
        this.marker.setPosition(loc);
      } else {
        this.marker = new google.maps.Marker({
          position: loc,
          map: this.map,
          animation: google.maps.Animation.DROP
        });
      }
    });
  }
}
