import { useCurrency } from '../context/CurrencyContext';
import './MarketReference.css';

const currentMarketReference = reference => (
  reference?.currency === 'GBP' && Date.now() < Date.parse(reference.expires_at) ? reference : null
);

const MarketReference = ({ reference, compact = false }) => {
  const { formatBasePrice } = useCurrency();
  const market = currentMarketReference(reference);
  if (!market) return null;
  const range = market.low !== null
    ? (market.low === market.high ? formatBasePrice(market.low) : `${formatBasePrice(market.low)}–${formatBasePrice(market.high)}`)
    : null;
  const date = new Date(`${market.checked_at}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  if (compact) return (
    <p className="market-reference-compact">
      {range ? `UK retailer prices ${range}` : 'Retailer references available'}
      <span>Checked {date}</span>
    </p>
  );

  return (
    <section className="market-reference" aria-label="UK retailer price references">
      <div className="market-reference-heading">
        <h2>UK retailer price check</h2>
        {range && <strong>{range}</strong>}
      </div>
      <p>Same Japanese booster box. Listed prices checked {date}; delivery charges may apply.</p>
      {!range && <p>No available retailer offer in this check.</p>}
      <ul>
        {market.offers.map(item => (
          <li key={item.url}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">{item.seller} <span aria-hidden="true">↗</span></a>
            <strong>{formatBasePrice(item.amount)}</strong>
            <span className={`market-availability ${item.availability}`}>
              {item.availability === 'in_stock' ? 'Available when checked' : item.availability === 'coming_soon' ? 'Coming soon' : 'Sold out when checked'}
            </span>
          </li>
        ))}
      </ul>
      <small>Retail asking prices. The range uses available listings; prices and availability can change.</small>
    </section>
  );
};

export default MarketReference;
