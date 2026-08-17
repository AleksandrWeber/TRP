import type { AuthSessionRecord } from './auth-session';

export type AuthSessionView = {
  id: string;
  current: boolean;
  device: string;
  browser: string;
  network: string | null;
  lastActiveAt: string;
  signedInAt: string;
};

export function describeClient(userAgent: string | null | undefined): {
  device: string;
  browser: string;
} {
  if (!userAgent?.trim()) {
    return { device: 'Unknown device', browser: 'Unknown browser' };
  }

  const ua = userAgent;
  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? 'Phone or tablet' : 'Computer';

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome\//i.test(ua) || /Chromium\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\//i.test(ua)) {
    browser = 'Safari';
  }

  return { device, browser };
}

export function toAuthSessionView(
  record: AuthSessionRecord,
  currentSessionId: string,
  signedInAt: Date,
): AuthSessionView {
  const { device, browser } = describeClient(record.userAgent);
  return {
    id: record.id,
    current: record.id === currentSessionId,
    device,
    browser,
    network: record.ip,
    lastActiveAt: record.createdAt.toISOString(),
    signedInAt: signedInAt.toISOString(),
  };
}
