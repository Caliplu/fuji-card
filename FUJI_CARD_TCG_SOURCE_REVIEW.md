# Fuji Card TCG source review — 29 September 2026

## Update made

The Info page now points directly to the publishers' official Pokémon, One Piece, and Yu-Gi-Oh! product and card resources. The inherited dated news claims and card-list copying endpoint were removed. Fuji Card branding and the domain remain unchanged.

## The TCG archive supplied by the owner

`-tcg-store-main.zip` contains 151 `MOCK_PRODUCTS` in `lib/mock-data.ts`. Its code explicitly derives many prices by multiplying an outside market figure by 0.70. It also has example quantities, projected release information, outside image URLs, and no bundled product photos. Those fields are not evidence of Fuji Card inventory or a supplier quote. The existing Fuji Card catalog has 552 imported products; no archive price, quantity, or image was bulk imported into that catalog during this review.

## Sources checked

| Purpose | Source | What it can establish |
| --- | --- | --- |
| Japanese Pokémon releases and product details | https://www.pokemon-card.com/products/ | Publisher product identity and release information |
| Pokémon card search | https://www.pokemon-card.com/card-search/ | Card identities |
| One Piece products and cards | https://en.onepiece-cardgame.com/products/ and https://en.onepiece-cardgame.com/cardlist/ | Publisher product and card information |
| Yu-Gi-Oh! card database | https://www.db.yugioh-card.com/yugiohdb/TCG | Official card identities and releases |
| One Piece retailer sourcing | https://en.onepiece-cardgame.com/forstore/ | Bandai's distributors by region; retailers should contact the distributor for their area |
| GTS wholesale application | https://www.gtsdistribution.com/info/open-a-gts-business-account.asp | International retailer prescreening is offered; approval and availability are not guaranteed |

Publisher pages do **not** establish wholesale price, Fuji Card stock, image reuse permission, or shipping availability to the owner's market. Bandai's listed distributor regions do not name Cameroon; get written confirmation from an authorized distributor before describing a source as approved for Fuji Card.

## Needed for sale-ready listings

Obtain a supplier account or invoice/catalog showing the exact set code, language, condition, quantity, landed cost, and fulfillment terms. Obtain product photographs owned or licensed for Fuji Card and map them to product IDs. Confirm the retail price and actual stock before enabling orders or preorder claims. The existing checkout remains disabled without a tested store WhatsApp number.

## Deployment state

The reviewed source is in draft pull request `https://github.com/Caliplu/fuji-card/pull/1`. The connected Vercel team `fuji-card` lists zero projects. Import the updated repository into that team, configure the server-only Supabase secret and other required environment values, test a preview, then connect the Namecheap domain. The source is not deployed.
