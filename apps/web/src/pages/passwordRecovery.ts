export const FORGOT_PASSWORD_TITLE = 'Forgot password';

export const FORGOT_PASSWORD_DESCRIPTION =
  'Enter the email for your account. If recovery is available, we will send instructions.';

export const RECOVERY_UNAVAILABLE_COPY =
  'Password recovery is unavailable until the host configures mail.';

export const RECOVERY_ACCEPTED_COPY =
  'If an account exists for that email, recovery instructions will be sent.';

export const RESET_PASSWORD_TITLE = 'Choose a new password';

export const RESET_PASSWORD_DESCRIPTION =
  'Set a new password for your account. You will sign in with it next.';

export const INVALID_RECOVERY_COPY = 'This recovery link is invalid or has expired.';

export const CHANGE_PASSWORD_TITLE = 'Password';

export const CHANGE_PASSWORD_DESCRIPTION =
  'Change your password. Other devices will be signed out. You will stay signed in here.';

export const CHANGE_PASSWORD_PROMPT =
  'Change your password? Other sign-ins will end immediately. You will stay signed in here.';

export const CHANGE_PASSWORD_SUCCESS =
  'Your password has been changed. Other devices are signed out.';

export const CURRENT_PASSWORD_INCORRECT_COPY = 'Current password is incorrect.';

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
