const facetColumns = { language: 'language', set: 'set_name', rarity: 'rarity', condition: 'condition', cardType: 'card_type' };

export function applyCatalogFacets(query, filters) {
  for (const [key, column] of Object.entries(facetColumns)) {
    if (typeof filters[key] === 'string' && filters[key]) query = query.eq(column, filters[key]);
  }
  if (filters.inStock === 'true') query = query.gt('stock', 0);
  return query;
}

export function catalogFilterOptions(rows) {
  const values = key => [...new Set(rows.map(row => row[key]).filter(value => typeof value === 'string' && value))]
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const highestPrice = rows.reduce((highest, row) => {
    const price = Number(row.price);
    return Number.isFinite(price) ? Math.max(highest, price) : highest;
  }, 0);
  return {
    rarities: values('rarity'), conditions: values('condition'), languages: values('language'),
    sets: values('set_name'), cardTypes: values('card_type'),
    priceCeiling: Math.max(2000, Math.ceil(highestPrice / 100) * 100)
  };
}
