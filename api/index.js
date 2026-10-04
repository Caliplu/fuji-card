import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import categoryRoutes from './routes/categories.js';
import adminRoutes from './routes/admin.js';
import { supabase } from './config/supabase.js';
import { COUNTRIES, CURRENCIES, BASE_CURRENCY } from '../shared/markets.js';

console.log('Backend starting up...');
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Reflect request origin to allow all dynamically
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

// Country/currency metadata only. Customers fetch conversion rates directly from the provider.
app.get('/api/currencies', (req, res) => {
  res.json({ base: BASE_CURRENCY, rates: { GBP: 1 }, currencies: CURRENCIES.map(item => item.code),
    currencyDetails: CURRENCIES, countries: COUNTRIES,
    conversion: { url: 'https://open.er-api.com/v6/latest/GBP', attribution: 'https://www.exchangerate-api.com',
      estimatesOnly: true }, checkoutCurrency: BASE_CURRENCY });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fuji Card API is running' });
});

// Readiness includes the catalog dependency; health above only checks the process.
app.get('/api/ready', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!supabase) return res.status(503).json({ status: 'unavailable', catalog: 'unavailable' });

  try {
    const { data, error } = await supabase.from('products')
      .select('id, categories!inner(id)').limit(1);
    if (error) throw error;
    if (!data?.length) return res.status(503).json({ status: 'unavailable', catalog: 'empty' });
    res.json({ status: 'OK', catalog: 'OK' });
  } catch (error) {
    console.error('Catalog readiness error:', error);
    res.status(503).json({ status: 'unavailable', catalog: 'unavailable' });
  }
});


// Export the app for Vercel
export default app;

// Only listen if not running in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
