export const selectSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type SelectSize = typeof selectSize[keyof typeof selectSize];
