# Finish public sign-in email delivery

The Supabase project and database are configured for profiles and synced practice. Public sign-in codes also need an email delivery service. Supabase's built-in mail sender only delivers to the project's team and is intended for testing.

## 1. Choose and verify your sender

[Brevo](https://www.brevo.com/) supports transactional SMTP and sender-address verification. Create an account yourself, then add and verify a sender under **Settings → Senders, Domains & Dedicated IPs → Senders**. Use **Voice Studio** as the sender name. Make sure transactional email sending is activated.

For reliable public delivery, use an email address on a domain you own and authenticate that domain in Brevo. If using a free mailbox, Brevo may replace the sending domain with a compliant `brevosend.com` domain; follow its current instructions and verify delivery to several mailbox providers before announcing the app.

## 2. Connect the sender to Supabase

In Brevo, open **SMTP & API → SMTP** and copy the displayed SMTP login and SMTP key.

Open the [Voice Studio Supabase project](https://supabase.com/dashboard/project/sjgqwxwilmgziuayodki). Under **Authentication → Email → SMTP**, enable custom SMTP and enter:

| Field | Value |
|---|---|
| Sender email | Your verified sender address |
| Sender name | Voice Studio |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | The SMTP login displayed by Brevo |
| Password | Your Brevo SMTP key |

Enter the SMTP key directly in Supabase, not in this repository or in the webpage. Use the SMTP key, rather than Brevo's API key. Save the settings.

## 3. Make the email contain a code

In **Authentication → Email → Templates**, edit **Magic Link** (and **Confirm signup**, if shown separately). Include this body:

```html
<h2>Your Voice Studio sign-in code</h2>
<p>Enter this code in Voice Studio:</p>
<p><strong>{{ .Token }}</strong></p>
<p>If you did not request this code, you can ignore this email.</p>
```

Keep email authentication and new-user signups enabled. Keep email verification enabled. In **Authentication → URL Configuration**, set the Site URL to `https://trueyouaura.github.io/voice-studio/`.

## 4. Verify real delivery

Open **Profile** in Voice Studio, enter an email you control, and request a sign-in code. Enter the code, save a profile and a short practice session, then sign into the same email on a second device. Confirm that the profile, theme, pitch preferences, and history load. Recordings remain device-local.

Test another email address you control that is not a Supabase project-team member. If delivery fails, check **Supabase Authentication logs** and **Brevo Transactional email logs**. SMTP activation, sender verification, provider limits, and spam folders are common causes. Do not disable email verification to bypass a delivery issue.

## Sources

- [Supabase: custom SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase: email-code templates and authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Brevo: SMTP setup](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP)
- [Brevo: create and verify a sender](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email)
- [Brevo: sender requirements](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders)
