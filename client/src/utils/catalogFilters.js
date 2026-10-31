export const CATALOG_PAGE_SIZE = 24;
export const CATALOG_CATEGORIES = {
  pokemon: 'Pokémon TCG', onepiece: 'One Piece Card Game', yugioh: 'Yu-Gi-Oh! OCG/TCG',
  accessories: 'Accessories', other: 'Other collectibles'
};
const typeLabels = { booster: 'Booster products', sealed: 'Sealed products', special: 'Special products', promo: 'Promos',
  weiss: 'Weiss Schwarz', union: 'Union Arena', hololive: 'Hololive', lycee: 'Lycee', gundam: 'Gundam',
  dragonball: 'Dragon Ball', disney: 'Disney', mtg: 'Magic: The Gathering' };

export function changeCatalogFilter(params, key, value) {
  const next = new URLSearchParams(params);
  if (value !== '' && value !== null && value !== undefined && value !== false) next.set(key, String(value));
  else next.delete(key);
  // Set-specific choices should not hide every item after switching to another game.
  if (key === 'category' && next.get('category') && next.get('category') !== params.get('category')) {
    next.delete('set'); next.delete('rarity'); next.delete('cardType');
  }
  next.set('page', '1');
  return next;
}

export function activeCatalogFilters(params) {
  const labels = {
    category: value => CATALOG_CATEGORIES[value] || value,
    search: value => `Search: “${value}”`, type: value => typeLabels[value] || value,
    cardType: value => `Product: ${value}`, language: value => value, set: value => `Set: ${value}`,
    condition: value => `Condition: ${value}`, rarity: value => `Rarity: ${value}`,
    minPrice: value => `Min £${value}`, maxPrice: value => `Max £${value}`,
    inStock: value => value === 'true' ? 'In stock only' : null,
    featured: value => value === 'true' ? 'Featured' : null
  };
  return Object.entries(labels).flatMap(([key, label]) => {
    const value = params.get(key);
    const text = value ? label(value) : null;
    return text ? [{ key, label: text }] : [];
  });
}

export function catalogPageLinks(currentPage, totalPages) {
  const candidates = [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
  return [...new Set(candidates.filter(page => page >= 1 && page <= totalPages))].sort((a, b) => a - b);
}

export function facetChoices(values = [], selected = '') {
  return selected && !values.includes(selected) ? [selected, ...values] : values;
}

export function catalogPriceCeiling(options, params) {
  const numbers = [options?.priceCeiling, params.get('minPrice'), params.get('maxPrice')]
    .map(Number).filter(Number.isFinite);
  return Math.max(2000, ...numbers);
}

export function catalogPriceRange(params, ceiling) {
  const amount = (key, fallback) => {
    const value = params.get(key);
    return value !== null && Number.isFinite(Number(value)) ? Math.max(0, Math.min(ceiling, Number(value))) : fallback;
  };
  const min = amount('minPrice', 0);
  return { min, max: Math.max(min, amount('maxPrice', ceiling)) };
}

export function changeCatalogPrices(params, range, ceiling) {
  const next = new URLSearchParams(params);
  if (range.min > 0) next.set('minPrice', String(range.min)); else next.delete('minPrice');
  if (range.max < ceiling) next.set('maxPrice', String(range.max)); else next.delete('maxPrice');
  next.set('page', '1');
  return next;
}
