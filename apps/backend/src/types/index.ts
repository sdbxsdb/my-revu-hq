export interface User {
  id: string;
  email: string;
  business_name?: string;
  review_links?: Array<{ name: string; url: string }>; // Array of review links
  sms_template?: string;
  sms_sent_this_month?: number;
  // Billing & Subscription fields
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  access_status?: 'active' | 'inactive' | 'past_due' | 'canceled'; // Our app's access status, not Stripe's
  payment_method?: 'card' | 'direct_debit';
  current_period_end?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: {
    countryCode: string;
    number: string;
  };
  job_description?: string;
  sms_status: 'sent' | 'pending';
  sent_at?: string;
}

export interface Message {
  id: string;
  customer_id: string;
  user_id: string;
  body: string;
  sent_at: string;
}
