export interface StripeSubscription {
  id: string;
  object: string;
  application: string | null;
  application_fee_percent: number | null;
  automatic_tax: {
    enabled: boolean;
    disabled_reason: string | null;
    liability: string | null;
  };
  billing_cycle_anchor: number;
  billing_cycle_anchor_config: any | null;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  cancellation_details: {
    comment: string | null;
    feedback: string | null;
    reason: string | null;
  };
  collection_method: string;
  created: number;
  currency: string;
  customer: string;
  days_until_due: number | null;
  default_payment_method: string | null;
  default_source: string | null;
  default_tax_rates: any[];
  description: string | null;
  discounts: any[];
  ended_at: number | null;
  items: {
    object: string;
    data: Array<{
      id: string;
      object: string;
      created: number;
      current_period_end: number;
      current_period_start: number;
      plan: {
        id: string;
        object: string;
        active: boolean;
        amount: number;
        amount_decimal: string;
        currency: string;
        interval: string;
        interval_count: number;
        product: string;
      };
      price: {
        id: string;
        object: string;
        active: boolean;
        currency: string;
        product: string;
        unit_amount: number;
        unit_amount_decimal: string;
      };
      quantity: number;
      subscription: string;
    }>;
    has_more: boolean;
    total_count: number;
    url: string;
  };
  latest_invoice: string;
  livemode: boolean;
  metadata: Record<string, any>;
  plan: {
    id: string;
    object: string;
    active: boolean;
    amount: number;
    amount_decimal: string;
    currency: string;
    interval: string;
    interval_count: number;
    product: string;
  };
  quantity: number;
  start_date: number;
  status: string;
  trial_end: number | null;
  trial_start: number | null;
}
