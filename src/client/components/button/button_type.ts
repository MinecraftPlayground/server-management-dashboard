export const buttonType = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
} as const;

export type ButtonType = typeof buttonType[keyof typeof buttonType];
