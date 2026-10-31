import { useCurrency } from '../context/CurrencyContext';
import './CurrencySelector.css';

const CurrencyNotice = ({ subtotal }) => {
  const { formatBasePrice, selectedCurrency, isConverted, rateUpdatedAt } = useCurrency();
  return (
    <p className="currency-notice">
      <strong>Items subtotal in GBP: {formatBasePrice(subtotal)}</strong>
      {isConverted ? `${selectedCurrency} prices are estimates. ` : selectedCurrency !== 'GBP' ? 'GBP is shown while an exchange rate is unavailable. ' : ''}
      Order requests use GBP. Shipping and the final amount are confirmed by the store.
      {isConverted && <><br />Rates updated {new Date(rateUpdatedAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })} (UTC).{' '}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Rates By Exchange Rate API</a>.</>}
    </p>
  );
};

export default CurrencyNotice;
