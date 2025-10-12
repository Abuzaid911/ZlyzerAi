// Analysis constants and configuration

export const PROGRESS_CONSTANTS = {
  MAX_FAKE_PROGRESS: 90,
  INCREMENT_MAX: 5,
  UPDATE_INTERVAL_MS: 800,
  COMPLETED_PROGRESS: 100,
  FAILED_PROGRESS: 0,
} as const;

export const MAX_HISTORY_ITEMS = 20;

export const COOLDOWN_MS = 2000;

export const STATUS_STYLES = {
  COMPLETED: 'bg-[#2ce695]/15 text-[#2ce695]',
  FAILED: 'bg-rose-500/15 text-rose-300',
  CACHED: 'bg-[#18CCFC]/15 text-[#18CCFC]',
  DEFAULT: 'bg-white/10 text-white/70',
} as const;

export const SKELETON_LOADING_ROWS = 6;

