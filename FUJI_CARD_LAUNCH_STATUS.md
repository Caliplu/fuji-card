# Fuji Card Market — launch status (29 September 2026)

## What is established

- Public storefront: https://www.fuji-card.com, showing Fuji Card Market products in public search results. This establishes a public URL; it does not prove that checkout or payment works today.
- A Namecheap email screenshot dated 29 September 2026 states that the recipient is now owner of `fuji-card.com`. This confirms the domain ownership change reported by the owner. Hosting and application access remain unverified.
- The provided archive is a React/Vite storefront with an Express API, Supabase integration, and a Vercel configuration. The live deployment's source repository and hosting service are not yet confirmed.

## Work completed in the local archive

- Removed known fallback admin credentials and JWT secret; a fresh secret of at least 32 characters is required before deployment.
- Order creation now uses catalog prices in GBP, enforces the £500 minimum, rejects invalid quantities and unavailable stock, and refuses to create mock orders without a database.
- Removed the unused card-number/CVV form and corrected an order-confirmation page that previously claimed payment and email delivery without checking them.
- Paystack and PayFast setup now fetch the stored order, check order ownership and pending status, ignore browser-supplied payment amounts, and reject currencies that have not been safely configured. PayFast requires a ZAR order; this archive creates GBP orders, so it currently rejects direct PayFast setup.
- Removed a PayFast debug log that could have exposed signature input and merchant details.
- The contact page previously claimed messages were submitted while only logging them in the browser. The owner has now confirmed `fujicard@fuji-card.com` is inactive. The patched page hides the email form/address by default and points visitors to the existing Instagram contact link. Set `VITE_SUPPORT_EMAIL` only after a mailbox is verified for sending and receiving. A server-side contact form has not been configured.
- The order-cancellation/cart-restoration route now requires the order owner (or its non-generic guest session) and conditionally changes only a pending order to cancelled. This prevents a second cancellation request from restoring stock again. The stock and cart updates remain separate database operations; a staging integration test and a transactional design are still needed before relying on them for live inventory.
- React production build and local API smoke checks passed. No real payment, database, or deployment test has been performed.

## What blocks a verified selling launch

1. Identify the hosting application and source repository in the Namecheap account or its DNS/hosting details. The confirmed domain transfer does not establish deployment access.
2. Confirm the production database, backups, inventory, admin and environment settings before applying this code.
3. Confirm the merchant account, settlement currency, FX handling, return URLs, webhooks, and payment verification for each direct payment provider. The current storefront sends Paystack/PayFast selections to WhatsApp and direct gateway checkout has not been validated end to end.
4. Confirm shipping countries, fees, refunds, policies, customer support, and whether the current WhatsApp number is authorized for orders.
   The owner says `fujicard@fuji-card.com` is inactive. Identify the desired Namecheap Private Email/cPanel/other mailbox, who will control it, and verify sending and receiving before enabling the address on the site.
5. Publish a preview, complete a test order and refund, then review the exact production release.

## New Vercel and Supabase request

The owner plans to send new Vercel and Supabase project links. The API has been changed to require a server-only Supabase secret key, with no anon-key fallback. The root production build and local key-selection checks passed. No projects or DNS changes have been made. See [NEW_VERCEL_SUPABASE_SETUP.md](NEW_VERCEL_SUPABASE_SETUP.md) for the staged setup. Legacy SQL in this archive must be reconciled and reviewed before running it on a new database.

## Next account check

In the Namecheap account that received the transfer, inspect **Domain List** for `fuji-card.com` and the **Hosting List** for a plan. Open the domain's **Manage** page and note the nameservers and `www` DNS record. A screenshot of those pages with email address, account numbers, codes, and any keys covered is enough to identify the next deployment route. Do not paste login passwords or API keys into this file or chat.
