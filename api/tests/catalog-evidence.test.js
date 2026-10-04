import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogEvidence, enrichCatalogProduct, getCatalogEvidence } from '../data/catalog-evidence.js';

const now = Date.parse('2026-10-04T12:00:00Z');
const pokemon151 = {
  id: 'pk-151-bb', name: 'Pokemon Card 151 Booster Box Japanese', set_name: 'SV2a',
  language: 'Japanese', card_type: 'Booster Box', price: 145, stock: 10,
  image_url: catalogEvidence.find(entry => entry.id === 'pk-151-bb').photos[0].url
};

test('sold-out offers stay visible as references but do not lower the available price', () => {
  const result = enrichCatalogProduct(pokemon151, now);
  assert.equal(result.market_reference.low, 299.99);
  assert.equal(result.market_reference.high, 299.99);
  assert.equal(result.market_reference.offers.find(item => item.seller === 'Portal TCG').availability, 'sold_out');
  assert.equal(result.price, 145);
  assert.equal(result.stock, 10);
  assert.equal(result.photo_gallery.length, 2);
});

test('price references expire while photos and exact product details remain', () => {
  const result = enrichCatalogProduct(pokemon151, Date.parse('2026-10-11T00:00:00Z'));
  assert.equal(result.market_reference, null);
  assert.equal(result.catalog_reference.packs_per_box, 20);
  assert.equal(result.photo_gallery.length, 2);
  assert.equal(enrichCatalogProduct(pokemon151, Date.parse('2026-10-03T23:59:59Z')).market_reference, null);
});

test('a changed language, product unit, name or set never inherits another variant’s references', () => {
  for (const changes of [{ language: 'English' }, { card_type: 'Booster Case' },
    { set_name: 'English 151' }, { name: 'Pokemon Card 151 Booster Pack Japanese' }, { id: 'unknown' }]) {
    const changed = { ...pokemon151, ...changes };
    assert.equal(getCatalogEvidence(changed), null);
    assert.equal(enrichCatalogProduct(changed, now), changed);
  }
});

test('coming-soon and sold-out listings do not imply an available offer', () => {
  const result = enrichCatalogProduct({
    id: 'jp-eb04-bb', name: 'EB-04 EGGHEAD CRISIS Booster Box Japanese ONE PIECE CARD',
    set_name: 'EB-04', language: 'Japanese', card_type: 'Booster Box'
  }, now);
  assert.equal(result.market_reference.low, null);
  assert.equal(result.market_reference.high, null);
  assert.equal(result.market_reference.offers.length, 2);
});

test('Ragavan and Counterspell have different matched images and no unverified GBP prices', () => {
  const counterspell = catalogEvidence.find(entry => entry.id === 'tcg-2000277120');
  const ragavan = catalogEvidence.find(entry => entry.id === 'tcg-2000286991');
  assert.notEqual(counterspell.photos[0].url, ragavan.photos[0].url);
  const result = enrichCatalogProduct({ id: ragavan.id, name: ragavan.name,
    language: 'Japanese', card_type: 'Magic: The Gathering', set_name: 'Magic: The Gathering' }, now);
  assert.equal(result.market_reference, null);
});

test('a later inventory photo edit remains the first gallery image', () => {
  const custom = { ...pokemon151, image_url: '/inventory/my-151-box.webp' };
  const result = enrichCatalogProduct(custom, now);
  assert.equal(result.photo_gallery[0].url, custom.image_url);
  assert.equal(result.photo_gallery[0].source, 'Fuji Card');
  assert.equal(new Set(result.photo_gallery.map(item => item.url)).size, result.photo_gallery.length);
});
