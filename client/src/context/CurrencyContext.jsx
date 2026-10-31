import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { COUNTRIES, CURRENCIES, COUNTRY_BY_CODE, CURRENCY_BY_CODE, BASE_CURRENCY } from '../../../shared/markets.js';
import {
  RATE_URL, RATE_CACHE_KEY, PREFERENCE_KEY, normalizeMarket, marketForCountry,
  readStoredJSON, writeStoredJSON, validateRateQuote, isFreshQuote,
  displayedCurrency, formatCatalogPrice, formatMoney
} from '../utils/currency.js';

const CurrencyContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components -- Shared context hook.
export const useCurrency = () => useContext(CurrencyContext);

function browserStorage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch { return undefined; }
}

export const CurrencyProvider = ({ children }) => {
  const [market, setMarket] = useState(() => normalizeMarket(readStoredJSON(PREFERENCE_KEY, browserStorage())));
  const [rateState, setRateState] = useState(() => ({
    quote: validateRateQuote(readStoredJSON(RATE_CACHE_KEY, browserStorage())), pending: false
  }));
  const [now, setNow] = useState(Date.now);
  const wantsConversion = market.currency !== BASE_CURRENCY;

  useEffect(() => {
    writeStoredJSON(PREFERENCE_KEY, market, browserStorage());
  }, [market]);

  useEffect(() => {
    if (!wantsConversion) return;
    let disposed = false;
    let controller;
    let inFlight = false;
    let lastAttempt = 0;
    let quote = validateRateQuote(readStoredJSON(RATE_CACHE_KEY, browserStorage()));

    const refresh = async () => {
      const currentTime = Date.now();
      if (disposed || inFlight || currentTime - lastAttempt < 60 * 60 * 1000 ||
          (isFreshQuote(quote, currentTime) && quote.nextUpdateAt > currentTime)) return;
      // Let StrictMode clean up before starting a network request.
      await Promise.resolve();
      if (disposed) return;
      inFlight = true;
      lastAttempt = currentTime;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      setRateState(previous => ({ ...previous, pending: true }));
      try {
        // Fetch directly from the provider; do not redistribute its rates through our API.
        const response = await fetch(RATE_URL, { signal: controller.signal });
        if (!response.ok) throw new Error('Rates unavailable');
        const payload = await response.json();
        const nextQuote = validateRateQuote(payload);
        if (!nextQuote) throw new Error('Invalid or expired rates');
        if (disposed) return;
        quote = nextQuote;
        writeStoredJSON(RATE_CACHE_KEY, payload, browserStorage());
        setNow(Date.now());
        setRateState({ quote, pending: false });
      } catch {
        if (!disposed) {
          setNow(Date.now());
          setRateState(previous => ({ ...previous, pending: false }));
        }
      } finally {
        window.clearTimeout(timeout);
        inFlight = false;
      }
    };
    const checkRates = () => {
      setNow(Date.now());
      if (document.visibilityState !== 'hidden') void refresh();
    };
    void refresh();
    const timer = window.setInterval(checkRates, 60000);
    document.addEventListener('visibilitychange', checkRates);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', checkRates);
    };
  }, [wantsConversion]);

  const value = useMemo(() => {
    const { quote, pending } = rateState;
    const currency = displayedCurrency(market.currency, quote, now);
    const rateStatus = !wantsConversion ? 'base' : currency !== BASE_CURRENCY ? 'ready' : pending ? 'loading' :
      isFreshQuote(quote, now) ? 'unsupported' : 'unavailable';
    return {
      currency, selectedCurrency: market.currency, country: market.country,
      countryName: COUNTRY_BY_CODE[market.country].name, countries: COUNTRIES, currencies: CURRENCIES,
      rateStatus, rateUpdatedAt: isFreshQuote(quote, now) ? quote.updatedAt : null,
      isConverted: currency !== BASE_CURRENCY,
      setCountry: code => {
        setNow(Date.now());
        setMarket(marketForCountry(code));
      },
      setCurrency: code => {
        if (CURRENCY_BY_CODE[code]) {
          setNow(Date.now());
          setMarket(previous => ({ ...previous, currency: code }));
        }
      },
      formatPrice: amount => formatCatalogPrice(amount, market.currency, quote, now),
      formatBasePrice: amount => formatMoney(amount),
      formatOrderPrice: (amount, code = BASE_CURRENCY) => formatMoney(amount, code)
    };
  }, [market, rateState, now, wantsConversion]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
