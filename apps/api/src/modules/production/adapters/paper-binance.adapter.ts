import { Injectable } from '@nestjs/common';
import type { ExchangeAdapter, OrderRequest, OrderResult } from './exchange-adapter.interface';

const PAPER_FEE_RATE = 0.001;

@Injectable()
export class PaperBinanceAdapter implements ExchangeAdapter {
  async submitOrder(order: OrderRequest): Promise<OrderResult> {
    if (order.mode !== 'paper') {
      return {
        status: 'rejected',
        filledPrice: order.price,
        filledQuantity: 0,
        fee: 0,
        rejectReason: 'Live trading is not enabled in Stage 1',
      };
    }

    if (order.quantity <= 0) {
      return {
        status: 'rejected',
        filledPrice: order.price,
        filledQuantity: 0,
        fee: 0,
        rejectReason: 'Invalid quantity',
      };
    }

    const notional = order.quantity * order.price;
    const fee = notional * PAPER_FEE_RATE;

    return {
      status: 'filled',
      filledPrice: order.price,
      filledQuantity: order.quantity,
      fee,
    };
  }
}
