# Fuji Card — new Vercel + Supabase setup

Prepared 29 September 2026. This is for a **new preview environment**. Keep `www.fuji-card.com` on its current host until the preview, database, checkout, and support flows have been tested and explicitly approved for release.

## What is known

- The domain `fuji-card.com` is active in the owner's Namecheap account through 19 March 2027. The current website's hosting and source repository are not yet identified.
- The reviewed archive has Vercel configuration and a Vite/React client with an Express API. The owner forked the matching original source to `https://github.com/Caliplu/fuji-card`; the reviewed updates in this archive are not yet in that fork.
- The owner supplied Supabase project URL `https://zzazhmsdxlwdndzvrnwn.supabase.co` (project ref `zzazhmsdxlwdndzvrnwn`) and Vercel project ID `prj_1fpzUq1MwV01TofKfgaGLm11H043` under team slug `fuji-card`.
- The new Supabase connection now accesses project `FUJI CARD` in `eu-west-1`. The fresh schema was applied, and 552 bundled products and 9 categories are present. Nine application tables have RLS enabled; the `anon` role has no table privileges on sensitive data. The Supabase security advisor's remaining `rls_enabled_no_policy` notices are expected for this server-only data model.
- The newly linked Vercel connection uses the owner's connected account and can see the `Fuji Card` team, but the team lists zero projects. The supplied project ID cannot be inspected or listed for deployments under that team. The owner-controlled GitHub fork is visible, but this session's GitHub integration returned 403 for a write operation.
- `fujicard@fuji-card.com` is inactive. The patched client hides email support until a working address is configured.

## Setup order

1. **Confirm account ownership.** Choose the Supabase organization that should own the new Fuji Card database. Connect or create the Vercel account under the same business owner. Keep Namecheap domain ownership in the owner's account.
2. **Price check.** Retrieve the actual Supabase project cost for the selected organization and obtain the owner's confirmation before creating the project.
3. **Source and preview.** Put the reviewed code in an owner-controlled Git repository, link a new Vercel project, and deploy a preview URL. Do not attach the live custom domain yet.
4. **Database schema.** `api/database/NEW_PROJECT_SCHEMA.sql` has been applied to the new project; all 552 bundled products were imported with their existing IDs. Do not run the legacy SQL files (some disable RLS or grant `anon` access to `admin_settings`). `node api/scripts/seed-new-project.js` remains available for a fresh project and leaves previously inserted rows/stock unchanged.
5. **Secrets in Vercel.** Set server-side `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and a unique `JWT_SECRET` of at least 32 characters in Preview and Production as appropriate. Set explicit initial `ADMIN_USERNAME` and `ADMIN_PASSWORD` only for bootstrap. Keep `VITE_API_URL` unset to use same-origin `/api`. Do not prefix a database secret with `VITE_`, commit secrets, or paste them into chat.
6. **Verify preview.** Test API health, product inventory, account registration/login, admin login, cart, order creation, stock restoration, and images. Use test data and verify database policies and backups.
7. **Commerce and support.** The prepared checkout offers an order request only. It stays disabled until a store-owned WhatsApp number is tested and set as `VITE_ORDER_WHATSAPP_NUMBER` (international digits with country code). This request does not reserve stock or confirm payment. Choose supported payment providers and settlement currency before enabling direct payment; test payment confirmation, webhooks, refunds, shipping, and customer communication. Activate a mailbox, verify sending and receiving, then set `VITE_SUPPORT_EMAIL` to the tested address and redeploy.
8. **Domain switch.** After the preview passes and the owner approves, update Namecheap DNS for the chosen Vercel project. Preserve existing email DNS records during the change and verify both `www` and the apex domain.

## Current code changes for a new database

The API now requires a server-only Supabase secret key (`SUPABASE_SECRET_KEY`, with legacy service-key names supported) and never falls back to an anon key. If no server secret is set, persistent features remain unavailable and checkout fails closed. The `.gitignore` excludes local environment files. The production frontend does not include a Supabase secret.

## Required owner decisions

1. Review and merge `https://github.com/Caliplu/fuji-card/pull/1` when the preview is validated. Import the update branch for a preview first; the old `main` branch does not contain these changes yet.
2. Create/link a Vercel project in team `fuji-card` from that repository, or show where the supplied project ID resides; the team currently lists no projects.
3. Is the new deployment a preview of Fuji Card that will eventually replace the current `www.fuji-card.com` site? Keep the current site unchanged until that decision is confirmed.

The new Supabase project has been initialized with schema and catalog. No Vercel deployment, secrets, DNS, payment setup, or live website changes have been applied from this workspace.
