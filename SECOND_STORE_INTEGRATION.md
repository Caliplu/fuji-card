# Second store ZIP integration — 29 September 2026

The supplied `-tcg-store-main.zip` is a separate Next.js project. Its README and site metadata describe a Goal26 FIFA ticket marketplace demo. It contains 151 TCG mock product records and **zero bundled image files**; product images are external URLs. Prices are USD demo figures and the quantities are mock stock, so those were not imported into Fuji Card's live database or prices.

Fuji Card's homepage now shows Pokémon, One Piece and Yu-Gi-Oh! collection cards using three image references from that archive, with existing local Fuji images as fallbacks. The collection links point to Fuji Card categories. The store's product list and detail pages now read the Supabase-backed API, without merging a separate client catalog of 374 products (56 had no matching server ID). This aligns displayed stock and prices with the 552 database catalog records imported earlier. The product filter route was also placed before the dynamic product ID route.

The archive's other external image links can be matched against specific Fuji Card SKUs later. Do not import its mock prices/stock or replace the Fuji application with the unrelated Goal26 ticketing routes.

Local production build passed. The reviewed update is in draft pull request `https://github.com/Caliplu/fuji-card/pull/1`. There is still no Vercel project under team `fuji-card`, preview deployment, or live DNS change.
