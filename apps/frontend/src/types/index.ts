export interface User {
  id: string;
  email: string;
  business_name?: string;
  google_review_link?: string;
  facebook_review_link?: string;
  other_review_link?: string;
  sms_template?: string;
  sms_sent_this_month?: number;
  created_at?: string;
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
}

export interface Message {
  id: string;
  customer_id: string;
  user_id: string;
  body: string;
  sent_at: string;
}
