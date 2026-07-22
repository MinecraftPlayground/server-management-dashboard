export const badgeType = {
  DEBUG: 'debug',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

export type BadgeType = typeof badgeType[keyof typeof badgeType];
