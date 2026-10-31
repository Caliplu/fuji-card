import express from 'express';
import { supabase } from '../config/supabase.js';
import { CURATED_PRODUCT_IDS, enrichCatalogProduct, getCatalogEvidence } from '../data/catalog-evidence.js';
import { applyCatalogFacets, catalogFilterOptions } from '../utils/catalog-filters.js';

const router = express.Router();
const typeTerms = {
  booster: { name: ['booster'], description: ['booster'] },
  special: { name: ['special', 'high class'], description: ['special'] },
  promo: { name: ['promo'], description: ['promo'] },
  sealed: { name: ['sealed', 'case'], description: ['sealed'] },
  weiss: { name: ['weiss'], description: ['weiss'] },
  union: { name: ['union'], description: ['union'] },
  hololive: { name: ['hololive'], description: ['hololive'] },
  lycee: { name: ['lycee'], description: ['lycee'] },
  gundam: { name: ['gundam'], description: ['gundam'] },
  dragonball: { name: ['dragon ball', 'fusion'], description: ['dragon ball'] },
  disney: { name: ['lorcana', 'disney'], description: ['lorcana', 'disney'] },
  mtg: { name: ['magic', 'mtg'], description: ['magic', 'mtg'] }
};
const toStoreProduct = (product) => ({
  ...enrichCatalogProduct(product),
  category: product.categories?.name || 'other',
  image: product.image_url,
  set: product.set_name,
  cardType: product.card_type,
  originalPrice: product.original_price
});

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!supabase) return res.status(503).json({ error: 'Product catalog temporarily unavailable' });
  next();
});

// This route must precede /:id.
router.get('/highlights', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products')
      .select('*, categories(id, name)').in('id', CURATED_PRODUCT_IDS);
    if (error) throw error;
    const products = (data || []).filter(getCatalogEvidence)
      .sort((a, b) => CURATED_PRODUCT_IDS.indexOf(a.id) - CURATED_PRODUCT_IDS.indexOf(b.id));
    res.json({ products: products.map(toStoreProduct) });
  } catch (error) {
    console.error('Product highlights error:', error);
    res.status(503).json({ error: 'Product highlights temporarily unavailable' });
  }
});

router.get('/filters/options', async (req, res) => {
  try {
    let query = supabase.from('products')
      .select('rarity, condition, language, set_name, card_type, price, categories!inner(name)');
    if (req.query.category) query = query.eq('categories.name', req.query.category);
    const { data, error } = await query;
    if (error) throw error;
    res.json(catalogFilterOptions(data || []));
  } catch (error) {
    console.error('Product filters error:', error);
    res.status(503).json({ error: 'Product filters temporarily unavailable' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, search, type, minPrice, maxPrice, sort, featured } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    let query = supabase.from('products')
      .select('*, categories!inner(id, name)', { count: 'exact' });

    if (category) query = query.eq('categories.name', category);
    // PostgREST's raw `or` syntax needs its delimiters removed from user input.
    const safeSearch = typeof search === 'string'
      ? search.replace(/[(),.%*\\]/g, ' ').trim().slice(0, 100)
      : '';
    const searchFilter = safeSearch
      ? ['name', 'description', 'set_name'].map(field => `${field}.ilike.%${safeSearch}%`).join(',')
      : '';
    const terms = typeof type === 'string' && Object.hasOwn(typeTerms, type) ? typeTerms[type] : null;
    const typeFilter = terms
      ? Object.entries(terms).flatMap(([field, words]) => words.map(word => `${field}.ilike.%${word}%`)).join(',')
      : '';
    if (searchFilter && typeFilter) query = query.or(`and(or(${searchFilter}),or(${typeFilter}))`);
    else if (searchFilter || typeFilter) query = query.or(searchFilter || typeFilter);
    if (minPrice && Number.isFinite(Number(minPrice))) query = query.gte('price', Number(minPrice));
    if (maxPrice && Number.isFinite(Number(maxPrice))) query = query.lte('price', Number(maxPrice));
    query = applyCatalogFacets(query, req.query);
    if (featured === 'true') query = query.eq('featured', true);

    const sortColumns = {
      price_asc: ['price', true], price_desc: ['price', false],
      name_asc: ['name', true], name_desc: ['name', false]
    };
    const [column, ascending] = sortColumns[sort] || ['created_at', false];
    query = query.order(column, { ascending }).order('id', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / limit);
    res.json({ products: data.map(toStoreProduct), pagination: {
      currentPage: page, totalPages, totalProducts, hasMore: page < totalPages
    } });
  } catch (error) {
    console.error('Products error:', error);
    res.status(503).json({ error: 'Product catalog temporarily unavailable' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: product, error } = await supabase.from('products')
      .select('*, categories(id, name, description, image_url)')
      .eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { data: related, error: relatedError } = await supabase.from('products')
      .select('*, categories(id, name)').eq('category_id', product.category_id)
      .neq('id', product.id).limit(4);
    if (relatedError) throw relatedError;
    res.json({ product: toStoreProduct(product), related: related.map(toStoreProduct) });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(503).json({ error: 'Product temporarily unavailable' });
  }
});

export default router;
