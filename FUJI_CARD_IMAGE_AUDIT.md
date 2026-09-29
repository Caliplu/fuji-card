# Fuji Card catalog image audit — 29 September 2026

The bundled Fuji Card catalog contains 552 products. Twenty-six main product images are local paths, and all 26 point to files present in `client/public`. The other 526 main product images are outside URLs; 865 gallery references are also outside URLs. Their availability, accuracy, and usage rights have not been verified. The second-store ZIP contained code and outside image links, but no product-photo files.

Main image sources in the bundled catalog:

| Source | Products |
| --- | ---: |
| Local files in this project | 26 |
| Shopify CDN | 179 |
| TCG Republic | 115 |
| Fuji Card Shop URL | 114 |
| Cardotaku | 42 |
| eBay images | 35 |
| Collective Cards | 20 |
| Amazon images | 9 |
| Pokémon TCG API | 6 |
| YGOPRODeck | 5 |
| Pokémon site | 1 |

The storefront now uses packaged images for the three collection tiles and a local Fuji Card logo when a product or announcement image fails. It does not substitute another product's photo. No external images were copied into this package or into Supabase Storage.

For a complete image migration, supply original product photos with a product ID or product name for each file, plus permission to use them. Then upload them to a store-owned asset location, map the verified URLs to the matching product IDs, and check representative listings on mobile before deployment.
