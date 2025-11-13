# Billing UI Logic - How the UI Knows What to Show

## Simple Answer

**The UI checks if `stripe_subscription_id` exists:**

1. **Has `stripe_subscription_id`?** → Card payment → Show card details
2. **No `stripe_subscription_id` but `access_status = 'active'` and `payment_method = 'direct_debit'`?** → Invoice payment → Show "Your account is active and you're paying by invoice"
3. **Otherwise?** → No payment → Show subscription form

## Detailed Explanation

### What `access_status` Means

`access_status` in our database represents **our app's access status** (whether the user has access to the service), NOT Stripe's subscription status.

- `'active'` = User has access to the service (regardless of payment method)
- `'inactive'` = User does not have access
- `'past_due'` = User's payment is overdue
- `'canceled'` = User's subscription is canceled

### Card Payment Flow

1. User goes through Stripe Checkout
2. Stripe creates a subscription → `stripe_subscription_id` is populated
3. Webhook `customer.subscription.created` updates our DB:
   - `stripe_subscription_id = 'sub_...'` ← **Key: This exists**
   - `access_status = 'active'` (user has access)
   - `payment_method = 'card'`
4. **UI sees `stripe_subscription_id` exists** → Shows card details (last4, brand)

### Invoice Payment Flow

1. User requests invoice setup
2. We create Stripe customer (if needed) → `stripe_customer_id` is populated
3. Admin manually creates invoice in Stripe Dashboard
4. Customer pays invoice → Stripe sends `invoice.payment_succeeded` webhook
5. Webhook updates our DB:
   - `stripe_subscription_id = NULL` ← **Key: This does NOT exist**
   - `access_status = 'active'` (user has access because invoice was paid)
   - `payment_method = 'direct_debit'`
6. **UI sees no `stripe_subscription_id` but `access_status = 'active'` and `payment_method = 'direct_debit'`** → Shows "Your account is active and you're paying by invoice"

## UI Code Logic

```typescript
// Backend returns:
{
  accessStatus: 'active' | 'inactive' | 'past_due' | 'canceled',
  paymentMethod: 'card' | 'direct_debit' | null,
  cardLast4?: string,  // Only for card payments
  cardBrand?: string,  // Only for card payments
  nextBillingDate?: string
}

// Frontend UI logic:
if (accessStatus === 'active' && paymentMethod === 'card') {
  // Show card details (cardLast4, cardBrand)
  // Show "Update Card" and "Cancel Subscription" buttons
} else if (accessStatus === 'active' && paymentMethod === 'direct_debit') {
  // Show "Your account is active and you're paying by invoice"
  // No card details to show
} else {
  // Show subscription form to set up payment
}
```

## Backend Logic

The backend determines payment type by checking if `stripe_subscription_id` exists:

```typescript
// Get user from DB
const user = await supabase
  .from('users')
  .select('stripe_subscription_id, subscription_status, payment_method, current_period_end')
  .eq('id', userId)
  .single();

if (user.stripe_subscription_id) {
  // Card payment: Get card details from Stripe
  const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
  // ... get card details (last4, brand)
  return {
    accessStatus: user.access_status,
    paymentMethod: 'card',
    cardLast4: '...',
    cardBrand: '...',
  };
} else if (user.access_status === 'active' && user.payment_method === 'direct_debit') {
  // Invoice payment: No card details
  return {
    accessStatus: 'active',
    paymentMethod: 'direct_debit',
    // No cardLast4 or cardBrand
  };
} else {
  // No payment
  return {
    status: 'inactive',
    paymentMethod: null,
  };
}
```

## Summary

- **`stripe_subscription_id` exists?** → Card payment → Show card details
- **No `stripe_subscription_id` but active + direct_debit?** → Invoice payment → Show invoice message
- **Otherwise?** → No payment → Show subscription form
