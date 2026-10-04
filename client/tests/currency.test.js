import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, CURRENCIES, COUNTRY_BY_CODE, CURRENCY_BY_CODE } from '../../shared/markets.js';
import {
  MAX_RATE_AGE, PREFERENCE_KEY, normalizeMarket, marketForCountry, validateRateQuote,
  readStoredJSON, writeStoredJSON, formatCatalogPrice, formatMoney, displayedCurrency
} from '../src/utils/currency.js';
import { buildOrderRequest } from '../src/utils/orderRequest.js';

const now = Date.parse('2026-10-04T12:00:00Z');
const fixture = () => ({ result: 'success', base_code: 'GBP',
  time_last_update_unix: now / 1000 - 120, time_next_update_unix: now / 1000 + 86400,
  rates: { GBP: 1, USD: 1.25, EUR: 1.1, XAF: 800, JPY: 200, KWD: 0.4 } });

test('all 249 ISO countries and their current tender currencies can be chosen', () => {
  assert.equal(COUNTRIES.length, 249);
  assert.equal(new Set(COUNTRIES.map(country => country.code)).size, 249);
  assert.equal(CURRENCIES.length, 153);
  assert.deepEqual(marketForCountry('CM'), { country: 'CM', currency: 'XAF' });
  assert.equal(COUNTRY_BY_CODE.BG.currencies[0], 'EUR');
  assert.equal(COUNTRY_BY_CODE.CW.currencies[0], 'XCG');
  assert.equal(COUNTRY_BY_CODE.ZW.currencies[0], 'ZWG');
  assert.equal(CURRENCY_BY_CODE.BGN, undefined);
  for (const country of COUNTRIES) {
    assert.equal(typeof country.name, 'string');
    for (const currency of country.currencies) assert.ok(CURRENCY_BY_CODE[currency]);
  }
});

test('currency preferences survive storage failures and invalid saved codes', () => {
  assert.deepEqual(normalizeMarket({ country: 'CM', currency: 'XAF' }), { country: 'CM', currency: 'XAF' });
  assert.deepEqual(normalizeMarket({ country: 'ZZ', currency: 'ZZZ' }), { country: 'GB', currency: 'GBP' });
  assert.deepEqual(normalizeMarket({ country: '__proto__', currency: 'constructor' }), { country: 'GB', currency: 'GBP' });
  assert.deepEqual(normalizeMarket({ country: ['CM'], currency: { toString: null } }), { country: 'GB', currency: 'GBP' });
  const storage = { getItem: () => '{broken', setItem: () => { throw new Error('Full'); } };
  assert.equal(readStoredJSON(PREFERENCE_KEY, storage), null);
  assert.doesNotThrow(() => writeStoredJSON(PREFERENCE_KEY, { country: 'CM' }, storage));
});

test('wrong-base, stale, future-dated and malformed rates never become prices', () => {
  assert.ok(validateRateQuote(fixture(), now));
  for (const changes of [
    { result: 'error' }, { base_code: 'USD' }, { rates: { GBP: 0.8, USD: 1 } },
    { time_last_update_unix: (now - MAX_RATE_AGE) / 1000 },
    { time_last_update_unix: now / 1000 + 600 },
    { time_next_update_unix: NaN }, { time_next_update_unix: now / 1000 - 300 },
    { rates: { GBP: 1, USD: -1 } }, { rates: { GBP: 1, USD: Infinity } }, { rates: { GBP: 1, USD: '1.25' } }
  ]) assert.equal(validateRateQuote({ ...fixture(), ...changes }, now), null);
});

test('converted estimates use correct currency minor units and retain base GBP amounts', () => {
  const quote = validateRateQuote(fixture(), now);
  assert.equal(formatCatalogPrice(10, 'USD', quote, now), '≈ USD\u00a012.50');
  assert.equal(formatCatalogPrice(10, 'JPY', quote, now), '≈ JPY\u00a02,000');
  assert.equal(formatCatalogPrice(10, 'XAF', quote, now), '≈ XAF\u00a08,000');
  assert.equal(formatCatalogPrice(10, 'KWD', quote, now), '≈ KWD\u00a04.000');
  assert.equal(formatMoney(10), '£10.00');
  assert.equal(formatMoney(10, 'USD'), 'USD\u00a010.00');
});

test('missing or expired conversion rates fall back to explicitly GBP prices', () => {
  const quote = validateRateQuote(fixture(), now);
  assert.equal(displayedCurrency('KPW', quote, now), 'GBP');
  assert.equal(formatCatalogPrice(10, 'KPW', quote, now), '£10.00');
  assert.equal(formatCatalogPrice(10, 'USD', quote, now + MAX_RATE_AGE), '£10.00');
  assert.equal(formatCatalogPrice(10, 'USD', null, now), '£10.00');
});

test('international order requests use verified GBP line totals and optional postal codes', () => {
  const message = buildOrderRequest({ firstName: 'Test', lastName: 'Customer', email: 'test@example.invalid',
    phone: '+237000000000', address: 'Example street', city: 'Douala', country: 'Cameroon', postcode: '' },
  { items: [{ product: { name: 'Japanese booster box', price: 10 }, quantity: 2 }] });
  assert.match(message, /Unit Price \(GBP\): £10\.00/);
  assert.match(message, /Line Total \(GBP\): £20\.00/);
  assert.match(message, /Listed items: £20\.00/);
  assert.match(message, /Example street, Douala, Cameroon/);
  assert.doesNotMatch(message, /USD|undefined|NaN/);
});
