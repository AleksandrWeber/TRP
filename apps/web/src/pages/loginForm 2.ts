import { productPasswordPolicyMessage } from '../shared/passwordPolicy';

export type AuthMode = 'signin' | 'register';

export const GENERIC_SIGN_IN_ERROR = 'Invalid email or password.';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function toSignInFailureMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    message === 'Unauthorized' ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password')
  ) {
    return GENERIC_SIGN_IN_ERROR;
  }
  return message;
}

export function validateAuthForm(input: {
  mode: AuthMode;
  email: string;
  password: string;
  displayName: string;
}): string | null {
  if (!input.email.trim()) return 'Enter your email.';
  if (!isValidEmail(input.email)) return 'Enter a valid email address.';
  if (input.mode === 'register') {
    const passwordMessage = productPasswordPolicyMessage(input.password);
    if (passwordMessage) return passwordMessage;
    if (!input.displayName.trim()) return 'Enter your name.';
  } else if (input.password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}
