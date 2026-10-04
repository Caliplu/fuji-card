// Manually checked product references. Prices are GBP retailer asking prices,
// not sold-market valuations or a live feed. Refresh the date only after checking sources.
export const CATALOG_CHECKED_AT = '2026-10-04';
const japan = 'https://www.japan2uk.com/products/';
const japanImage = 'https://www.japan2uk.com/cdn/shop/files/';
const photo = (url, label, source, sourceUrl) => ({ url, label, source, source_url: sourceUrl });
const offer = (seller, url, amount, availability = 'in_stock') => ({
  seller, url, amount, currency: 'GBP', availability, checked_at: CATALOG_CHECKED_AT
});
const box = (id, name, set, expectedSet, packs, cards, slug, image, amount, availability = 'in_stock') => {
  const source = japan + slug;
  return {
    id, name, set, language: 'Japanese', unit: 'Booster Box', expected_set: expectedSet,
    packs_per_box: packs, cards_per_pack: cards,
    photos: [photo(japanImage + image, 'Booster box', 'Japan2UK', source)],
    offers: [offer('Japan2UK', source, amount, availability)]
  };
};

export const catalogEvidence = [
  box('jp-m4-bb', 'Ninja Spinner', 'M4', 'M4 Ninja Spinner', 30, 5,
    'pokemon-ninja-spinner-m4-japanese-booster-box',
    'Pokemon_Ninja_Spinner_m4_Japanese_Booster_Box._700x700.png?v=1773678988', 64.99),
  box('jp-m2a-bb', 'Mega Dream ex', 'M2a', 'M2a MEGA Dream ex', 10, 10,
    'pokemon-mega-dream-ex-high-class-m2a-japanese-booster-box',
    'Pokemon_Mega_Dream_ex_High_Class_m2a_Japanese_Booster_Box_700x700.png?v=1778140921', 89.99),
  box('pk-151-bb', 'Pokémon Card 151', 'SV2a', 'SV2a', 20, 7,
    'pokemon-151-sv2a-japanese-booster-box',
    'Pokemon_151_sv2a_Japanese_Booster_Box.._700x700.png?v=1769533711', 299.99),
  box('jp-op15-bb', 'Adventure on KAMI’s Island', 'OP-15', 'OP-15', 24, 6,
    'one-piece-adventure-on-kamis-island-op-15-japanese-booster-box',
    'One_Piece_Adventure_on_KAMI_s_Island_OP-15_Japanese_Booster_Box._700x700.png?v=1772789014', 109.99, 'sold_out'),
  box('jp-m1l-bb', 'Mega Brave', 'M1L', 'M1L Mega Brave', 30, 5,
    'pokemon-mega-brave-m1l-japanese-booster-box',
    'Pokemon_Mega_Brave_m1L_Japanese_Booster_Box_700x700.png?v=1789482776', 59.99),
  box('jp-m1s-bb', 'Mega Symphonia', 'M1S', 'M1S Mega Symphonia', 30, 5,
    'pokemon-mega-symphonia-m1s-japanese-booster-box',
    'Pokemon_Mega_Symphonia_m1S_Japanese_Booster_Box.._700x700.png?v=1789483042', 54.99),
  box('jp-m2-bb', 'Inferno X', 'M2', 'M2 Inferno X', 30, 5,
    'pokemon-inferno-x-m2-japanese-booster-box',
    'Pokemon_Inferno_X_m2_Japanese_Booster_Box..._700x700.png?v=1768309365', 114.99),
  box('jp-m3-bb', 'Nihil Zero', 'M3', 'M3 Munikis Zero', 30, 5,
    'pokemon-nihil-zero-m3-japanese-booster-box',
    'Pokemon_Nihil_Zero_m3_Japanese_Booster_Box._700x700.png?v=1772463775', 59.99),
  box('jp-eb04-bb', 'Egghead Crisis', 'EB-04', 'EB-04', 24, 6,
    'one-piece-egghead-crisis-eb-04-japanese-booster-box',
    'One_Piece_Egghead_Crisis_EB-04_Japanese_Booster_Box._700x700.png?v=1770216071', 104.99, 'sold_out'),
  {
    id: 'tcg-2000277120', name: 'Counterspell Foil JPN Alternate Art',
    set: 'Strixhaven Mystical Archive · Japanese alternate art', expected_set: 'Magic: The Gathering',
    language: 'Japanese', unit: 'Magic: The Gathering',
    photos: [photo('https://tcgrepublic.com/media/binary/000/282/919/282919.png.thumbnail.jpg',
      'Japanese alternate art · foil edition', 'TCGRepublic', 'https://tcgrepublic.com/product/product_page_2000277120.html')],
    offers: []
  },
  {
    id: 'tcg-2000286991', name: 'Ragavan, Nimble Pilferer Foil',
    set: 'Modern Horizons 2 · regular art foil', expected_set: 'Magic: The Gathering',
    language: 'Japanese', unit: 'Magic: The Gathering',
    photos: [photo('https://tcgrepublic.com/media/binary/000/293/108/293108.png.thumbnail.jpg',
      'Japanese regular art · foil edition', 'TCGRepublic', 'https://tcgrepublic.com/product/product_page_2000286991.html')],
    offers: []
  }
];

const byId = new Map(catalogEvidence.map(entry => [entry.id, entry]));
const ninja = byId.get('jp-m4-bb');
ninja.photos.push(
  photo('https://titancards.co.uk/cdn/shop/files/Ninja-Spinner-Japanese-Booster-Box_700x700.webp?v=1777292175',
    'Booster box · alternate view', 'Titan Cards', 'https://titancards.co.uk/products/ninja-spinner-japanese-booster-box'),
  photo('https://portaltcg.co.uk/cdn/shop/files/fddfda_185a0208b6fc4b99baedd664fda6594e_mv2_0c2603d0-d9b8-4133-a476-e47b76a4e617.jpg?v=1789814277&width=3840',
    'Booster pack · packaging reference', 'Portal TCG', 'https://portaltcg.co.uk/products/pokemon-mega-evolution-ninja-spinner-m4-japanese-booster-box')
);
ninja.offers.push(
  offer('Titan Cards', 'https://titancards.co.uk/products/ninja-spinner-japanese-booster-box', 64.99),
  offer('Portal TCG', 'https://portaltcg.co.uk/products/pokemon-mega-evolution-ninja-spinner-m4-japanese-booster-box', 79.99)
);
const card151 = byId.get('pk-151-bb');
card151.photos.push(photo('https://portaltcg.co.uk/cdn/shop/files/fddfda_1971eaadc1f344c38def5028185b3c44_mv2.webp?v=1782914309&width=3840',
  'Booster box · alternate view', 'Portal TCG', 'https://portaltcg.co.uk/products/pokemon-scarlet-violet-151-sv2a-japanese-booster-box'));
card151.offers.push(offer('Portal TCG', 'https://portaltcg.co.uk/products/pokemon-scarlet-violet-151-sv2a-japanese-booster-box', 239.99, 'sold_out'));
const op15 = byId.get('jp-op15-bb');
const rusty = 'https://rustyscollectables.com/collections/one-piece-japanese-booster-box/products/one-piece-adventure-on-kamis-island-op-15-japanese-booster-box';
op15.photos.push(photo('https://rustyscollectables.com/cdn/shop/files/op15BOOSTERBOX.png?v=1772728765&width=535',
  'Booster box · alternate view', 'Rusty’s Collectables', rusty));
op15.offers.push(offer('Rusty’s Collectables', rusty, 89.99));
byId.get('jp-m2a-bb').offers.push(offer('Card Collective', 'https://card-collective.com/products/pokemon-tcg-mega-dream-ex-japanese-booster-box', 84.99, 'sold_out'));
byId.get('jp-eb04-bb').offers.push(offer('Portal TCG', 'https://portaltcg.co.uk/products/one-piece-egghead-crisis-eb-04-japanese-booster-box', 77.99, 'coming_soon'));

export const CURATED_PRODUCT_IDS = catalogEvidence.filter(entry => entry.unit === 'Booster Box').map(entry => entry.id);
const expectedNames = {
  'jp-m4-bb': 'M4 Ninja Spinner booster box Japanese Pokemon Card',
  'jp-m2a-bb': 'M2a MEGA Dream ex booster box Japanese Pokemon Card',
  'pk-151-bb': 'Pokemon Card 151 Booster Box Japanese',
  'jp-op15-bb': 'OP-15 Adventure on KAMI’s Island booster box Japanese ONE PIECE CARD',
  'jp-m1l-bb': 'M1L Mega Brave booster box Japanese Pokemon Card',
  'jp-m1s-bb': 'M1S Mega Symphonia booster box Japanese Pokemon Card',
  'jp-m2-bb': 'M2 Inferno X booster box Japanese Pokemon Card',
  'jp-m3-bb': 'M3 Munikis Zero (Nihil Zero) booster box Japanese Pokemon Card',
  'jp-eb04-bb': 'EB-04 EGGHEAD CRISIS Booster Box Japanese ONE PIECE CARD',
  'tcg-2000277120': 'Counterspell Foil JPN Alternate Art',
  'tcg-2000286991': 'Ragavan, Nimble Pilferer Foil'
};
const normalize = value => String(value || '').trim().toLowerCase();

// Bind references to the exact existing SKU, language, set and product unit.
// If an admin changes the variant, stop attaching the old evidence.
export function getCatalogEvidence(product) {
  const entry = byId.get(product.id);
  if (!entry || normalize(product.language) !== normalize(entry.language)
    || normalize(product.name) !== normalize(expectedNames[entry.id])
    || normalize(product.card_type) !== normalize(entry.unit)
    || normalize(product.set_name) !== normalize(entry.expected_set)) return null;
  return entry;
}

export function enrichCatalogProduct(product, now = Date.now()) {
  const entry = getCatalogEvidence(product);
  if (!entry) return product;
  const checked = Date.parse(CATALOG_CHECKED_AT + 'T00:00:00Z');
  const expires = checked + 7 * 24 * 60 * 60 * 1000;
  const available = entry.offers.filter(item => item.availability === 'in_stock').map(item => item.amount);
  const market = entry.offers.length && now >= checked && now < expires ? {
    currency: 'GBP', checked_at: CATALOG_CHECKED_AT, expires_at: new Date(expires).toISOString(),
    low: available.length ? Math.min(...available) : null,
    high: available.length ? Math.max(...available) : null,
    offers: entry.offers
  } : null;
  const photos = [...entry.photos];
  // Keep the current inventory image first, so later admin photo edits take effect.
  if (product.image_url && !photos.some(item => item.url === product.image_url)) {
    photos.unshift(photo(product.image_url, 'Catalog image', 'Fuji Card', null));
  }
  return {
    ...product, photo_gallery: photos,
    catalog_reference: {
      name: entry.name, set: entry.set, language: entry.language, unit: entry.unit,
      packs_per_box: entry.packs_per_box, cards_per_pack: entry.cards_per_pack,
      checked_at: CATALOG_CHECKED_AT
    },
    market_reference: market
  };
}
