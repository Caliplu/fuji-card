import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { RATE_CACHE_KEY, PREFERENCE_KEY } from '../src/utils/currency.js';

test('rendered selectors, prices and order records preserve international currency meanings', async () => {
  const savedWindow = globalThis.window;
  const storage = new Map();
  const seconds = Math.floor(Date.now() / 1000);
  storage.set(PREFERENCE_KEY, JSON.stringify({ country: 'CM', currency: 'XAF' }));
  storage.set(RATE_CACHE_KEY, JSON.stringify({ result: 'success', base_code: 'GBP',
    time_last_update_unix: seconds - 120, time_next_update_unix: seconds + 86400, rates: { GBP: 1, XAF: 800 } }));
  globalThis.window = { location: { hostname: 'localhost' },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) } };
  globalThis.__fujiTestUser = { firstName: 'Test', lastName: 'Customer', email: 'test@example.invalid', phone: '+237000000000',
    address: 'Example street', city: 'Douala', country: 'Cameroon', postcode: '' };
  const product = { id: 'test-box', name: 'Japanese booster box', price: 10, stock: 4, language: 'Japanese',
    category: 'pokemon', card_type: 'Booster Box', image_url: '/example.webp' };
  globalThis.__fujiTestCart = { items: [{ id: 'test-line', product, quantity: 2 }], itemCount: 2, subtotal: '20.00' };
  const fixtures = {
    name: 'test-store-fixtures',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('/context/AuthContext.jsx')) return 'export const useAuth = () => ({ user: globalThis.__fujiTestUser, isAuthenticated: true, loading: false, logout() {}, updateProfile() {} });';
      if (id.endsWith('/context/CartContext.jsx')) return 'export const useCart = () => ({ cart: globalThis.__fujiTestCart, loading: false, addToCart() {}, updateQuantity() {}, removeFromCart() {}, clearCart() {}, refreshCart() {} });';
    }
  };
  // Middleware mode does not listen on an HTTP port. This checks markup, not browser behavior.
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false,
    plugins: [fixtures, react()], server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
  try {
    const { CurrencyProvider } = await server.ssrLoadModule('/src/context/CurrencyContext.jsx');
    const render = async (path, props = {}, route = '/') => {
      const { default: Component } = await server.ssrLoadModule(path);
      return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] },
        React.createElement(CurrencyProvider, null, React.createElement(Component, props))));
    };
    const selector = await render('/src/components/CurrencySelector.jsx');
    assert.equal((selector.match(/<option/g) || []).length, 402);
    assert.match(selector, /Cameroon/);
    assert.match(selector, /value="XAF" selected/);
    assert.match(selector, /Rates By Exchange Rate API/);
    const card = await render('/src/components/ProductCard.jsx', { product });
    assert.match(card, /≈ XAF.*8,000/);
    assert.doesNotMatch(card, /<a[^>]*>[\s\S]*?<button[\s\S]*?<\/a>/);
    assert.match(card, /aria-label="Add Japanese booster box to cart"/);
    const market = await render('/src/components/MarketReference.jsx', { compact: true, reference: {
      currency: 'GBP', low: 15, high: 15, checked_at: new Date().toISOString().slice(0, 10),
      expires_at: new Date(Date.now() + 86400000).toISOString() } });
    assert.match(market, /UK retailer prices £15\.00/);
    assert.doesNotMatch(market, /≈ XAF/);
    const cart = await render('/src/pages/Cart.jsx');
    const checkout = await render('/src/pages/Checkout.jsx');
    for (const markup of [cart, checkout]) {
      assert.match(markup, /≈ XAF.*16,000/);
      assert.match(markup, /Items subtotal in GBP: £20\.00/);
    }
    const account = await render('/src/pages/Account.jsx', {}, '/account?tab=profile');
    assert.equal((account.match(/<option/g) || []).length, 249);
    assert.match(account, /value="Cameroon" selected/);
    assert.match(account, /profile-postcode/);
    assert.doesNotMatch(account.match(/<input[^>]*id="profile-postcode"[^>]*>/)[0], /required/);
    const confirmation = await render('/src/pages/OrderConfirmation.jsx', {},
      { pathname: '/order-confirmation', state: { order: { id: 'test-order', total: 20, currency: 'GBP', status: 'pending' } } });
    assert.match(confirmation, /£20\.00/);
    assert.doesNotMatch(confirmation, /≈ XAF/);
  } finally {
    await server.close();
    if (savedWindow === undefined) delete globalThis.window;
    else globalThis.window = savedWindow;
    delete globalThis.__fujiTestUser;
    delete globalThis.__fujiTestCart;
  }
});
