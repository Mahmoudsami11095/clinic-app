import { 
  Component, 
  ElementRef, 
  EventEmitter, 
  Input, 
  NgZone, 
  OnChanges, 
  OnInit, 
  AfterViewInit, 
  OnDestroy, 
  Output, 
  SimpleChanges, 
  ViewChild, 
  inject 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-map.component.html'
})
export class LocationMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private ngZone = inject(NgZone);

  @Input() place: any = null;
  @Input() lat?: number;
  @Input() lng?: number;
  @Input() initialAddress?: string | null;
  @Input() height: string = '400px';
  @Input() readOnly: boolean = false;
  @Output() locationPicked = new EventEmitter<{
    address: string;
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    country?: string;
  }>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  currentLat?: number;
  currentLng?: number;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  manualAddress: string = '';
  searchQuery: string = '';
  isSearching: boolean = false;
  isGeocoding: boolean = false;

  // Default coordinates (Cairo, Egypt)
  private readonly defaultLocation: [number, number] = [30.0444, 31.2357];

  ngOnInit() {
    this.manualAddress = this.initialAddress || '';
    if (this.lat) this.currentLat = this.lat;
    if (this.lng) this.currentLng = this.lng;
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['place'] || changes['lat'] || changes['lng']) && this.map) {
      this.updateMapFromInputs();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private createPinIcon(): L.DivIcon {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));">
          <div style="
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
            border: 2.5px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });
  }

  private initMap() {
    if (this.map) return;

    let initialCoords: [number, number] = this.defaultLocation;
    let hasCoords = false;

    if (this.lat && this.lng) {
      initialCoords = [this.lat, this.lng];
      hasCoords = true;
    } else if (this.place) {
      const coords = this.extractCoordsFromPlace(this.place);
      if (coords) {
        initialCoords = coords;
        hasCoords = true;
      }
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: initialCoords,
      zoom: hasCoords ? 15 : 11,
      zoomControl: !this.readOnly,
      dragging: !this.readOnly,
      touchZoom: !this.readOnly,
      doubleClickZoom: !this.readOnly,
      scrollWheelZoom: !this.readOnly,
      boxZoom: !this.readOnly,
      keyboard: !this.readOnly
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    if (hasCoords) {
      this.setMarker(initialCoords[0], initialCoords[1]);
    } else if (navigator.geolocation && !this.readOnly) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (this.map && !this.currentLat) {
            const userCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            this.map.setView(userCoords, 14);
          }
        },
        () => {}
      );
    }

    if (!this.readOnly) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.handleMapClick(e.latlng);
      });
    }

    // Ensure map tiles render accurately inside dynamic containers
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  private extractCoordsFromPlace(place: any): [number, number] | null {
    if (!place) return null;
    if (place.geometry?.location) {
      const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
      const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return [lat, lng];
      }
    }
    if (place.lat && (place.lng || place.lon)) {
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lng || place.lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    return null;
  }

  private setMarker(lat: number, lng: number) {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], {
        icon: this.createPinIcon(),
        draggable: !this.readOnly
      }).addTo(this.map);

      if (!this.readOnly) {
        this.marker.on('dragend', () => {
          if (this.marker) {
            const pos = this.marker.getLatLng();
            this.reverseGeocode(pos.lat, pos.lng);
          }
        });
      }
    }
  }

  private updateMapFromInputs() {
    let coords: [number, number] | null = null;
    if (this.lat && this.lng) {
      coords = [this.lat, this.lng];
    } else if (this.place) {
      coords = this.extractCoordsFromPlace(this.place);
    }

    if (coords && this.map) {
      this.map.setView(coords, 15);
      this.setMarker(coords[0], coords[1]);
    }
  }

  private handleMapClick(latlng: L.LatLng) {
    this.setMarker(latlng.lat, latlng.lng);
    this.reverseGeocode(latlng.lat, latlng.lng);
  }

  async onSearchLocation() {
    const query = this.searchQuery?.trim();
    if (!query) return;

    this.isSearching = true;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
          const state = addr.state || addr.governorate || '';
          const country = addr.country || '';

          this.ngZone.run(() => {
            this.currentLat = lat;
            this.currentLng = lng;
            this.currentCity = city;
            this.currentState = state;
            this.currentCountry = country;
            this.manualAddress = item.display_name;

            if (this.map) {
              this.map.setView([lat, lng], 15);
              this.setMarker(lat, lng);
            }
            this.emitLocation();
          });
        }
      }
    } catch (err) {
      console.warn('Location search error:', err);
    } finally {
      this.ngZone.run(() => {
        this.isSearching = false;
      });
    }
  }

  private async reverseGeocode(lat: number, lng: number) {
    this.isGeocoding = true;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
        const state = addr.state || addr.governorate || '';
        const country = addr.country || '';
        const formatted = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        this.ngZone.run(() => {
          this.manualAddress = formatted;
          this.currentLat = lat;
          this.currentLng = lng;
          this.currentCity = city;
          this.currentState = state;
          this.currentCountry = country;
          this.emitLocation();
        });
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
      this.ngZone.run(() => {
        this.currentLat = lat;
        this.currentLng = lng;
        if (!this.manualAddress) {
          this.manualAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
        this.emitLocation();
      });
    } finally {
      this.ngZone.run(() => {
        this.isGeocoding = false;
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
}
