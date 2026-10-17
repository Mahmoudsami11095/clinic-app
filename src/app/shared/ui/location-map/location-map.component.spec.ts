import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationMapComponent } from './location-map.component';
import { SimpleChange } from '@angular/core';

describe('LocationMapComponent', () => {
  let component: LocationMapComponent;
  let fixture: ComponentFixture<LocationMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationMapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LocationMapComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger useCurrentLocation when onSearchLocation is called with an empty query', () => {
    spyOn(component, 'useCurrentLocation');
    component.searchQuery = '   ';
    component.onSearchLocation();
    expect(component.useCurrentLocation).toHaveBeenCalled();
  });

  it('should clear query and call useCurrentLocation on clearSearch', () => {
    spyOn(component, 'useCurrentLocation');
    component.searchQuery = 'Dokki';
    component.clearSearch();
    expect(component.searchQuery).toBe('');
    expect(component.useCurrentLocation).toHaveBeenCalled();
  });

  it('should emit location on manual address change when coordinates are set', () => {
    spyOn(component.locationPicked, 'emit');
    component.currentLat = 30.0444;
    component.currentLng = 31.2357;
    component.currentCity = 'Cairo';

    const inputEvent = { target: { value: 'New Custom Address 123' } } as unknown as Event;
    component.onManualAddressChange(inputEvent);

    expect(component.manualAddress).toBe('New Custom Address 123');
    expect(component.locationPicked.emit).toHaveBeenCalledWith({
      address: 'New Custom Address 123',
      lat: 30.0444,
      lng: 31.2357,
      city: 'Cairo',
      state: undefined,
      country: undefined
    });
  });

  it('should update manualAddress and searchQuery on initialAddress change', () => {
    component.initialAddress = 'Initial Clinic Street';
    component.ngOnChanges({
      initialAddress: new SimpleChange(null, 'Initial Clinic Street', true)
    });

    expect(component.manualAddress).toBe('Initial Clinic Street');
    expect(component.searchQuery).toBe('Initial Clinic Street');
  });
});
