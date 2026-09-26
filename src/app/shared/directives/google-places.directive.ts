import { 
  Directive, 
  ElementRef, 
  OnInit, 
  Output, 
  EventEmitter, 
  inject, 
  NgZone, 
  OnDestroy,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[appGooglePlaces]',
  standalone: true
})
export class GooglePlacesDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLInputElement>);
  private ngZone = inject(NgZone);
  private renderer = inject(Renderer2);

  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  private dropdown: HTMLDivElement | null = null;
  private inputSubscription: any = null;
  private debounceTimer: any = null;
  private clickListener: (() => void) | null = null;

  ngOnInit() {
    this.setupAutocomplete();
  }

  private setupAutocomplete() {
    const input = this.el.nativeElement;

    this.renderer.listen(input, 'input', (e: Event) => {
      const val = (e.target as HTMLInputElement).value?.trim();
      clearTimeout(this.debounceTimer);
      if (!val || val.length < 3) {
        this.hideDropdown();
        return;
      }
      this.debounceTimer = setTimeout(() => {
        this.fetchSuggestions(val);
      }, 350);
    });

    this.renderer.listen(input, 'focus', () => {
      const val = input.value?.trim();
      if (val && val.length >= 3) {
        this.fetchSuggestions(val);
      }
    });

    this.renderer.listen(input, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hideDropdown();
      }
    });

    this.clickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (!this.el.nativeElement.contains(event.target as Node) && 
          (!this.dropdown || !this.dropdown.contains(event.target as Node))) {
        this.hideDropdown();
      }
    });
  }

  private async fetchSuggestions(query: string) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const results = await res.json();
        this.ngZone.run(() => {
          this.renderDropdown(results);
        });
      }
    } catch (err) {
      console.warn('Autocomplete fetch failed:', err);
    }
  }

  private renderDropdown(items: any[]) {
    if (!items || items.length === 0) {
      this.hideDropdown();
      return;
    }

    if (!this.dropdown) {
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden text-xs max-h-60 overflow-y-auto animate-in fade-in duration-150';
      const parent = this.el.nativeElement.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.appendChild(this.dropdown);
      }
    }

    this.dropdown.innerHTML = '';
    for (const item of items) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'w-full text-start px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-slate-700/60 border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors flex items-start gap-2 text-slate-700 dark:text-slate-200 cursor-pointer';
      option.innerHTML = `
        <i class="pi pi-map-marker text-indigo-500 mt-0.5 text-xs shrink-0"></i>
        <span class="truncate leading-relaxed font-medium">${item.display_name}</span>
      `;

      option.addEventListener('click', () => {
        this.selectItem(item);
      });

      this.dropdown.appendChild(option);
    }
  }

  private selectItem(item: any) {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const addr = item.address || {};
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
    const state = addr.state || addr.governorate || '';
    const country = addr.country || '';

    this.el.nativeElement.value = item.display_name;
    this.el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));

    const placeResult = {
      formatted_address: item.display_name,
      name: item.name || item.display_name,
      lat,
      lng: lon,
      address_components: [
        { long_name: city, types: ['locality'] },
        { long_name: state, types: ['administrative_area_level_1'] },
        { long_name: country, types: ['country'] }
      ],
      geometry: {
        location: {
          lat: () => lat,
          lng: () => lon
        }
      }
    };

    this.onSelect.emit(placeResult);
    this.hideDropdown();
  }

  private hideDropdown() {
    if (this.dropdown) {
      this.dropdown.remove();
      this.dropdown = null;
    }
  }

  ngOnDestroy() {
    clearTimeout(this.debounceTimer);
    if (this.clickListener) {
      this.clickListener();
    }
    this.hideDropdown();
  }
}
