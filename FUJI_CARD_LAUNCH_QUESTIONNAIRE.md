# Fuji Card Market — launch questionnaire

**Known public website:** https://www.fuji-card.com (provided by the owner on 29 September 2026). The public site displays Fuji Card Market products; its deployed repository and hosting project have not yet been verified.

**Known account detail:** A Namecheap email screenshot dated 29 September 2026 says the recipient is now owner of `fuji-card.com`. Whether the hosting plan was transferred is not yet known.

Fill in what you know; write **unknown** for the rest. Send links and choices in chat if convenient. Do **not** write passwords, API keys, tokens, recovery codes, or full environment values here. Grant access through Vercel, Supabase, GitHub, domain, and payment provider invitations. Keep your own ownership and two-factor authentication.

## A. The site and its owner

1. Is **Fuji Card Market** the final public name? The known public URL is **https://www.fuji-card.com**. Should `fuji-card.com` also redirect there?
2. There is an existing public site at that URL. Should this archive update that same site, and is it the current deployed source or an older copy?
3. Who legally operates the store (person or registered business), and in which country? What business/contact details may be published?
4. What is the intended launch date and time zone? Which countries may buy at launch?
5. Who makes final decisions on prices, payments, content, and production deployment?

## B. Code, Vercel, domain, and Supabase

6. What is the GitHub repository URL, default branch, and the latest source of truth? Please invite a collaborator who can create branches and pull requests.
7. Is the site hosted in Namecheap cPanel, Vercel, or another service? If Vercel is used, what is its team/project link and connected GitHub repository?
8. What is the Supabase organization/project link? Is it production, staging, or both? Please grant project access appropriate for inspecting schema, policies, and logs.
9. In Namecheap, does `fuji-card.com` appear in **Domain List**? Does a hosting plan also appear? What are its nameservers and `www` DNS record? Share a screenshot with personal details, codes, and account numbers covered.
10. Are there real customer accounts, orders, inventory, or product images in Supabase? When was the last restorable backup?
11. Are the production and preview environment variables already set? Confirm names and status using [FUJI_CARD_ACCESS_HANDOVER.md](FUJI_CARD_ACCESS_HANDOVER.md); enter secret values only in the provider's dashboard.

## C. Catalog and commercial rules

12. Which products are authorized for sale? Provide the catalog source, images you may use, prices, currency, descriptions, and stock quantities.
13. Are products shipped physically, sold digitally, or both? Where does stock live and who updates it after each sale?
14. The code currently uses **GBP catalog prices** and a **£500 minimum order**. Keep or change both? What shipping fee or free-shipping threshold applies?
15. Which currencies should customers see, and which currency is actually charged? Who supplies and updates conversion rates?
16. Which shipping origin, destination countries, carriers, rates, delivery estimates, customs terms, and tracking method should be shown?
17. What taxes/VAT/sales-tax rules and invoice details apply? Who will validate these rules for your operating countries?

## D. Payments and order flow

18. Which methods should truly work at launch: Paystack, PayFast, bank transfer, crypto, WhatsApp arrangement, or another provider? Mark **live**, **test**, or **not ready** for each.
19. For each live provider: what is the merchant dashboard link, account country, settlement currency, webhook status, refund process, and a safe test account? Invite access through that provider. Do not send keys in chat.
20. Should customers complete payment on the website or request a manual payment conversation? Is the current WhatsApp number `818023903373` correct and approved for store orders?
21. When should stock be reserved or reduced: order creation, confirmed payment, or manual acceptance? When should an order be marked paid?
22. Who receives new orders, confirms payment, packs goods, handles refunds, and resolves failed or cancelled payments?

## E. Customers, support, and required pages

23. What public support email, phone/WhatsApp, and business hours should appear? Who answers customer messages?
24. What email sending service and verified sender domain are available? The current confirmation page says an email was sent, but that claim needs a working email flow.
25. Supply or approve the privacy policy, terms of sale, shipping/returns/refunds policy, and any age or product restrictions relevant to your business.
26. Are customer accounts required, or should guest checkout be available? Are there existing users whose access must be preserved?
27. Provide final logo, colors, product photos, social links, and the wording for the home page and contact page.

## F. Testing and release

28. Can we use a staging/preview deployment and test products/orders? What test accounts or sample data may be used without affecting real customers?
29. Who will perform a test purchase and refund with each active payment method? Who will confirm shipping and email behavior?
30. Who will review the finished preview and explicitly approve the production release? What launch window and rollback contact should we use?

## Start here

Reply first with **questions 1, 2, 6, 7, 8, 14, 18, and 20**. Those establish which project is live and what checkout should do. Then we can fill the remaining details while reviewing the code. The source archive alone cannot reveal account ownership, live keys, stock accuracy, or whether a provider is approved and active.
