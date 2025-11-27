# Complete Email Templates for MyRevuHQ

This file contains all custom email templates for Supabase authentication emails, styled to match the MyRevuHQ dark theme.

## Quick Setup Guide

1. Go to Supabase Dashboard → Authentication → Email Templates
2. For each template below, copy the HTML and paste it into the corresponding template in Supabase
3. Update the subject lines as specified
4. Click Save for each template

---

## 1. Confirm Signup (Email Verification)

**Subject:** `Verify your MyRevuHQ account`

**Template:**

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
          
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">MyRevuHQ</h1>
              <p style="margin: 8px 0 0; color: #d1fae5; font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;">Business Review Management</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 32px; color: #e5e7eb;">
              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">Verify Your Email Address</h2>
              <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">Thanks for signing up! Please verify your email address by clicking the button below:</p>
              <table role="presentation" style="margin: 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);">Verify Email Address</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">Or copy and paste this link:</p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 6px; color: #14b8a6; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">{{ .ConfirmationURL }}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" style="width: 100%; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #fbbf24; font-size: 13px; font-weight: 600;">⚠️ Important</p>
                    <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">This link expires in <strong style="color: #ffffff;">24 hours</strong>. If you didn't create an account, ignore this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background-color: #141414; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">Start managing your business reviews today</p>
              <p style="margin: 0; color: #4b5563; font-size: 12px;">© 2025 MyRevuHQ. All rights reserved.<br><a href="https://www.myrevuhq.com/privacy" style="color: #14b8a6; text-decoration: none;">Privacy</a> • <a href="https://www.myrevuhq.com/terms" style="color: #14b8a6; text-decoration: none;">Terms</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link

**Subject:** `Sign in to MyRevuHQ`

**Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden;">
          
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">MyRevuHQ</h1>
              <p style="margin: 8px 0 0; color: #d1fae5; font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;">Business Review Management</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 32px; color: #e5e7eb;">
              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">Sign In to Your Account</h2>
              <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">Click the button below to securely sign in to MyRevuHQ:</p>
              <table role="presentation" style="margin: 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);">Sign In to MyRevuHQ</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">Or copy and paste this link:</p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 6px; color: #14b8a6; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">{{ .ConfirmationURL }}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" style="width: 100%; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #fbbf24; font-size: 13px; font-weight: 600;">⚠️ Security Notice</p>
                    <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">This link expires in <strong style="color: #ffffff;">1 hour</strong>. If you didn't request this, ignore this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background-color: #141414; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">Grow your business with better reviews</p>
              <p style="margin: 0; color: #4b5563; font-size: 12px;">© 2025 MyRevuHQ. All rights reserved.<br><a href="https://www.myrevuhq.com/privacy" style="color: #14b8a6; text-decoration: none;">Privacy</a> • <a href="https://www.myrevuhq.com/terms" style="color: #14b8a6; text-decoration: none;">Terms</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Reset Password (Recovery)

**Subject:** `Reset your MyRevuHQ password`

**Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden;">
          
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">MyRevuHQ</h1>
              <p style="margin: 8px 0 0; color: #d1fae5; font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;">Business Review Management</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 32px; color: #e5e7eb;">
              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">Reset Your Password</h2>
              <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password:</p>
              <table role="presentation" style="margin: 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">Or copy and paste this link:</p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 6px; color: #14b8a6; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">{{ .ConfirmationURL }}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" style="width: 100%; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #fbbf24; font-size: 13px; font-weight: 600;">⚠️ Security Notice</p>
                    <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">This link expires in <strong style="color: #ffffff;">1 hour</strong>. If you didn't request a password reset, please contact us immediately at <a href="mailto:myrevuhq@gmail.com" style="color: #14b8a6; text-decoration: none;">myrevuhq@gmail.com</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background-color: #141414; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">Your account security is our priority</p>
              <p style="margin: 0; color: #4b5563; font-size: 12px;">© 2025 MyRevuHQ. All rights reserved.<br><a href="https://www.myrevuhq.com/privacy" style="color: #14b8a6; text-decoration: none;">Privacy</a> • <a href="https://www.myrevuhq.com/terms" style="color: #14b8a6; text-decoration: none;">Terms</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address

**Subject:** `Confirm your new email address`

**Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden;">
          
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">MyRevuHQ</h1>
              <p style="margin: 8px 0 0; color: #d1fae5; font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;">Business Review Management</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 40px 32px; color: #e5e7eb;">
              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">Confirm Email Address Change</h2>
              <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px; line-height: 1.6;">You've requested to change your account email address. Click the button below to confirm this change:</p>
              <table role="presentation" style="margin: 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);">Confirm Email Change</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">Or copy and paste this link:</p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 6px; color: #14b8a6; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">{{ .ConfirmationURL }}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" style="width: 100%; background-color: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px; padding: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; color: #fbbf24; font-size: 13px; font-weight: 600;">⚠️ Important</p>
                    <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">This link expires in <strong style="color: #ffffff;">24 hours</strong>. If you didn't request this change, contact us at <a href="mailto:myrevuhq@gmail.com" style="color: #14b8a6; text-decoration: none;">myrevuhq@gmail.com</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background-color: #141414; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">Keeping your account secure</p>
              <p style="margin: 0; color: #4b5563; font-size: 12px;">© 2025 MyRevuHQ. All rights reserved.<br><a href="https://www.myrevuhq.com/privacy" style="color: #14b8a6; text-decoration: none;">Privacy</a> • <a href="https://www.myrevuhq.com/terms" style="color: #14b8a6; text-decoration: none;">Terms</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Design Features

All templates include:
- ✅ Dark theme (#0a0a0a, #1a1a1a, #2a2a2a)
- ✅ Teal gradient header (#0f766e → #115e59)
- ✅ Teal gradient buttons (#14b8a6 → #0d9488)
- ✅ Mobile-responsive table-based layout
- ✅ Security notices with warning icon
- ✅ Fallback text links
- ✅ Professional footer with Privacy/Terms links
- ✅ Proper email client compatibility (Gmail, Outlook, Apple Mail, etc.)

## Customization Tips

1. **Add Logo**: Replace the text header with an image:
   ```html
   <img src="https://yoursite.com/logo.png" alt="MyRevuHQ" style="max-width: 200px; height: auto;" />
   ```

2. **Change Colors**: Update the hex color codes throughout the template

3. **Add Social Links**: Add to the footer:
   ```html
   <a href="https://twitter.com/myrevuhq" style="color: #14b8a6;">Twitter</a>
   ```

4. **Different Button Text**: Modify the `<a>` tag button text as needed

## Testing Checklist

After applying templates, test with:
- [ ] Gmail (web and mobile app)
- [ ] Outlook (web and desktop)
- [ ] Apple Mail (macOS and iOS)
- [ ] Mobile email clients
- [ ] Dark mode support
- [ ] Link functionality
- [ ] Responsive design

