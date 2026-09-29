import { useCurrency } from '../context/CurrencyContext';
import './CurrencySelector.css';

const CurrencySelector = () => {
  const { getLabel } = useCurrency();

  return (
    <div className="currency-dropdown-wrapper">
      <div className="currency-selector-box" aria-label="Prices in GBP">
        <span className="current-currency-label">{getLabel()}</span>
      </div>
    </div>
  );
};

export default CurrencySelector;
