import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();
const toStoreProduct = (product) => ({
  ...product,
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
router.get('/filters/options', async (req, res) => {
  try {
    let query = supabase.from('products')
      .select('rarity, condition, language, set_name, categories!inner(name)');
    if (req.query.category) query = query.eq('categories.name', req.query.category);
    const { data, error } = await query;
    if (error) throw error;
    const values = (key) => [...new Set(data.map(p => p[key]).filter(Boolean))];
    res.json({ rarities: values('rarity'), conditions: values('condition'),
      languages: values('language'), sets: values('set_name') });
  } catch (error) {
    console.error('Product filters error:', error);
    res.status(503).json({ error: 'Product filters temporarily unavailable' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, rarity, condition,
      language, set, sort, featured } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    let query = supabase.from('products')
      .select('*, categories!inner(id, name)', { count: 'exact' });

    if (category) query = query.eq('categories.name', category);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (minPrice && Number.isFinite(Number(minPrice))) query = query.gte('price', Number(minPrice));
    if (maxPrice && Number.isFinite(Number(maxPrice))) query = query.lte('price', Number(maxPrice));
    if (rarity) query = query.eq('rarity', rarity);
    if (condition) query = query.eq('condition', condition);
    if (language) query = query.eq('language', language);
    if (set) query = query.eq('set_name', set);
    if (featured === 'true') query = query.eq('featured', true);

    const sortColumns = {
      price_asc: ['price', true], price_desc: ['price', false],
      name_asc: ['name', true], name_desc: ['name', false]
    };
    const [column, ascending] = sortColumns[sort] || ['created_at', false];
    query = query.order(column, { ascending })
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
