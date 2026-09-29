import { useSearchParams } from 'react-router-dom';
import './Info.css';

const sources = [
  {
    name: 'Pokémon Card Game',
    description: 'Japanese product releases and the official card search.',
    links: [
      { label: 'Products and release information', url: 'https://www.pokemon-card.com/products/' },
      { label: 'Card search', url: 'https://www.pokemon-card.com/card-search/' }
    ]
  },
  {
    name: 'One Piece Card Game',
    description: 'Products and card lists from the official Bandai site.',
    links: [
      { label: 'Products', url: 'https://en.onepiece-cardgame.com/products/' },
      { label: 'Card list', url: 'https://en.onepiece-cardgame.com/cardlist/' }
    ]
  },
  {
    name: 'Yu-Gi-Oh!',
    description: 'Official Konami card database and product information.',
    links: [
      { label: 'Card database', url: 'https://www.db.yugioh-card.com/yugiohdb/TCG' },
      { label: 'Card game information', url: 'https://www.konami.com/yugioh/' }
    ]
  }
];

const Info = () => {
  const [searchParams] = useSearchParams();
  const news = searchParams.get('tab') === 'news';

  return (
    <div className="info-page">
      <div className="container">
        <div className="discovery-header">
          <h1>{news ? 'OFFICIAL TCG UPDATES' : 'OFFICIAL CARD INFORMATION'}</h1>
        </div>
        <p className="intro-text">
          Browse the publishers’ own websites for current product and card details. These external
          pages are for reference; they do not confirm Fuji Card stock, prices, or preorders.
        </p>
        {sources.map(source => (
          <section className="card-section" key={source.name}>
            <h2>{source.name}</h2>
            <p className="intro-text">{source.description}</p>
            <ul className="card-list">
              {source.links.map(link => (
                <li className="info-list-item" key={link.url}>
                  <i className="fa-solid fa-circle bullet-dot" aria-hidden="true"></i>
                  <a href={link.url} className="item-link-text" target="_blank" rel="noopener noreferrer">
                    {link.label} (official site)
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Info;
