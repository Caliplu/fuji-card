import { BASE_CURRENCY, COUNTRY_BY_CODE, CURRENCY_BY_CODE } from '../../../shared/markets.js';

export const RATE_URL = 'https://open.er-api.com/v6/latest/GBP';
export const RATE_CACHE_KEY = 'fuji-card-exchange-rates-v1';
export const PREFERENCE_KEY = 'fuji-card-market-v1';
export const MAX_RATE_AGE = 36 * 60 * 60 * 1000;
export const DEFAULT_MARKET = { country: 'GB', currency: BASE_CURRENCY };

export function readStoredJSON(key, storage) {
  try { return JSON.parse(storage?.getItem(key) || 'null'); }
  catch { return null; }
}

export function writeStoredJSON(key, value, storage) {
  try { storage?.setItem(key, JSON.stringify(value)); }
  catch { /* Private browsing or a full cache must not prevent shopping. */ }
}

export function normalizeMarket(value) {
  const country = typeof value?.country === 'string' && COUNTRY_BY_CODE[value.country] ? value.country : DEFAULT_MARKET.country;
  const currency = typeof value?.currency === 'string' && CURRENCY_BY_CODE[value.currency] ? value.currency : BASE_CURRENCY;
  return { country, currency };
}

export function marketForCountry(code) {
  const country = COUNTRY_BY_CODE[code];
  return country ? { country: code, currency: country.currencies[0] || BASE_CURRENCY } : DEFAULT_MARKET;
}

export function isFreshQuote(quote, now = Date.now()) {
  return !!quote && Number.isFinite(quote.updatedAt) && quote.updatedAt <= now + 5 * 60 * 1000 &&
    now - quote.updatedAt < MAX_RATE_AGE;
}

export function validateRateQuote(payload, now = Date.now()) {
  if (payload?.result !== 'success' || payload.base_code !== BASE_CURRENCY || payload.rates?.GBP !== 1) return null;
  const updatedAt = Number(payload.time_last_update_unix) * 1000;
  const nextUpdateAt = Number(payload.time_next_update_unix) * 1000;
  if (!isFreshQuote({ updatedAt }, now) || !Number.isFinite(nextUpdateAt) || nextUpdateAt <= updatedAt ||
      nextUpdateAt - updatedAt > 48 * 60 * 60 * 1000) return null;
  const rates = {};
  for (const [code, rate] of Object.entries(payload.rates)) {
    if (!CURRENCY_BY_CODE[code]) continue;
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
    rates[code] = rate;
  }
  return { rates, updatedAt, nextUpdateAt };
}

const formatters = new Map();
export function formatMoney(amount, currency = BASE_CURRENCY) {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : BASE_CURRENCY;
  if (!formatters.has(code)) {
    const digits = CURRENCY_BY_CODE[code]?.digits;
    formatters.set(code, new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: code, currencyDisplay: code === BASE_CURRENCY ? 'symbol' : 'code',
      ...(digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits })
    }));
  }
  const value = Number(amount);
  return formatters.get(code).format(Number.isFinite(value) ? value : 0);
}

export function displayedCurrency(selected, quote, now = Date.now()) {
  return CURRENCY_BY_CODE[selected] && isFreshQuote(quote, now) && quote.rates[selected] > 0 ? selected : BASE_CURRENCY;
}

export function formatCatalogPrice(amountInGBP, selected, quote, now = Date.now()) {
  const currency = displayedCurrency(selected, quote, now);
  const amount = Number(amountInGBP) || 0;
  return currency === BASE_CURRENCY ? formatMoney(amount) : `≈ ${formatMoney(amount * quote.rates[currency], currency)}`;
}
