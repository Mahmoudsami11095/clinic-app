# Clinic App Frontend — Gemini CLI Project Guidelines

## 1. Technical Stack & Conventions
- **Framework**: Angular 20 (Standalone Components only; no legacy NgModules for new code).
- **State & Reactivity**: Prefer Angular Signal primitives (`signal()`, `computed()`, `effect()`, `input()`, `output()`, `model()`).
- **Change Detection**: Enforce `ChangeDetectionStrategy.OnPush` across all UI components.
- **Styling**: TailwindCSS utility classes supplemented by PrimeNG UI component styling.
- **Form Handling**: Reactive Forms with strict type safety.
- **Offline & PWA**: Service Worker caching (`ngsw-config.json`) and IndexedDB optimistic sync.

## 2. Testing & Quality Standards
- **Unit Tests**: Jasmine/Karma unit tests for components, services, and pipes.
  - Run in CI/headless mode: `npm run test:ci`
- **E2E Tests**: Playwright automated browser tests.
  - Run headless: `npm run test:e2e`
- **Formatting**: Prettier (configured in `package.json`).

## 3. Mandatory Verification Checklist
Before completing any frontend feature or fix:
1. Run `npm run test:ci` to ensure all existing and new unit tests pass.
2. Run `npm run build` to guarantee zero compilation errors and within bundle budget constraints.
