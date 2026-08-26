import type { PaperOrder } from './paper-order';

export type PaperOrderView = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  exchange: string;
  symbol: string;
  side: string;
  orderType: string;
  quantity: string;
  limitPrice: string | null;
  stopPrice: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}>;

export type PaperOrderListView = Readonly<{
  orders: readonly PaperOrderView[];
}>;

export function toPaperOrderView(order: PaperOrder): PaperOrderView {
  return Object.freeze({
    id: order.id,
    workspaceId: order.workspaceId,
    paperAccountId: order.paperAccountId,
    exchange: order.exchange,
    symbol: order.symbol,
    side: order.side,
    orderType: order.orderType,
    quantity: order.quantity,
    limitPrice: order.limitPrice,
    stopPrice: order.stopPrice,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
}

export function toPaperOrderListView(orders: readonly PaperOrder[]): PaperOrderListView {
  return Object.freeze({
    orders: Object.freeze(orders.map(toPaperOrderView)),
  });
}
