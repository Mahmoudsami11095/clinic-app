# Medical Clinic Management Web Application Architecture Plan

This document outlines the architectural plan, folder structure, and mock API strategy for the frontend-only Medical Clinic Management application.

## User Review Required

> [!IMPORTANT]
> Please review this implementation plan and the proposed folder structure carefully. I will not proceed with generating any component or service code until you provide your explicit approval.

## Proposed Architecture

- **Framework**: Angular (v20.3.1), exclusively utilizing Standalone Components (no NgModules).
- **State Management**: Angular Signals for highly reactive, localized state management and data flow.
- **Styling**: SCSS coupled with Tailwind CSS, using PrimeNG as the primary UI component library.
- **Structure**: Domain-driven, feature-based hierarchy grouping modules logically by business domains (e.g., `patients`, `appointments`, `doctors`).
- **Mocking**: A simulated backend utilizing Angular's `HttpInterceptor` mapped to local JSON stubs in `/public/assets/mock-data/`.

## Proposed Folder Structure

The application will adhere to a strict feature-based approach, separating domains:

```text
src/
├── app/
│   ├── core/                        # Singleton services, interceptors, auth guards
│   │   ├── auth/                    # Authentication guards and core state
│   │   ├── interceptors/            
│   │   │   └── mock-backend.interceptor.ts
│   │   └── layout/                  # Main app shell (Sidebar, Header)
│   ├── shared/                      # Reusable, "dumb" components, pipes, standard directives
│   │   ├── components/              # Shared UI like Table structures, Cards, Modals
│   │   └── ui/                      # Specific PrimeNG/Tailwind wrapper components
│   ├── features/                    # Domain-specific logic and UI feature boundaries
│   │   ├── dashboard/               # Generic clinic overview and widgets
│   │   ├── patients/               
│   │   │   ├── components/          # Smart/Dumb UI specific to Patients
│   │   │   ├── services/            
│   │   │   │   ├── patient.service.ts # HTTP fetching functions
│   │   │   │   └── patient.store.ts   # Signal-based store/state provider
│   │   │   └── patient.routes.ts    # Lazy loaded standalone routes
│   │   ├── appointments/            
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── appointment.routes.ts
│   │   ├── doctors/                 # Doctor roster & availability
│   │   ├── billing/                 # Financial metrics and invoices
│   │   └── auth/                    # Login / Registration screens
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts                # Main route registry
└── public/
    └── assets/
        └── mock-data/               # JSON backend structure definitions
            ├── patients.json
            ├── appointments.json
            ├── doctors.json
            └── billing.json
```

## Mock API Strategy

To easily swap between local JSON stubs and a real API later, without touching the application's domain services, we will use an **HTTP Interceptor**:

1. **Data Definition**: Complete sets of records are stored in `public/assets/mock-data/{entity}.json`.
2. **Interception**: A `mockBackendInterceptor` will be registered in `app.config.ts`. When a service attempts to call `GET /api/patients`, the interceptor will catch it, map the URL to `/assets/mock-data/patients.json`, execute the request locally, and simulate network delay (using RxJS `delay`). 
3. **Writing/Editing**: The interceptor will simulate `POST`, `PUT`, and `DELETE` requests by returning mocked success responses (and logging them into the console to emulate persistence), keeping the UI functioning interactively.
4. **Transition**: When the real backend APIs become available, we simply detach the interceptor from the application config. The underlying services (which make calls to `/api/...`) require absolutely zero modifications.

## Open Questions

> [!WARNING]  
> Are there any specific PrimeNG themes (e.g. Aura, Lara, Saga, Material) or color palettes you would prefer for the application's aesthetic?

## Verification Plan

### Mock Backend and Structure
- Implement the baseline file structure.
- Define `patients.json` and a generic `mockBackendInterceptor`.
- Create a test route that verifies HTTP requests accurately fetch the JSON data and propagate into Angular Signals.
- Present the initial application state using PrimeNG components.
