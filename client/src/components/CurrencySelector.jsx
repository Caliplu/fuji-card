import { useEffect, useId, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import './CurrencySelector.css';

const CurrencySelector = ({ compact = false }) => {
  const { country, countryName, countries, selectedCurrency, currencies, setCountry, setCurrency,
    rateStatus, rateUpdatedAt } = useCurrency();
  const id = useId();
  const details = useRef(null);
  useEffect(() => {
    const closeOutside = event => {
      if (details.current.open && !details.current.contains(event.target)) details.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  const date = rateUpdatedAt ? new Date(rateUpdatedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC'
  }) : null;
  const statusText = {
    base: 'Prices are in GBP.', ready: `Daily estimates · rates updated ${date} (UTC).`,
    loading: 'Loading exchange rates. GBP prices are shown meanwhile.',
    unsupported: `An exchange rate for ${selectedCurrency} is unavailable. GBP prices are shown.`,
    unavailable: 'Current exchange rates are unavailable. GBP prices are shown.'
  }[rateStatus];

  const close = () => {
    details.current.open = false;
    details.current.querySelector('summary').focus();
  };

  return (
    <div className={`market-selector ${compact ? 'market-selector-compact' : ''}`}>
      <details ref={details} onKeyDown={event => { if (event.key === 'Escape') close(); }}>
        <summary aria-label={`Choose country and currency. ${countryName}, ${selectedCurrency}`}>
          <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c6 5 6 13 0 18M12 3c-6 5-6 13 0 18" />
          </svg>
          <span>{compact ? country : countryName} · {selectedCurrency}</span><span aria-hidden="true">⌄</span>
        </summary>
        <div className="market-selector-panel">
          <div className="market-selector-heading"><strong>Country & currency</strong>
            <button type="button" onClick={close} aria-label="Close country and currency choices">×</button></div>
          <label htmlFor={`${id}-country`}>Country or territory</label>
          <select id={`${id}-country`} value={country} onChange={event => setCountry(event.target.value)}>
            {countries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
          <label htmlFor={`${id}-currency`}>Display currency</label>
          <select id={`${id}-currency`} value={selectedCurrency} onChange={event => setCurrency(event.target.value)}>
            {currencies.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}
          </select>
          <p role="status">{statusText}</p>
          <p>Converted prices marked ≈ are estimates. Order requests use GBP; the store confirms shipping and the final amount.</p>
          <p>Your delivery address is saved separately in your account.</p>
          <button type="button" className="market-selector-done" onClick={close}>Done</button>
        </div>
      </details>
      {selectedCurrency !== 'GBP' && <a className="market-rate-credit" href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">
        Rates By Exchange Rate API{date ? ` · ${date}` : ''}
      </a>}
    </div>
  );
};

export default CurrencySelector;
