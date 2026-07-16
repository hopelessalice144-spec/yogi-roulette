/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_TELEMETRY_URL?: string;
  readonly VITE_SEED_CUSTODY_BYPASS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
