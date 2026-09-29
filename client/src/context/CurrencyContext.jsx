import { createContext, useContext } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

// Catalog, order minimum, and API checkout amounts are denominated in GBP.
// Do not display static exchange conversions as customer-facing prices.
const currencyMap = {
  GBP: { symbol: '£', label: '🇬🇧 GB £ GBP', rate: 1 }
};

export const CurrencyProvider = ({ children }) => {
  const convertPrice = (priceInGBP) => Number(priceInGBP || 0).toFixed(2);
  const formatPrice = (priceInGBP) => `£${convertPrice(priceInGBP)}`;

  return (
    <CurrencyContext.Provider value={{
      currency: 'GBP',
      currencies: ['GBP'],
      currencyMap,
      convertPrice,
      formatPrice,
      getSymbol: () => '£',
      getLabel: () => currencyMap.GBP.label
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
