# Fuji Card access handover

**Known public website:** https://www.fuji-card.com. The owner now controls the domain and has an owner-controlled source fork. The current live hosting remains unverified.

**Owner account inventory (no passwords):** the owner's connected account is the login email the owner supplied for the connected GitHub and Vercel accounts. GitHub fork: `https://github.com/Caliplu/fuji-card` (the reviewed ZIP updates are not uploaded). Vercel team: `https://vercel.com/fuji-card` (no projects visible to the connected account). New Supabase project: `https://supabase.com/dashboard/project/zzazhmsdxlwdndzvrnwn`, API URL `https://zzazhmsdxlwdndzvrnwn.supabase.co` (schema and catalog initialized). These are account and project references, not storefront customer login credentials. The inactive `fujicard@fuji-card.com` address must not be presented as working support.

**Namecheap update:** A Namecheap email screenshot dated 29 September 2026 states the recipient is now owner of `fuji-card.com`. Confirm in the Namecheap account whether a hosting subscription also appears, and what nameservers/DNS records point to the live site. The domain ownership notice does not identify the web server or transfer the code and database.

Use this as a checklist. Fill in links, account names, and whether an invitation has been sent. **Do not put passwords, recovery codes, API keys, tokens, or full environment-variable values in this file or in chat.** Invite a collaborator using the service's account access controls; enter secrets only in the provider's own dashboard.

## 1. Project ownership and code

| Item | What to provide | Status / link (no secrets) |
| --- | --- | --- |
| Live storefront | Public production URL | https://www.fuji-card.com |
| Source repository | GitHub repository URL and collaborator access with permission to create branches and pull requests | Owner fork `https://github.com/Caliplu/fuji-card`; GitHub plugin write attempt returned 403, so reviewed changes remain in the ZIP |
| Project owner | Name or business that owns the repo, domain, hosting, and database | |
| Release process | Who reviews and approves a production deployment | |
| Priorities | The first three changes you want, and any launch deadline | |

## 2. Hosting (Vercel or Namecheap)

| Item | What to provide | Status / link (no secrets) |
| --- | --- | --- |
| Team and project | Vercel team/project link and a project or team invitation that permits deployment inspection and configuration work | `https://vercel.com/fuji-card`; connected account lists zero projects. Supplied `prj_1fpzUq1MwV01TofKfgaGLm11H043` was not accessible under this team |
| Namecheap hosting | Confirm whether a hosting plan exists in the account, and provide the plan name and cPanel/site access through a secure invitation or delegated access where available | |
| Deployment | Production URL, branch, build settings, and any preview URL | |
| Environment | Confirm which variables below exist for Production and Preview; enter missing values in Vercel yourself | |
| Logs | Access to build and function logs | |
| Domain | Which Vercel project owns the custom domain and who can edit DNS | |

The repository has `vercel.json` and builds the React client into `dist` while routing `/api/*` to `api/index.js`. Before any release, verify the deployed project uses this repository and the correct build settings.

## 3. Supabase

| Item | What to provide | Status / link (no secrets) |
| --- | --- | --- |
| Project | Supabase organization/project dashboard link and an appropriate project invitation | New owner project `https://supabase.com/dashboard/project/zzazhmsdxlwdndzvrnwn`; 552 products and 9 categories imported |
| Database | Confirm the production project, schema version, current tables, and a recent restorable backup | |
| Storage | Confirm the `products` storage bucket and its access rules | |
| API settings | Confirm server-side key configuration and RLS policies; never place a service role/secret key in client variables | |
| Data safety | Identify any real customer and order data before migrations or test orders | |

This app uses its own `users` table and JWTs. It does not currently use Supabase Auth for customer login. The prepared server requires a server-only `SUPABASE_SECRET_KEY` and will not use an anon key for privileged access. The owner account email above does not create a customer or admin login in the app.

## 4. Payments, domain, and customer operations

| Item | What to provide | Status / link (no secrets) |
| --- | --- | --- |
| Paystack | Merchant dashboard access, test/live status, currencies, and webhook/return URL settings | |
| PayFast | Merchant dashboard access, test/live status, and notification URL settings | |
| Other methods | Which displayed methods are real, active, and approved for checkout (Wise, crypto, WhatsApp, etc.) | |
| Domain/DNS | Namecheap nameservers/DNS records and access if domain changes are required | Domain ownership change confirmed by Namecheap email screenshot; DNS details pending |
| Private Email | Set up and verify a mailbox or alias for `fujicard@fuji-card.com` (or another approved support address), identify its provider and owner, and test sending and receiving | Owner reports current mailbox inactive; patched contact page hides it until configured |
| Fulfillment | Shipping regions, stock source of truth, tax rules, refund/contact process | |

Avoid real transactions until checkout, payment confirmation, and stock updates have been tested in a safe environment. The prepared frontend offers only an order request through a store-owned, tested WhatsApp number; this is disabled until `VITE_ORDER_WHATSAPP_NUMBER` is set. It does not claim payment or reserve stock. Direct Paystack, PayFast, and crypto payments are not offered in this prepared storefront.

## 5. Environment-variable inventory

Confirm **names and presence only** in this document. Put values in the Vercel dashboard or a private local `.env`; never commit `.env` or send values in chat.

| Variable | Purpose | Set in production? |
| --- | --- | --- |
| `JWT_SECRET` | Unique random signing secret, at least 32 characters; required to start the patched API | |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Explicit initial admin login if no stored admin credentials exist; remove/rotate after setup | |
| `SUPABASE_URL` | Production Supabase project URL | |
| `SUPABASE_SECRET_KEY` | Server-only database access to the new project | |
| `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_CURRENCY` | Paystack integration, if active | |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_URL` | PayFast integration, if active | |
| `VITE_API_URL` | Browser API base; same-origin `/api` works as the default | |
| `VITE_PAYSTACK_PUBLIC_KEY` | Browser publishable key, if Paystack is active | |
| `VITE_ORDER_WHATSAPP_NUMBER` | Optional tested store-owned international phone number for order requests; leave unset until verified | |

The previous ZIP contained known fallback admin credentials and a known JWT secret. The patched API removes those fallbacks. Set a fresh `JWT_SECRET` before deploying the patch; changing it will invalidate existing customer and admin sessions. Rotate any live admin credentials that used the old defaults.

The patched order route also derives totals from catalog prices in GBP and rejects invalid quantities, unavailable stock, and a missing database. It does not take the browser's submitted total as the order total. Payment-provider initialization and webhook verification still need separate review.

## First handover reply

Send the GitHub repository URL, public website URL, Vercel project link, Supabase project link, and your top priority. Mark which invitations have been sent. Keep account ownership and two-factor authentication under your control.
