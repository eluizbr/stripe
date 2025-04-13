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

// Tipos simplificados para a fatura Strip// Tipos completos para a fatura Stripe

export interface AutomaticTax {
  disabled_reason: string | null;
  enabled: boolean;
  liability: any | null;
  status: string | null;
}

export interface CustomerAddress {
  city: string;
  country: string;
  line1: string;
  line2: string;
  postal_code: string;
  state: string;
}

export interface Issuer {
  type: string;
}

export interface Period {
  end: number;
  start: number;
}

export interface PriceDetails {
  price: string;
  product: string;
}

export interface Pricing {
  price_details: PriceDetails;
  type: string;
  unit_amount_decimal: string;
}

export interface SubscriptionItemDetails {
  invoice_item: any | null;
  proration: boolean;
  proration_details: {
    credited_items: any | null;
  };
  subscription: string;
  subscription_item: string;
}

export interface LineItemParent {
  invoice_item_details: any | null;
  subscription_item_details: SubscriptionItemDetails;
  type: string;
}

export interface LineItem {
  id: string;
  object: string;
  amount: number;
  currency: string;
  description: string;
  discount_amounts: any[];
  discountable: boolean;
  discounts: any[];
  invoice: string;
  livemode: boolean;
  metadata: Record<string, any>;
  parent: LineItemParent;
  period: Period;
  pretax_credit_amounts: any[];
  pricing: Pricing;
  quantity: number;
  taxes: any[];
}

export interface Lines {
  object: string;
  data: LineItem[];
  has_more: boolean;
  total_count: number;
  url: string;
}

export interface PaymentMethodOptions {
  acss_debit: any | null;
  bancontact: any | null;
  card: {
    request_three_d_secure: string;
  };
  customer_balance: any | null;
  konbini: any | null;
  sepa_debit: any | null;
  us_bank_account: any | null;
}

export interface PaymentSettings {
  default_mandate: any | null;
  payment_method_options: PaymentMethodOptions;
  payment_method_types: any | null;
}

export interface SubscriptionDetails {
  metadata: Record<string, any>;
  subscription: string;
}

export interface Parent {
  quote_details: any | null;
  subscription_details: SubscriptionDetails;
  type: string;
}

export interface StatusTransitions {
  finalized_at: number;
  marked_uncollectible_at: any | null;
  paid_at: number;
  voided_at: any | null;
}

export interface StripeInvoice {
  id: string;
  object: string;
  account_country: string;
  account_name: string;
  account_tax_ids: any | null;
  amount_due: number;
  amount_overpaid: number;
  amount_paid: number;
  amount_remaining: number;
  amount_shipping: number;
  application: any | null;
  attempt_count: number;
  attempted: boolean;
  auto_advance: boolean;
  automatic_tax: AutomaticTax;
  automatically_finalizes_at: any | null;
  billing_reason: string;
  collection_method: string;
  created: number;
  currency: string;
  custom_fields: any | null;
  customer: string;
  customer_address: CustomerAddress;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  customer_shipping: any | null;
  customer_tax_exempt: string;
  customer_tax_ids: any[];
  default_payment_method: any | null;
  default_source: any | null;
  default_tax_rates: any[];
  description: any | null;
  discounts: any[];
  due_date: any | null;
  effective_at: number;
  ending_balance: number;
  footer: any | null;
  from_invoice: any | null;
  hosted_invoice_url: string;
  invoice_pdf: string;
  issuer: Issuer;
  last_finalization_error: any | null;
  latest_revision: any | null;
  lines: Lines;
  livemode: boolean;
  metadata: Record<string, any>;
  next_payment_attempt: any | null;
  number: string;
  on_behalf_of: any | null;
  parent: Parent;
  payment_settings: PaymentSettings;
  period_end: number;
  period_start: number;
  post_payment_credit_notes_amount: number;
  pre_payment_credit_notes_amount: number;
  receipt_number: any | null;
  rendering: any | null;
  shipping_cost: any | null;
  shipping_details: any | null;
  starting_balance: number;
  statement_descriptor: any | null;
  status: string;
  status_transitions: StatusTransitions;
  subtotal: number;
  subtotal_excluding_tax: number;
  test_clock: any | null;
  total: number;
  total_discount_amounts: any[];
  total_excluding_tax: number;
  total_pretax_credit_amounts: any[];
  total_taxes: any[];
  webhooks_delivered_at: any | null;
}

export interface InvoiceSettings {
  custom_fields: any | null;
  default_payment_method: string | null;
  footer: string | null;
  rendering_options: any | null;
}

export interface StripeCustomer {
  user_id: any;
  id: string;
  object: string;
  address: CustomerAddress | null;
  balance: number;
  created: number;
  currency: string;
  default_source: string | null;
  delinquent: boolean;
  description: string | null;
  discount: any | null;
  email: string | null;
  invoice_prefix: string;
  invoice_settings: InvoiceSettings;
  livemode: boolean;
  metadata: Record<string, any>;
  name: string | null;
  next_invoice_sequence: number;
  phone: string | null;
  preferred_locales: string[];
  shipping: any | null;
  tax_exempt: string;
  test_clock: any | null;
}

export interface StripeCustomer {
  id: string;
  object: string;
  address: CustomerAddress | null;
  balance: number;
  created: number;
  currency: string;
  default_source: string | null;
  delinquent: boolean;
  description: string | null;
  discount: any | null;
  email: string | null;
  invoice_prefix: string;
  invoice_settings: InvoiceSettings;
  livemode: boolean;
  metadata: Record<string, any>;
  name: string | null;
  next_invoice_sequence: number;
  phone: string | null;
  preferred_locales: string[];
  shipping: any | null;
  tax_exempt: string;
  test_clock: any | null;
}

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
