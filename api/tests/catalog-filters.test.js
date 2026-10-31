import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { applyCatalogFacets, catalogFilterOptions } from '../utils/catalog-filters.js';

test('facets use encoded exact matches and stock > 0 with stable pagination order', async () => {
  let requested;
  const client = createClient('https://catalog.example.invalid', 'test-only-placeholder', { global: {
    fetch: async url => {
      requested = new URL(url);
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    }
  } });
  let query = client.from('products').select('*');
  query = applyCatalogFacets(query, { language: 'Japanese', set: 'SV2a (151)', condition: 'Near Mint',
    rarity: 'SAR', cardType: 'Booster Box', inStock: 'true' });
  const result = await query.order('price', { ascending: true }).order('id', { ascending: true }).range(24, 47);
  assert.equal(result.error, null);
  assert.equal(requested.searchParams.get('set_name'), 'eq.SV2a (151)');
  assert.equal(requested.searchParams.get('language'), 'eq.Japanese');
  assert.equal(requested.searchParams.get('stock'), 'gt.0');
  assert.equal(requested.searchParams.get('condition'), 'eq.Near Mint');
  assert.equal(requested.searchParams.get('card_type'), 'eq.Booster Box');
  assert.equal(requested.searchParams.get('order'), 'price.asc,id.asc');
  assert.equal(requested.searchParams.get('offset'), '24');
  assert.equal(requested.searchParams.get('limit'), '24');
});

test('filter choices come from actual products and include the highest catalog price', () => {
  const options = catalogFilterOptions([
    { language: 'Japanese', condition: 'NM', rarity: 'SAR', set_name: 'OP-10', card_type: 'Booster Box', price: 3997 },
    { language: 'English', condition: 'NM', rarity: 'SR', set_name: 'OP-2', card_type: 'Single', price: 10 },
    { language: 'Japanese', condition: null, rarity: '', set_name: 'OP-2', price: 'bad' }
  ]);
  assert.equal(options.priceCeiling, 4000);
  assert.deepEqual(options.languages, ['English', 'Japanese']);
  assert.deepEqual(options.conditions, ['NM']);
  assert.deepEqual(options.sets, ['OP-2', 'OP-10']);
  assert.deepEqual(options.cardTypes, ['Booster Box', 'Single']);
});
