import test from 'node:test';
import assert from 'node:assert/strict';
import { changeCatalogFilter, activeCatalogFilters, catalogPageLinks, facetChoices,
  catalogPriceCeiling, catalogPriceRange, changeCatalogPrices } from '../src/utils/catalogFilters.js';

test('URL filters reset the page and clear set-specific choices when changing games', () => {
  const current = new URLSearchParams('category=pokemon&set=SV2a&rarity=SAR&cardType=Booster+Box&language=Japanese&inStock=true&page=8');
  const next = changeCatalogFilter(current, 'category', 'onepiece');
  assert.equal(next.get('page'), '1');
  assert.equal(next.get('category'), 'onepiece');
  for (const key of ['set', 'rarity', 'cardType']) assert.equal(next.has(key), false);
  assert.equal(next.get('language'), 'Japanese');
  assert.equal(next.get('inStock'), 'true');
  assert.equal(current.get('page'), '8');
});

test('removing a chip preserves other filter values and excludes sort/page from chips', () => {
  const params = new URLSearchParams('category=pokemon&language=Japanese&condition=NM&inStock=true&sort=price_asc&page=4');
  const removed = changeCatalogFilter(params, 'language', '');
  assert.equal(removed.get('condition'), 'NM');
  assert.equal(removed.get('page'), '1');
  assert.equal(removed.has('language'), false);
  assert.deepEqual(activeCatalogFilters(params).map(filter => filter.key), ['category', 'language', 'condition', 'inStock']);
  assert.deepEqual(facetChoices(['English'], 'Japanese'), ['Japanese', 'English']);
});

test('GBP price filtering covers products over £2000 without losing the upper bound', () => {
  const params = new URLSearchParams('page=12&maxPrice=3997');
  const ceiling = catalogPriceCeiling({ priceCeiling: 4000 }, params);
  assert.equal(ceiling, 4000);
  assert.deepEqual(catalogPriceRange(params, ceiling), { min: 0, max: 3997 });
  const selected = changeCatalogPrices(params, { min: 2100, max: 3997 }, ceiling);
  assert.equal(selected.get('minPrice'), '2100');
  assert.equal(selected.get('maxPrice'), '3997');
  assert.equal(selected.get('page'), '1');
  assert.equal(changeCatalogPrices(selected, { min: 0, max: ceiling }, ceiling).has('maxPrice'), false);
  assert.deepEqual(catalogPriceRange(new URLSearchParams('minPrice=bad&maxPrice=-5'), ceiling), { min: 0, max: 0 });
});

test('large catalogs keep the first, current neighbors and last page reachable', () => {
  assert.deepEqual(catalogPageLinks(12, 23), [1, 11, 12, 13, 23]);
  assert.deepEqual(catalogPageLinks(1, 2), [1, 2]);
  assert.deepEqual(catalogPageLinks(1, 0), []);
});
