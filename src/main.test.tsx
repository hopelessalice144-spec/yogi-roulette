import { describe, expect, it, vi } from 'vitest';

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}));
vi.mock('./App.jsx', () => ({
  default: () => null,
}));
vi.mock('./index.css', () => ({}));
vi.mock('./lib/registerServiceWorker.js', () => ({
  registerPhysicsCacheWorker: vi.fn(),
}));
vi.mock('./lib/startVitalsTelemetry.js', () => ({
  startVitalsTelemetry: vi.fn(),
}));
vi.mock('@core/authorityGuard.js', () => ({
  runStartupAuthorityGuard: vi.fn(),
}));
vi.mock('./lib/frameBuster.js', () => ({
  enforceTopLevelFrame: vi.fn(),
}));

describe('main', () => {
  it('loads the client bootstrap entry', async () => {
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => ({})),
    });
    const mod = await import('./main.jsx');
    expect(mod).toBeDefined();
  });
});
