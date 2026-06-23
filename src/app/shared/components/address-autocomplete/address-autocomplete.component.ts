import { Component, Input, forwardRef, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, filter, tap } from 'rxjs';
import { PhotonMapService, PhotonFeature } from '../../../core/services/photon-map.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import * as L from 'leaflet';

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './address-autocomplete.component.html',
  styleUrls: ['./address-autocomplete.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressAutocompleteComponent),
      multi: true
    }
  ]
})
export class AddressAutocompleteComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label: string = 'Address';
  @Input() placeholder: string = 'Search for an address...';
  @Input() showMap: boolean = true;
  @Input() required: boolean = false;
  @Input() isInvalid: boolean = false;
  @Input() errorMessage: string = '';

  @ViewChild('mapElement') mapElement!: ElementRef;

  searchControl = new FormControl('');
  results: PhotonFeature[] = [];
  isLoading = false;
  showDropdown = false;
  hasMapData = false;
  isMapExpanded = false;

  private destroy$ = new Subject<void>();
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  onChange: any = () => {};
  onTouched: any = () => {};

  constructor(public photonService: PhotonMapService) {}

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(query => {
        if (!query || query.length < 3) {
          this.results = [];
          this.showDropdown = false;
          this.isLoading = false;
        } else {
          this.isLoading = true;
        }
      }),
      filter(query => !!query && query.length >= 3),
      switchMap(query => this.photonService.search(query as string))
    ).subscribe(results => {
      this.results = results;
      this.showDropdown = results.length > 0;
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  writeValue(value: string): void {
    if (value !== this.searchControl.value) {
      this.searchControl.setValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }

  onInput() {
    this.onChange(this.searchControl.value);
  }

  selectAddress(feature: PhotonFeature) {
    const formatted = this.photonService.formatAddress(feature);
    this.searchControl.setValue(formatted, { emitEvent: false });
    this.onChange(formatted);
    this.showDropdown = false;
    
    if (this.showMap && feature.geometry && feature.geometry.coordinates) {
      const [lon, lat] = feature.geometry.coordinates;
      this.isMapExpanded = true;
      this.updateMap(lat, lon, false);
    }
  }

  hideDropdown() {
    setTimeout(() => {
      this.showDropdown = false;
      this.onTouched();
    }, 200);
  }

  toggleMap() {
    if (!this.showMap) return;
    this.hasMapData = true;
    this.isMapExpanded = !this.isMapExpanded;
    
    if (this.isMapExpanded && !this.map) {
      // Try to get user location or default to Cairo
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => this.updateMap(pos.coords.latitude, pos.coords.longitude, false),
          () => this.updateMap(30.0444, 31.2357, false)
        );
      } else {
        this.updateMap(30.0444, 31.2357, false);
      }
    }
  }

  private onMapClick(e: L.LeafletMouseEvent) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    
    this.isLoading = true;
    this.updateMap(lat, lon, true);
    
    this.photonService.reverse(lat, lon).subscribe(results => {
      this.isLoading = false;
      if (results && results.length > 0) {
        const feature = results[0];
        const formatted = this.photonService.formatAddress(feature);
        this.searchControl.setValue(formatted, { emitEvent: false });
        this.onChange(formatted);
      }
    });
  }

  private updateMap(lat: number, lon: number, moveMarkerOnly = false) {
    this.hasMapData = true;
    
    // Allow DOM to render the map container before initializing
    setTimeout(() => {
      if (!this.mapElement) return;

      if (!this.map) {
        this.map = L.map(this.mapElement.nativeElement).setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add click listener for reverse geocoding
        this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
      } else if (!moveMarkerOnly) {
        this.map.setView([lat, lon], 15);
      }

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (this.marker) {
        this.marker.setLatLng([lat, lon]);
      } else {
        this.marker = L.marker([lat, lon], { icon }).addTo(this.map);
      }

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 350);
    });
  }
}
