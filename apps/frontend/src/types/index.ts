export interface User {
  id: string;
  email: string;
  business_name?: string;
  review_links?: Array<{ name: string; url: string }>; // Array of review links
  sms_template?: string;
  sms_sent_this_month?: number;
  sms_sent_total?: number;
  // Billing & Subscription fields
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  payment_status?: 'active' | 'inactive' | 'past_due' | 'canceled'; // Payment/subscription status
  payment_method?: 'card' | 'direct_debit';
  current_period_end?: string;
  account_lifecycle_status?: 'active' | 'cancelled' | 'deleted'; // Account lifecycle status
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: {
    countryCode: string; // Country calling code (e.g., "44", "353", "1")
    country?: string; // ISO country code (e.g., "GB", "IE", "US", "CA") - optional, auto-detected from number
    number: string; // Local format number (e.g., "07911123456")
  };
  job_description?: string;
  sms_status: 'sent' | 'pending';
  sent_at?: string;
  sms_request_count?: number;
  opt_out?: boolean;
}

export interface Message {
  id: string;
  customer_id: string;
  user_id: string;
  body: string;
  sent_at: string;
}
