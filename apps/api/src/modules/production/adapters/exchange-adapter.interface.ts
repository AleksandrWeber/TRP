export type OrderSide = 'buy' | 'sell';

export type OrderRequest = {
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  mode: 'paper' | 'live';
};

export type OrderResult = {
  status: 'filled' | 'rejected';
  filledPrice: number;
  filledQuantity: number;
  fee: number;
  rejectReason?: string;
};

export interface ExchangeAdapter {
  submitOrder(order: OrderRequest): Promise<OrderResult>;
}
