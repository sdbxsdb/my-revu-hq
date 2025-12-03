import { Resend } from 'resend';

// Initialize Resend client (will be null if API key not set)
let resend: Resend | null = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (error) {
  console.error('[Email] Failed to initialize Resend:', error);
}

export interface EnterpriseRequestDetails {
  userEmail: string;
  userId: string;
  businessName: string | null;
  stripeCustomerId: string | null;
  accountCreatedAt?: string;
  currentTier?: string | null;
}

/**
 * Send email notification when a user requests Enterprise plan
 */
export async function sendEnterpriseRequestEmail(details: EnterpriseRequestDetails): Promise<void> {
  // Don't fail if Resend is not configured
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping email notification');
    console.warn('[Email] Set RESEND_API_KEY in Vercel environment variables');
    console.log('[Email] Enterprise request details:', JSON.stringify(details, null, 2));
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'myrevuhq@gmail.com';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'MyRevuHQ <onboarding@resend.dev>';

  console.log(`[Email] Attempting to send enterprise request email`);
  console.log(`[Email] From: ${fromEmail}, To: ${adminEmail}`);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🚀 New Enterprise Plan Request - ${details.businessName || details.userEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #14b8a6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .detail-row { margin: 12px 0; padding: 8px; background-color: white; border-radius: 4px; }
            .label { font-weight: 600; color: #6b7280; }
            .value { color: #111827; margin-top: 4px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #14b8a6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚀 New Enterprise Plan Request</h1>
            </div>
            <div class="content">
              <p>A user has requested the Enterprise plan. Here are their details:</p>
              
              <div class="detail-row">
                <div class="label">User Email</div>
                <div class="value">${details.userEmail}</div>
              </div>
              
              ${
                details.businessName
                  ? `
              <div class="detail-row">
                <div class="label">Business Name</div>
                <div class="value">${details.businessName}</div>
              </div>
              `
                  : ''
              }
              
              <div class="detail-row">
                <div class="label">User ID</div>
                <div class="value">${details.userId}</div>
              </div>
              
              ${
                details.stripeCustomerId
                  ? `
              <div class="detail-row">
                <div class="label">Stripe Customer ID</div>
                <div class="value">${details.stripeCustomerId}</div>
              </div>
              `
                  : ''
              }
              
              ${
                details.currentTier
                  ? `
              <div class="detail-row">
                <div class="label">Current Plan</div>
                <div class="value">${details.currentTier}</div>
              </div>
              `
                  : ''
              }
              
              ${
                details.accountCreatedAt
                  ? `
              <div class="detail-row">
                <div class="label">Account Created</div>
                <div class="value">${new Date(details.accountCreatedAt).toLocaleString()}</div>
              </div>
              `
                  : ''
              }
              
              <div class="detail-row">
                <div class="label">Requested At</div>
                <div class="value">${new Date().toLocaleString()}</div>
              </div>
              
              ${
                details.stripeCustomerId
                  ? `
              <a href="https://dashboard.stripe.com/customers/${details.stripeCustomerId}" class="button" target="_blank">
                View in Stripe Dashboard
              </a>
              `
                  : ''
              }
              
              <div class="footer">
                <p>This is an automated notification from MyRevuHQ.</p>
                <p>Please follow up with the user within 1-2 business days to discuss their Enterprise plan needs.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Enterprise request notification sent to ${adminEmail}`);
    console.log(`[Email] From: ${fromEmail}, To: ${adminEmail}`);
  } catch (error: any) {
    // Log error but don't fail the request
    console.error('[Email] Failed to send enterprise request notification:', error);
    console.error('[Email] Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      response: error.response,
    });
    // Log details so admin can still see the request
    console.log(
      '[Email] Enterprise request details (email failed):',
      JSON.stringify(details, null, 2)
    );
  }
}
