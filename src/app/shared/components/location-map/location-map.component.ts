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
  @Output() locationPicked = new EventEmitter<{address: string, lat: number, lng: number}>();
  
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  // Default to Cairo, Egypt
  private defaultLocation = { lat: 30.0444, lng: 31.2357 };

  ngOnInit() {
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      this.geocoder = new google.maps.Geocoder();
      this.initMap();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['place'] && !changes['place'].firstChange) {
      this.updateMap();
    }
  }

  private initMap() {
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      let loc: any = this.defaultLocation;
      let hasPlace = false;
      
      if (this.place?.geometry?.location) {
        loc = this.place.geometry.location;
        hasPlace = true;
      }
      
      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: loc,
        zoom: hasPlace ? 15 : 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
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
      } else if (navigator.geolocation) {
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

      this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          this.handleMapClick(event.latLng);
        }
      });
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
            this.locationPicked.emit({
              address: results[0].formatted_address,
              lat: latLng.lat(),
              lng: latLng.lng()
            });
          });
        } else {
          console.error('Geocoder failed due to: ' + status);
        }
      });
    }
  }

  private updateMap() {
    this.googleMapsService.loadGoogleMapsScript().then(() => {
      if (!this.map) {
        this.initMap();
        return;
      }

      if (!this.place?.geometry?.location) {
        return;
      }

      const loc = this.place.geometry.location;
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
