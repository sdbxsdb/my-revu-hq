# Email Verification Template Setup

## Overview

This guide shows you how to customize the email verification (signup confirmation) email sent when users sign up with email and password.

## Setup Instructions

1. **Go to Supabase Dashboard:**
   - Navigate to https://supabase.com/dashboard
   - Select your project
   - Go to **Authentication** → **Email Templates**
   - Click on **Confirm signup** template

2. **Customize the Subject Line:**

```
Verify your MyRevuHQ account
```

3. **Customize the Email Body:**

Copy and paste the HTML template below:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden;">
          
          <!-- Header with Logo/Brand -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                MyRevuHQ
              </h1>
              <p style="margin: 8px 0 0; color: #d1fae5; font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;">
                Business Review Management
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px; color: #e5e7eb;">
              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Verify Your Email Address
              </h2>
              
              <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! Please verify your email address by clicking the button below:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 6px; color: #14b8a6; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 32px; color: #9ca3af;">
              <table role="presentation" style="width: 100%; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="padding: 0;">
                    <p style="margin: 0 0 8px; color: #fbbf24; font-size: 13px; font-weight: 600;">
                      ⚠️ Important
                    </p>
                    <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">
                      This link will expire in <strong style="color: #ffffff;">24 hours</strong>. If you didn't create an account with MyRevuHQ, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #141414; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Start managing your business reviews today with MyRevuHQ
              </p>
              <p style="margin: 0; color: #4b5563; font-size: 12px; line-height: 1.5;">
                © 2025 MyRevuHQ. All rights reserved.<br>
                <a href="https://www.myrevuhq.com/privacy" style="color: #14b8a6; text-decoration: none;">Privacy Policy</a> • 
                <a href="https://www.myrevuhq.com/terms" style="color: #14b8a6; text-decoration: none;">Terms of Service</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

4. **Click Save** to apply your changes

## Template Variables

The template uses the following Supabase variables:
- `{{ .ConfirmationURL }}` - The verification link URL
- `{{ .Email }}` - The user's email address (optional, not used in this template)
- `{{ .SiteURL }}` - Your application's site URL (optional, not used in this template)

## Design Features

The template includes:
- ✅ Dark theme matching MyRevuHQ branding
- ✅ Teal gradient header with brand name
- ✅ Clear call-to-action button
- ✅ Fallback link for email clients that don't support buttons
- ✅ Security notice about link expiration
- ✅ Professional footer with links
- ✅ Mobile-responsive design
- ✅ Proper email client compatibility

## Testing

After saving the template:

1. Sign up for a new account using email and password
2. Check your email inbox
3. Verify:
   - ✅ Email has the custom styling
   - ✅ Dark theme is displayed correctly
   - ✅ Verification button works
   - ✅ Fallback link is clickable
   - ✅ Email looks good on mobile and desktop

## Customization Options

You can customize:
- **Colors**: Change the gradient colors in the header and button
- **Logo**: Add an image logo instead of text (use `<img>` tag)
- **Footer**: Add social media links or additional information
- **Text**: Modify the copy to match your brand voice

## Notes

- The template uses inline CSS for maximum email client compatibility
- All colors use the MyRevuHQ dark theme palette
- The design is mobile-responsive using table-based layouts (best practice for emails)
- Links and buttons use teal (#14b8a6) to match the brand

