// Interfaces mais organizadas
/**
 * Interface para o produto do Stripe
 */
export interface StripeProduct {
  id: string;
  object: string;
  active: boolean;
  attributes: unknown[]; // Tipo mais seguro que any[]
  created: number;
  default_price: string;
  description: null | string;
  images: string[];
  livemode: boolean;
  marketing_features: unknown[]; // Tipo mais seguro que any[]
  metadata: Record<string, unknown>;
  name: string;
  package_dimensions: null | Record<string, unknown>;
  shippable: null | boolean;
  statement_descriptor: null | string;
  tax_code: null | string;
  type: string;
  unit_label: null | string;
  updated: number;
  url: null | string;
}

/**
 * Interface para o plano do Stripe
 */
export interface StripePlan {
  id: string;
  object: string;
  active: boolean;
  amount: number;
  amount_decimal: string;
  billing_scheme: string;
  created: number;
  currency: string;
  interval: string;
  interval_count: number;
  livemode: boolean;
  metadata: Record<string, unknown>;
  meter: null;
  nickname: null | string;
  product: string;
  tiers_mode: null | string;
  transform_usage: null;
  trial_period_days: null | number;
  usage_type: string;
}

// Interface para eventos do Stripe
export interface StripeEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}
