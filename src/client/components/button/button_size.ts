export const buttonSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

export type ButtonSize = typeof buttonSize[keyof typeof buttonSize];
