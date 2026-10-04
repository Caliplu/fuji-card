# International shopping and catalog browsing

Fuji Card now offers a country and display-currency selector in the storefront header. It includes all 249 ISO 3166-1 countries and territories and 153 currencies currently used as legal tender in those places. Selecting a country selects its first listed tender currency; customers can choose a different display currency. Cameroon defaults to XAF. Antarctica has no tender currency and defaults to the store's GBP currency.

The same country list is available in account addresses. Country names are still stored as names to match the existing profile API. Existing saved names that differ from the new labels remain selectable. Changing the browsing country does not silently edit the delivery address. Postal codes are optional in the account and order-request flow; a customer can clear an old postal code when updating an address. Country selection is not a guarantee of shipping service; the store confirms delivery and final amounts.

## Currency estimates

The catalog, server order calculation, product filters, and order requests remain denominated in GBP. Converted display prices are marked `≈` and use currency codes to distinguish amounts, with zero decimal places for currencies such as JPY and XAF and three for KWD. Cart and checkout show the GBP items subtotal alongside the selected estimate. Recorded orders use their recorded currency, and dated UK retailer reference prices continue to show their original GBP amounts.

ExchangeRate-API's open-access endpoint supplies daily conversion quotes directly to the browser, without an API key: https://open.er-api.com/v6/latest/GBP. The provider permits commercial conversions and local caching, requires attribution, and prohibits redistribution. The header and currency notice include its attribution link. The store's `/api/currencies` endpoint returns country/currency metadata and the GBP base only; it does not proxy or redistribute conversion quotes.

Rates are cached locally until their next scheduled update. Quotes must have GBP as their base, a GBP rate of 1, positive finite rates, and plausible update timestamps. Rates older than 36 hours or more than five minutes in the future are rejected. Automatic failed-request retries are limited to once an hour while conversion is selected. Preferences and cache failures do not stop shopping. If the selected currency lacks a usable quote, prices explicitly remain GBP and the selector explains the fallback. KPW is listed as a current currency but the provider has no rate for it. A public-source check on 4 October 2026 found quotes for the other 152 listed currencies; provider coverage can change.

Sources:

- ISO country codes: https://www.iso.org/iso-3166-country-codes.html
- Country validity: https://github.com/unicode-org/cldr/blob/main/common/validity/region.xml
- Country code mappings: https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/codeMappings.json
- Currency validity dates and fraction digits: https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/currencyData.json
- Provider terms and caching/attribution guidance: https://www.exchangerate-api.com/docs/free

The data snapshot is dated 4 October 2026 and derived from Unicode CLDR 48. Names are English display names. Expired currencies such as BGN, ANG, and ZWL are excluded. Bulgaria defaults to EUR, Curaçao and Sint Maarten to XCG, and Zimbabwe to ZWG. The Unicode license is included in `shared/UNICODE-LICENSE.txt`. Refresh `shared/markets.js` when country or tender-currency assignments change.

## Catalog browsing

New catalog controls use the existing database fields for product type, language, condition, rarity, and set, plus stock > 0. Active filters can be removed individually, and changing a game clears set-specific choices. Query changes cancel old requests; facet options load separately from product results. The page shows 24 items at a time, with compact pagination, error retries, and a two-column mobile grid. Mobile filters support Escape, a keyboard focus loop, and focus restoration. Cart buttons are outside product links. Images reserve their dimensions and load lazily; cards have no continuous animation.

Price controls retain GBP units and cover the catalog's highest price, rounded up to the next £100. The current catalog check found 552 products, 548 with stock, a maximum price of £3,997, two languages, 11 condition labels, and 85 sets. Sorting uses product ID as a second key so equal-price items retain a consistent order across pages.

## Validation

- `npm test`: currency freshness/base/precision/fallback, country coverage, saved preferences, GBP request totals, URL filters, Supabase query encoding, source reference behavior, and rendered selectors/cart/checkout/order records.
- `npm run build --prefix client`: production bundle.
- Targeted ESLint for all changed frontend source files and Node syntax checks for the changed API routes.

The markup test uses Vite middleware mode and test fixtures without opening an HTTP port. It is not browser verification. Chromium and agent-browser were unavailable in this workspace; check live exchange fetching/CORS, mobile scrolling, touch interactions, focus handling, and narrow-layout rendering in a real browser before merging.
