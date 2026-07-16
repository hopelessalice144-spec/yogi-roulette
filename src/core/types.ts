/** Shared core engine types — Phase 6 TypeScript migration. */

export type PhaseName = 'betting' | 'locked' | 'spinning';

export type HudPhase = 'betting' | 'locked' | 'spin-focus' | 'settle-reveal';

export interface GameClock {
  nowMs: number;
  name: PhaseName;
  cycleSecond: number;
  cycleId: number;
  secondsRemaining: number;
  cycleSeconds: number;
  acceptsBets: boolean;
  betsLocked: boolean;
  isSpinning: boolean;
  ballDropped: boolean;
  settling: boolean;
}

export interface FairContext {
  serverSeed: string;
  clientSeed: string;
}

export type FairRoundSource = 'remote';

export interface FairRound {
  cycleId: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  revealed: boolean;
  source?: FairRoundSource;
  remotePending?: boolean;
}

export interface PublicRoundCommit {
  cycleId: number;
  serverSeedHash: string;
  clientSeed: string;
}

export interface RemoteCommitInput {
  serverSeedHash: string;
  clientSeed: string;
}

export interface RemoteRevealInput {
  serverSeed: string;
  winningNumber?: number;
  serverSeedHash?: string;
  clientSeed?: string;
}

export interface RemoteCommitRegistration {
  cycleId: number;
  serverSeedHash: string;
  clientSeed: string;
}

export type SyncMode = 'wall-clock' | 'authoritative-stream' | 'authoritative-api';

export type RtEvent = 'cycle.tick' | 'round.commit' | 'round.reveal';

export interface CycleTick {
  type: RtEvent | string;
  nowMs: number;
  cycleId: number;
  cycleSecond: number;
  name: PhaseName;
  secondsRemaining: number;
}

export interface CycleTickInput {
  type?: string;
  nowMs?: number;
  cycleId?: unknown;
  cycleSecond?: unknown;
  name?: string;
  secondsRemaining?: unknown;
}

export interface RemoteCommitResponse {
  serverSeedHash: string;
  clientSeed?: string;
}

export interface RemoteResultResponse {
  winningNumber: number;
  cycleId?: number;
}

export interface RemoteOutcomeResponse {
  serverSeed: string;
  winningNumber: number;
  serverSeedHash?: string;
  clientSeed?: string;
}

export interface RealtimeHubHandle {
  mode: SyncMode;
  close: () => void;
}

export interface RealtimeHubOptions {
  onTick: (tick: CycleTick) => void;
  onModeChange?: (mode: SyncMode) => void;
}

export interface FairnessAudit {
  algorithm: string;
  serverSeedHash: string;
  clientSeed: string;
  cycleId: number;
  winningNumber: number;
  verified: boolean;
  revealServerSeed: string;
}

export type PhysicsLoadState = 'idle' | 'prefetching' | 'ready' | 'error';

export interface BetMutex {
  tryAcquire(): boolean;
  release(): void;
  readonly isLocked: boolean;
}

export interface FeedbackPrefs {
  audioMuted: boolean;
  hapticsMuted: boolean;
}

export type QualityTierName = 'high' | 'medium' | 'low';

export type GodRaysMode = 'volumetric' | 'gradient' | 'off';

export interface QualitySettings {
  postFx: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  chromaticAberration: boolean;
  shadows: boolean;
  shadowMapSize: number;
  starCount: number;
  contactShadows: boolean;
  envBlur: number;
  dprMax: number;
  ivorySSS: boolean;
  rimStreaks: boolean;
  quantumArc: boolean;
  godRays: GodRaysMode;
  loungeDust: boolean;
  ballVapor: boolean;
  ghostChipsFull: boolean;
}

export interface DeviceProfile {
  mobile: boolean;
  lowTier: boolean;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory: number;
}

export interface PerformanceGuardTickResult {
  tier: QualityTierName;
  fps: number;
  avgFrameMs: number;
  settings: QualitySettings;
  godStep: number;
}

export interface PerformanceGuardHandle {
  tick(frameMs: number): PerformanceGuardTickResult;
  getSettings(): QualitySettings;
  readonly deviceProfile: DeviceProfile;
  readonly tier: QualityTierName;
  readonly godStep: number;
  readonly fps: number;
}
