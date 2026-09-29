// One-time catalog import for NEW_PROJECT_SCHEMA.sql.
// Requires SUPABASE_URL and server-only SUPABASE_SECRET_KEY in the environment.
// Existing product rows are left unchanged so a repeat run does not reset stock.
import { supabase } from '../config/supabase.js';
import { products } from '../data/store.js';

if (!supabase) throw new Error('Server-side Supabase credentials are required');

const { data: categories, error: categoryError } = await supabase
  .from('categories').select('id, name');
if (categoryError) throw categoryError;
const categoryByName = new Map(categories.map(({ id, name }) => [name, id]));

const catalog = products.map((product) => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  price: product.price,
  image_url: product.image || null,
  category_id: categoryByName.get(product.category) || null,
  card_type: product.cardType || null,
  set_name: product.set || null,
  rarity: product.rarity || null,
  condition: product.condition || null,
  language: product.language || null,
  stock: Number.isSafeInteger(product.stock) ? product.stock : 0,
  featured: Boolean(product.featured)
}));

for (let offset = 0; offset < catalog.length; offset += 100) {
  const { error } = await supabase.from('products')
    .upsert(catalog.slice(offset, offset + 100), {
      onConflict: 'id',
      ignoreDuplicates: true
    });
  if (error) throw new Error(`Catalog import failed at item ${offset + 1}: ${error.message}`);
}

console.log(`Checked ${catalog.length} bundled products; existing rows were not changed.`);
