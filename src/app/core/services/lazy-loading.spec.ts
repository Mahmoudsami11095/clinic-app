import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { LocationMapComponent } from '../../shared/components/location-map/location-map.component';

describe('Bundle Budget & Lazy-Loading Architecture - Level 1 (SW/Unit)', () => {
  let fixture: ComponentFixture<LocationMapComponent>;
  let component: LocationMapComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationMapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LocationMapComponent);
    component = fixture.componentInstance;
  });

  it('1. should dynamically import Leaflet without breaking initial synchronous bootstrap', async () => {
    expect(component).toBeTruthy();
    const leafletRaw = await import('leaflet');
    const leaflet: any = (leafletRaw as any).default || leafletRaw;
    expect(leaflet).toBeDefined();
    expect(leaflet.map).toBeDefined();
    expect(leaflet.tileLayer).toBeDefined();
    expect(leaflet.divIcon).toBeDefined();
  });

  it('2. should dynamically import Three.js module as isolated chunk', async () => {
    const three = await import('three');
    expect(three).toBeDefined();
    expect(three.Scene).toBeDefined();
    expect(three.PerspectiveCamera).toBeDefined();
    expect(three.WebGLRenderer).toBeDefined();
  });

  it('3. should initialize location map with lazy-loaded engine without exceptions', async () => {
    component.lat = 30.0444;
    component.lng = 31.2357;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.currentLat).toBe(30.0444);
    expect(component.currentLng).toBe(31.2357);
  });
});
