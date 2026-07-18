export const CASH_RESERVATION_PORT = Symbol('CASH_RESERVATION_PORT');

export enum CashReservationStatus {
  ACTIVE = 'active',
  RELEASED = 'released',
}

export type CashReservation = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  orderId: string;
  idempotencyKey: string;
  releaseIdempotencyKey: string | null;
  currency: string;
  amount: string;
  status: CashReservationStatus;
  createdAt: string;
  releasedAt: string | null;
}>;

export type ReserveCashCommand = Readonly<{
  workspaceId: string;
  paperAccountId: string;
  orderId: string;
  idempotencyKey: string;
  currency: string;
  amount: string;
  actorId: string;
  correlationId?: string;
  recordedAt: string;
}>;

export type ReleaseCashCommand = Readonly<{
  workspaceId: string;
  orderId: string;
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  recordedAt: string;
}>;

/**
 * The only public write boundary for cash reservations (US162 / ADR-015).
 * Orders never writes Ledger persistence and Portfolio remains read-only.
 */
export interface CashReservationPort {
  reserveCash(command: ReserveCashCommand): Promise<CashReservation>;

  /**
   * Idempotent no-op when no reservation exists for the workspace/order.
   */
  releaseCash(command: ReleaseCashCommand): Promise<CashReservation | null>;

  findByOrder(workspaceId: string, orderId: string): Promise<CashReservation | null>;
}
