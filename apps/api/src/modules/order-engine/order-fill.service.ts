import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createOrderFill, type OrderFill } from './domain/order-fill';
import { ORDER_REPOSITORY, type OrderRepository } from './order.repository';

export type GenerateFillInput = Readonly<{
  orderId: string;
  timestamp: string;
  quantity: string;
  price: string;
  fee?: string;
}>;

/**
 * OrderFillService — generates and persists immutable fills (US206).
 */
@Injectable()
export class OrderFillService {
  constructor(@Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository) {}

  async generate(input: GenerateFillInput): Promise<OrderFill> {
    const fill = createOrderFill({
      id: randomUUID(),
      orderId: input.orderId,
      timestamp: input.timestamp,
      quantity: input.quantity,
      price: input.price,
      fee: input.fee ?? '0',
    });
    return this.repository.createFill(fill);
  }

  async listByOrderId(orderId: string): Promise<OrderFill[]> {
    return this.repository.listFillsByOrderId(orderId);
  }
}
