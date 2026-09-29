# Fuji Card new-project progress — 29 September 2026

Supabase project `FUJI CARD` (`zzazhmsdxlwdndzvrnwn`, eu-west-1) is now connected. The clean baseline schema in `api/database/NEW_PROJECT_SCHEMA.sql` was applied to the new empty project. All 552 bundled products were imported with their existing text IDs; there are 9 categories and no uncategorized or negative price/stock rows. RLS is enabled on all nine app tables, and anonymous clients have no direct read privilege on `users` or `admin_settings`. A pre-existing auto-RLS event-trigger function's public execute privilege was removed. Do not run the legacy SQL files.

The owner forked the matching original source into `https://github.com/Caliplu/fuji-card` on `main`. GitHub access was subsequently installed, and the reviewed source was uploaded to the draft pull request `https://github.com/Caliplu/fuji-card/pull/1` on `codex/fuji-card-launch-update`. The Vercel team still lists zero projects. No preview or production deployment has been created.

Local code changes include checkout using database prices/stock, storing each order item's name and price, requiring a guest session ID, and restricting cart item changes to the shopper's own cart. The build and a local session API check pass. This flow has not been tested against a deployed API, live database, or payment provider. No Vercel deployment, DNS, or live site changes were made. The support mailbox remains unverified.

The admin `sync-flagship` action was changed to import only missing items from the 552-item bundled catalog. It now preserves existing product IDs, price, stock, images and order references. The local production build passes. The domain's mail records could not be checked from this workspace, so the mailbox is still unverified.

The prepared checkout no longer displays unverified payment brands or developer-supplied wallet/contact destinations. It presents an order request by WhatsApp only when the owner configures a tested `VITE_ORDER_WHATSAPP_NUMBER`; otherwise ordering is visibly unavailable. Opening WhatsApp is not represented as a paid or accepted order. No payment provider or contact number has been activated in Vercel.

The customer account frontend now rejects failed login and registration instead of creating a fake local session. Profile edits report API failures instead of pretending the changes were saved. Old `mock_token` sessions are cleared on the next authentication check. The production build passes, but no deployed account flow has been tested yet.

The site brand in the header, footer, checkout text, account pages, metadata, and API health response is now consistently **Fuji Card**. The domain remains `fuji-card.com`. Unverified review counts and placeholder footer links were removed. Instagram appears only when a verified `VITE_INSTAGRAM_URL` is configured. Login and registration no longer log submitted credentials or response tokens in the browser console. These changes are prepared locally and have not been deployed.

The Info page now links to official publisher product and card resources. Inherited dated news claims and an API that copied another store's card-list HTML were removed. The owner's TCG archive contains mock prices and stock, so no bulk catalog price or inventory update was made. See `FUJI_CARD_TCG_SOURCE_REVIEW.md`.

Direct API calls to create orders or initialize Paystack/PayFast now fail closed unless the server-only `ORDER_PROCESSING_ENABLED=true` is set. Keep it false while stock, price, fulfillment, and payment operations are unverified. The WhatsApp order-request page remains separately disabled until a tested store number is configured.
