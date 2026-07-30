export const RECOVERY_EVENT_ADMISSION_POLICY = Symbol('RECOVERY_EVENT_ADMISSION_POLICY');

export interface RecoveryEventAdmissionPolicy {
  isKillSwitchActive(workspaceId: string, sessionId: string): Promise<boolean>;
}

/**
 * Safe default until durable Kill Switch ownership is integrated into E19.
 * Recovery admission fails closed when a real policy reports active.
 */
export class InactiveRecoveryEventAdmissionPolicy implements RecoveryEventAdmissionPolicy {
  async isKillSwitchActive(): Promise<boolean> {
    return false;
  }
}
