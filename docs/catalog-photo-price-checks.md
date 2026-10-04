# Product photos and UK price references

Checked on 4 October 2026. This update matches 15 product reference photos to 11 existing catalog records: nine Japanese booster boxes, Japanese alternate-art Counterspell foil, and Japanese regular-art Ragavan foil. It corrects the 151 box/card mismatch and the shared Counterspell/Ragavan image.

The nine boxes have GBP retail asking-price references. These are manually checked retailer listings, not a live market feed, sold-price valuation, supplier commitment, or proof that Fuji Card owns the advertised stock. Retailer prices and availability do not change Fuji Card prices, stock, or checkout amounts.

| Japanese booster box | Available price observations | Other observed listings | Contents |
| --- | --- | --- | --- |
| Ninja Spinner M4 | Japan2UK £64.99; Titan Cards £64.99; Portal TCG £79.99 | — | 30 packs × 5 cards |
| Mega Dream ex M2a | Japan2UK £89.99 | Card Collective £84.99, sold out | 10 packs × 10 cards |
| Pokémon Card 151 SV2a | Japan2UK £299.99 | Portal TCG £239.99, sold out | 20 packs × 7 cards |
| Adventure on KAMI’s Island OP-15 | Rusty’s Collectables £89.99 | Japan2UK £109.99, sold out | 24 packs × 6 cards |
| Mega Brave M1L | Japan2UK £59.99 | — | 30 packs × 5 cards |
| Mega Symphonia M1S | Japan2UK £54.99 | — | 30 packs × 5 cards |
| Inferno X M2 | Japan2UK £114.99 | — | 30 packs × 5 cards |
| Nihil Zero M3 | Japan2UK £59.99 | — | 30 packs × 5 cards |
| Egghead Crisis EB-04 | No available offer in this check | Japan2UK £104.99, sold out; Portal TCG £77.99, coming soon | 24 packs × 6 cards |

Exact image URLs, source product pages, edition matches, seller URLs, and observed availability are recorded in `api/data/catalog-evidence.js`. Sources are Japan2UK, Titan Cards, Portal TCG, Rusty’s Collectables, Card Collective, and TCGRepublic. Magic card source prices were not converted to GBP because their currency and exact UK valuation were not verified.

## Behavior and maintenance

- `/api/products/highlights` returns only matching existing Japanese booster-box records in a fixed display order. It does not create stock or catalog records.
- Product references attach only when ID, name, language, set, and product unit still match the checked record. An admin variant edit disables the old references until they are reviewed again.
- Product-detail galleries show source links, a full-photo link, labeled thumbnails, and a stock-photo explanation. The current inventory image remains first so later admin photo updates take effect.
- The homepage shows contained square photos, lazy loading, reserved image space, and deferred rendering of offscreen cards. Small-screen product cards now show the whole product instead of cropping the packaging.
- The price range includes only listings available at the check. Sold-out and coming-soon listings retain their labels and stay outside the range. Postage is not included.
- References are hidden at `2026-10-11T00:00:00Z`. Images and pack information remain. To refresh, reopen each exact seller listing, verify the Japanese edition and availability, update the observed values, and then update `CATALOG_CHECKED_AT`. Do not advance the date without a fresh check.

## Catalog data change

`api/database/catalog-photo-refresh.sql` updates 11 primary images with guards for the old URL and exact product variant. It also corrects Ninja Spinner from 20 to 30 packs. It was applied and verified on 4 October 2026. The previous images and descriptions are recorded in `api/data/catalog-photo-backup.json`. The script does not change sale prices or stock. Its guards make a second application harmless and protect subsequent admin edits.

## Validation

- `node --test api/tests/catalog-evidence.test.js`: six checks passed for variant isolation, price expiry, sold-out/coming-soon treatment, photo uniqueness, and later inventory-photo edits.
- Targeted ESLint checks passed for changed React components.
- `npm run build --prefix client` and API syntax checks passed.
- A post-update database read confirmed all 11 image URLs, the corrected pack count, and unchanged prices and stock.
- Component rendering checks confirmed gallery buttons, source links, GBP amounts, the check date, and expired-price hiding.
- Visual browser verification was unavailable: this workspace has neither the agent-browser executable nor an installed Chromium binary. No visual result or performance benchmark is claimed.
