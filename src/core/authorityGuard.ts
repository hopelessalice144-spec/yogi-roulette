/**
 * Seed custody audit + production startup guard.
 * Demo builds may generate server seeds client-side; production requires VITE_API_BASE.
 */

export type SeedCustodyMode = 'authoritative' | 'demo-local';

export type SeedCustodyBadge = 'authoritative' | 'demo' | 'ci';

export interface SeedCustodyBadgeView {
  readonly badge: SeedCustodyBadge;
  readonly label: string;
  readonly title: string;
}

export interface AuthorityGuardEnv {
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly VITE_API_BASE?: string;
  readonly VITE_SEED_CUSTODY_BYPASS?: string;
  readonly VITE_ALLOW_DEMO_CUSTODY?: string;
}

export interface SeedCustodyAudit {
  readonly mode: SeedCustodyMode;
  readonly production: boolean;
  readonly authorityEnabled: boolean;
  readonly apiBase: string | null;
  readonly safe: boolean;
  readonly ciBypass: boolean;
  readonly custody: string;
  readonly warnings: readonly string[];
}

const INSECURE_PROD_MESSAGE =
  'Production build requires VITE_API_BASE — client-side server seeds are demo-only.';

const CI_E2E_BYPASS = 'ci-e2e';

function isCiE2eBypass(env: AuthorityGuardEnv): boolean {
  return env.VITE_SEED_CUSTODY_BYPASS === CI_E2E_BYPASS;
}

function isDemoCustodyAllowed(env: AuthorityGuardEnv): boolean {
  const flag = env.VITE_ALLOW_DEMO_CUSTODY;
  return flag === '1' || flag === 'true';
}

function apiBaseFromEnv(env: AuthorityGuardEnv): string | null {
  const base = env.VITE_API_BASE;
  if (typeof base !== 'string' || base.trim() === '') return null;
  return base.replace(/\/$/, '');
}

/** Classify seed custody from build-time env — pure, testable. */
export function auditSeedCustody(env: AuthorityGuardEnv = import.meta.env): Readonly<SeedCustodyAudit> {
  const production = env.PROD === true;
  const apiBase = apiBaseFromEnv(env);
  const authorityEnabled = apiBase != null;
  const mode: SeedCustodyMode = authorityEnabled ? 'authoritative' : 'demo-local';
  const ciBypass = isCiE2eBypass(env);
  const demoCustodyAllowed = isDemoCustodyAllowed(env);
  const warnings: string[] = [];

  if (!authorityEnabled) {
    if (production && demoCustodyAllowed) {
      warnings.push(
        'Demo custody explicitly allowed for this production build (VITE_ALLOW_DEMO_CUSTODY).'
      );
    } else if (production) {
      warnings.push(INSECURE_PROD_MESSAGE);
    } else {
      warnings.push(
        'Demo mode: server seeds generated client-side. Set VITE_API_BASE for authoritative custody.'
      );
    }
  }

  if (ciBypass && !authorityEnabled) {
    warnings.push('CI e2e bypass active — demo seed custody (not for production deploy).');
  }

  const safe = authorityEnabled || !production || ciBypass || demoCustodyAllowed;
  const custody = authorityEnabled
    ? `Server-held seeds via ${apiBase}`
    : production
      ? demoCustodyAllowed
        ? 'Client-side demo seeds (production demo build)'
        : 'BLOCKED — client-side seeds in production'
      : 'Client-side demo seeds (development only)';

  return Object.freeze({
    mode,
    production,
    authorityEnabled,
    apiBase,
    safe,
    ciBypass,
    custody,
    warnings: Object.freeze(warnings),
  });
}

/** HUD badge for seed custody — authoritative, demo, or CI e2e bypass. */
export function resolveSeedCustodyBadge(
  audit: Pick<SeedCustodyAudit, 'authorityEnabled' | 'ciBypass' | 'custody' | 'apiBase'>
): Readonly<SeedCustodyBadgeView> {
  if (audit.authorityEnabled) {
    return Object.freeze({
      badge: 'authoritative',
      label: 'Authority',
      title: audit.apiBase ? `Server-held seeds via ${audit.apiBase}` : audit.custody,
    });
  }
  if (audit.ciBypass) {
    return Object.freeze({
      badge: 'ci',
      label: 'CI',
      title: 'CI e2e bypass — demo seed custody (not for production deploy)',
    });
  }
  return Object.freeze({
    badge: 'demo',
    label: 'Demo',
    title: audit.custody,
  });
}

/** Throws when a production bundle would run demo-local seed custody. */
export function assertProductionSeedCustody(env: AuthorityGuardEnv = import.meta.env): void {
  const audit = auditSeedCustody(env);
  if (!audit.safe) {
    throw new Error(audit.warnings[0] ?? INSECURE_PROD_MESSAGE);
  }
}

/** Boot-time guard — blocks insecure production custody, warns in development. */
export function runStartupAuthorityGuard(env: AuthorityGuardEnv = import.meta.env): Readonly<SeedCustodyAudit> {
  const audit = auditSeedCustody(env);
  if (!audit.safe) {
    throw new Error(audit.warnings[0] ?? INSECURE_PROD_MESSAGE);
  }
  if (!audit.authorityEnabled) {
    console.warn(`[authority] ${audit.warnings[0]}`);
  }
  return audit;
}

console.assert(auditSeedCustody({ PROD: false }).safe, 'dev demo custody allowed');
console.assert(!auditSeedCustody({ PROD: true }).safe, 'prod without API blocked');
