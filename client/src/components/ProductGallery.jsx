import { useState } from 'react';
import './ProductGallery.css';

const ProductGallery = ({ product }) => {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState([]);
  const photos = product.photo_gallery?.length ? product.photo_gallery : [{
    url: product.image || product.image_url || '/logo.png', label: 'Product image'
  }];
  const active = photos[selected] || photos[0];
  const hasFailed = failed.includes(active.url);
  const markFailed = url => setFailed(previous => previous.includes(url) ? previous : [...previous, url]);

  return (
    <div className="product-gallery">
      <div className="main-image">
        <img key={active.url} src={hasFailed ? '/logo.png' : active.url}
          alt={hasFailed ? `${product.name} — image unavailable` : `${product.name} — ${active.label}`}
          width="700" height="700" decoding="async" onError={() => markFailed(active.url)} />
        {product.stock <= 3 && product.stock > 0 && <span className="stock-badge low">Only {product.stock} left!</span>}
        {product.featured && <span className="featured-badge">Featured</span>}
      </div>
      {photos.length > 1 && (
        <div className="product-gallery-thumbnails" aria-label="Product photos">
          {photos.map((item, index) => (
            <button key={item.url} type="button" aria-label={`View ${item.label}`}
              aria-pressed={index === selected} onClick={() => setSelected(index)}>
              <img src={failed.includes(item.url) ? '/logo.png' : item.url} alt={item.label}
                width="80" height="80" loading="lazy" decoding="async" onError={() => markFailed(item.url)} />
            </button>
          ))}
        </div>
      )}
      <div className="product-gallery-caption" aria-live="polite">
        <span>{hasFailed ? 'This photo is temporarily unavailable.' : active.label}</span>
        {active.source_url && <a href={active.source_url} target="_blank" rel="noopener noreferrer">Photo source: {active.source} ↗</a>}
        {!hasFailed && <a className="product-gallery-enlarge" href={active.url} target="_blank" rel="noopener noreferrer">Open full photo ↗</a>}
      </div>
      {product.catalog_reference && <p className="product-gallery-note">Catalog reference photos for this Japanese edition. These are not photographs of the individual item you will receive.</p>}
    </div>
  );
};

export default ProductGallery;
