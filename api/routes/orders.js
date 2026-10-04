import express from 'express';
import axios from 'axios';
import { supabase } from '../config/supabase.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { products as fallbackProducts } from '../data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SETTINGS MIGRATION (SUPABASE) ---
const getSetting = async (key, defaultValue) => {
    try {
        // If Supabase is not configured, return default immediately
        if (!supabase) {
            return defaultValue;
        }
        
        const { data, error } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', key)
            .single();
        if (error || !data) return defaultValue;
        return data.value;
    } catch (e) {
        console.error(`[getSetting] Error fetching ${key}:`, e.message);
        return defaultValue;
    }
};
// --- END SETTINGS MIGRATION ---

const router = express.Router();
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://www.fuji-card.com').replace(/\/$/, '');
// A storefront UI toggle is not sufficient: direct API calls must fail closed too.
const requireOrderProcessing = (req, res, next) => {
  if (process.env.ORDER_PROCESSING_ENABLED !== 'true') {
    return res.status(503).json({ error: 'Ordering is temporarily unavailable' });
  }
  next();
};
const validGuestSession = (req) => {
  const value = req.headers['x-session-id'];
  return typeof value === 'string' && /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)
    ? value : null;
};

/**
 * Generate PayFast MD5 signature.
 * CRITICAL: Values must stay RAW (not URL-encoded) inside the hash string.
 * This matches the PayFast PHP SDK exactly:
 *   foreach ($data as $key => $val) { $pfParamString .= $key .'='. urlencode(trim($val)) .'&'; }
 * urlencode in PHP converts spaces to + and encodes special chars.
 * We replicate that with encodeURIComponent(...).replace(/%20/g, '+').
 */
/**
 * Generate PayFast MD5 signature.
 * Mimics PHP urlencode perfectly by encoding special chars like !, ', (, ), *
 */
const phpUrlEncode = (str) => {
  if (typeof str !== 'string') str = String(str);
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/%20/g, '+')
    .replace(/~/g, '%7E');
};

const generatePayfastSignature = (data, passPhrase = null) => {
  // Step 1: Filter fields. ONLY include fields that PayFast expects.
  // Exclude signature and any empty/null values.
  const filtered = {};
  const validFields = [
    'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
    'name_first', 'name_last', 'email_address', 'm_payment_id', 'amount',
    'item_name', 'item_description', 'custom_str1', 'custom_str2', 
    'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int1',
    'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5', 'subscription_type',
    'billing_date', 'recurring_amount', 'frequency', 'cycles'
  ];

  Object.keys(data).forEach(key => {
    if (validFields.includes(key) && data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== '') {
      filtered[key] = String(data[key]).trim();
    }
  });

  // Step 2: Sort keys alphabetically
  const sortedKeys = Object.keys(filtered).sort();

  // Step 3: Build query string (RAW VALUES - No per-field URL encoding)
  // According to many implementations and recent PayFast docs, signature strings 
  // should use original values, while the SUBMITTED form uses url-encoded values.
  const parts = sortedKeys.map(key => `${key}=${filtered[key]}`);
  let finalString = parts.join('&');

  // Step 4: Append passphrase (RAW, NOT urlencoded)
  if (passPhrase && String(passPhrase).trim() !== '') {
     finalString += `&passphrase=${String(passPhrase).trim()}`;
  }

  const signature = crypto.createHash('md5').update(finalString).digest('hex');
  return signature;
};

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        tax,
        total,
        currency,
        shipping_address_id,
        payment_method,
        notes,
        created_at,
        updated_at,
        session_id,
        order_items (
          id,
          product_id,
          quantity,
          name,
          price,
          image_url
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format orders to match frontend expectations
    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.order_items.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image_url || ''
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        tax,
        total,
        currency,
        shipping_address_id,
        payment_method,
        notes,
        created_at,
        updated_at,
        session_id,
        order_items (
          id,
          product_id,
          quantity,
          name,
          price,
          image_url
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Format order
    const formattedOrder = {
      ...order,
      items: order.order_items.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image_url || ''
      }))
    };

    res.json({ order: formattedOrder });
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create order (checkout)
router.post('/checkout', requireOrderProcessing, optionalAuth, async (req, res) => {
  try {
    const shippingAddress = req.body.shippingAddress || req.body.shipping_address;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    const currency = 'GBP'; // Catalog prices and shipping thresholds are in GBP.
    const cartKey = req.user ? req.user.id : validGuestSession(req);

    if (!cartKey) return res.status(400).json({ error: 'A valid checkout session is required' });

    if (!supabase) {
      return res.status(503).json({ error: 'Checkout is temporarily unavailable' });
    }

    // Get cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items (
          product_id,
          quantity,
          products (
            id,
            name,
            price,
            image_url,
            stock
          )
        )
      `)
      .eq('session_id', cartKey)
      .maybeSingle();
    if (cartError) throw cartError;

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address required' });
    }

    // Check stock availability and calculate totals
    const orderItems = [];
    let subtotal = 0;

    if (!cart?.cart_items?.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const invalidQuantity = (quantity) => !Number.isSafeInteger(quantity) || quantity < 1;

    for (const cartItem of cart.cart_items) {
      const product = cartItem.products;

      if (!product || invalidQuantity(cartItem.quantity)) {
        return res.status(400).json({ error: 'Cart contains an invalid item' });
      }

      // Checkout needs a fresh, successful inventory read before accepting an item.
      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('id, name, price, image_url, stock')
        .eq('id', product.id)
        .single();

      if (productError || !currentProduct) {
        return res.status(409).json({ error: 'An item is unavailable; please refresh your cart' });
      }

      if (!Number.isFinite(Number(currentProduct.price)) || Number(currentProduct.price) < 0 ||
          !Number.isSafeInteger(Number(currentProduct.stock)) || Number(currentProduct.stock) < cartItem.quantity) {
        return res.status(409).json({ error: `Item unavailable: ${currentProduct.name}` });
      }

      orderItems.push({
        product_id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        quantity: cartItem.quantity,
        image_url: currentProduct.image_url
      });

      subtotal += Number(currentProduct.price) * cartItem.quantity;
    }

    if (!orderItems.length) return res.status(400).json({ error: 'Cart is empty' });
    if (subtotal < 500) return res.status(400).json({ error: 'Minimum order amount is £500' });
    const shipping = subtotal >= 50 ? 0 : 4.99;
    const orderTotal = subtotal + shipping;

    // Create shipping address record
    let shippingAddressId = null;
    try {
      const { data: newShippingAddress } = await supabase
        .from('shipping_addresses')
        .insert({
          first_name: shippingAddress.firstName,
          last_name: shippingAddress.lastName,
          address: shippingAddress.address,
          city: shippingAddress.city,
          postcode: shippingAddress.postcode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
          email: shippingAddress.email,
          user_id: req.user ? req.user.id : null
        })
        .select()
        .single();
      if (newShippingAddress) shippingAddressId = newShippingAddress.id;
    } catch (e) {}

    // Create order
    const orderData = {
      user_id: req.user ? req.user.id : null,
      session_id: req.user ? null : cartKey,
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      status: 'pending',
      shipping_address_id: shippingAddressId,
      payment_method: paymentMethod || 'card',
      currency: currency,
      subtotal: subtotal.toFixed(2),
      shipping_cost: shipping.toFixed(2),
      total: orderTotal.toFixed(2),
      notes: JSON.stringify({ shippingAddress, paymentMethod })
    };

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error('[Checkout] Substep failed: order record not established');
      throw new Error('Order creation failed in database record stage.');
    }

    // Create order items and deduct stock
    for (const item of orderItems) {
      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: newOrder.id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url
      });
      if (itemError) throw itemError;

      // Deduct stock from product inventory
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity); // Prevent stock from going below 0
        await supabase
          .from('products')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
        
        console.log(`[Checkout] Deducted ${item.quantity} units from product ${item.product_id}. New stock: ${newStock}`);
      }
    }

    if (paymentMethod !== 'payfast' && cart?.id) {
      await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    }

    res.json({
      order: {
        ...newOrder,
        shippingAddress: shippingAddress,
        items: orderItems
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    console.error('Checkout error stack:', error.stack);
    
    // Return user-friendly error message
    const errorMessage = error.message || 'Checkout failed. Please try again.';
    res.status(500).json({ error: errorMessage });
  }
});

// Initialize Paystack payment (Standard Redirect)
router.post('/paystack/initialize', requireOrderProcessing, optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!supabase) return res.status(503).json({ error: 'Payments are temporarily unavailable' });
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });

    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });
    const sessionId = validGuestSession(req);
    if (!(req.user && order.user_id === req.user.id) &&
        !(sessionId && order.session_id === sessionId)) {
      return res.status(403).json({ error: 'Order access denied' });
    }
    if (order.status !== 'pending' || order.payment_method !== 'paystack') {
      return res.status(409).json({ error: 'Order is not awaiting Paystack payment' });
    }

    // --- GET CUSTOM KEYS FROM SETTINGS ---
    const paystackSettings = await getSetting('paystack', {});
    // Use environment variables for sensitive keys (DO NOT hardcode secrets)
    const SECRET_KEY = paystackSettings.secretKey || process.env.PAYSTACK_SECRET_KEY;
    const targetCurrency = (paystackSettings.currency || process.env.PAYSTACK_CURRENCY || '').toUpperCase();
    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0 || targetCurrency !== order.currency) {
      return res.status(409).json({ error: 'Payment currency is not configured for this order' });
    }
    let shippingDetails = {};
    try { shippingDetails = JSON.parse(order.notes || '{}').shippingAddress || {}; } catch {}
    const email = shippingDetails.email;
    if (!email) return res.status(409).json({ error: 'Order email is missing' });

    if (!SECRET_KEY) {
      console.error('CRITICAL: PAYSTACK_SECRET_KEY is missing from environment or settings!');
      return res.status(500).json({ success: false, message: 'Payment gateway configuration error. Please contact support.' });
    }

    console.log('[Paystack] Initializing payment:', { orderId, email, currency: targetCurrency });

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(amount * 100), // Provider amount comes from the stored order.
        currency: targetCurrency,
        reference: orderId,
        callback_url: `${PUBLIC_SITE_URL}/order-confirmation/${orderId}`
      },
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[Paystack] Authorization URL generated successfully');
    res.json({ url: response.data.data.authorization_url });
  } catch (error) {
    console.error('Paystack initialize error:', error.response?.data || error.message);
    const backendMsg = error.response?.data?.message || error.message || 'Verification of Paystack credentials failed.';
    res.status(500).json({ success: false, message: `Paystack Error: ${backendMsg}` });
  }
});

// Generate PayFast payload
router.post('/payfast/generate', requireOrderProcessing, optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!supabase) return res.status(503).json({ error: 'Payments are temporarily unavailable' });
    if (!orderId) return res.status(400).json({ error: 'Order ID required' });
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error || !order) return res.status(404).json({ error: 'Order not found' });
    const sessionId = validGuestSession(req);
    if (!(req.user && order.user_id === req.user.id) &&
        !(sessionId && order.session_id === sessionId)) {
      return res.status(403).json({ error: 'Order access denied' });
    }
    if (order.status !== 'pending' || order.payment_method !== 'payfast') {
      return res.status(409).json({ error: 'Order is not awaiting PayFast payment' });
    }
    // PayFast charges ZAR. No exchange rate or converted amount is stored on
    // GBP orders, so a GBP order cannot be charged safely through this route.
    if (order.currency !== 'ZAR' || !Number.isFinite(Number(order.total)) || Number(order.total) <= 0) {
      return res.status(409).json({ error: 'PayFast requires a verified ZAR order total' });
    }

    let shippingDetails = {};
    try {
      if (order.notes) {
        const parsedNotes = JSON.parse(order.notes);
        shippingDetails = parsedNotes.shippingAddress || {};
      }
    } catch (e) {
      console.error('Could not parse order notes:', e);
    }

    // PERSISTENT CONFIG
    const payfastConfig = await getSetting('payfast', {});

    // Load PayFast credentials from environment or settings (DO NOT hardcode)
    const MERCHANT_ID = payfastConfig.merchantId || process.env.PAYFAST_MERCHANT_ID;
    const MERCHANT_KEY = payfastConfig.merchantKey || process.env.PAYFAST_MERCHANT_KEY;
    const PASSPHRASE = payfastConfig.passphrase || process.env.PAYFAST_PASSPHRASE || null;
    const PAYFAST_URL = (payfastConfig.url || process.env.PAYFAST_URL || 'https://www.payfast.co.za/eng/process').toString().trim();

    if (!MERCHANT_ID || !MERCHANT_KEY) {
      console.error('[PayFast] Missing credentials:', { merchantId: !!MERCHANT_ID, merchantKey: !!MERCHANT_KEY });
      return res.status(500).json({ error: 'PayFast configuration is incomplete. Please contact support.' });
    }

    console.log('[PayFast] Config loaded successfully');

    // Build payload WITHOUT signature first (so signature excludes itself)
    const payloadData = {};

    // --- Merchant fields ---
    payloadData.merchant_id = MERCHANT_ID;
    payloadData.merchant_key = MERCHANT_KEY;

    payloadData.return_url = `${PUBLIC_SITE_URL}/order-confirmation/${order.id}`;
    payloadData.cancel_url = `${PUBLIC_SITE_URL}/cart`;

    payloadData.notify_url = `${PUBLIC_SITE_URL}/api/orders/payfast/notify`;

    // --- Buyer info ---
    payloadData.name_first = shippingDetails.firstName || 'Customer';
    payloadData.name_last = shippingDetails.lastName || 'User';
    payloadData.email_address = shippingDetails.email || 'customer@fujicard.com';

    // --- Transaction info ---
    payloadData.m_payment_id = String(order.id);
    
    payloadData.amount = Number(order.total).toFixed(2);
    
    // Use a simple item name to minimize encoding errors
    payloadData.item_name = `Order_${order.order_number}`.replace(/\s+/g, "_");

    // --- Generate signature AFTER all fields are set ---
    const signature = generatePayfastSignature(payloadData, PASSPHRASE || null);
    payloadData.signature = signature;

    res.json({
      url: PAYFAST_URL,
      payload: payloadData
    });

  } catch (error) {
    console.error('PayFast generate error:', error);
    res.status(500).json({ success: false, message: `PayFast Configuration Failure: ${error.message || 'Signature handshake failed.'}` });
  }
});

// PayFast ITN Webhook endpoint
router.post('/payfast/notify', async (req, res) => {
  try {
    const pfData = req.body;

    // 2. Fetch Passphrase from DB for signature verification
    const payfastConfig = await getSetting('payfast', {});
    const PASSPHRASE = payfastConfig.passphrase || process.env.PAYFAST_PASSPHRASE || null;

    // 3. Verify signature
    const receivedSignature = pfData.signature;
    const calculatedSignature = generatePayfastSignature(pfData, PASSPHRASE);

    if (calculatedSignature !== receivedSignature) {
      console.error('PayFast ITN signature mismatch. Received:', receivedSignature, 'Calculated:', calculatedSignature);
      return res.status(400).send('Signature mismatch');
    }

    // 4. Extract critical fields
    const orderId = pfData.m_payment_id;
    const paymentStatus = pfData.payment_status;
    const amountGross = parseFloat(pfData.amount_gross);

    // 5. Fetch the original order from the database to confirm the amount
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('total, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found for ITN');
      return res.status(404).send('Order not found');
    }

    // 6. Verify that the payment is COMPLETE and the amount matches
    // We check absolute difference to avoid floating point precision issues
    const isAmountCorrect = Math.abs(amountGross - parseFloat(order.total)) < 0.01;

    if (paymentStatus === 'COMPLETE') {
      if (!isAmountCorrect) {
        console.error(`PayFast ITN Amount mismatch! Expected ${order.total}, got ${amountGross}`);
        // We do not fulfill the order if they underpaid
        return res.status(400).send('Amount mismatch');
      }

      // 7. Success! Update the database to reflect the completed payment
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Failed to update order status on PayFast ITN:', error);
      } else {
        console.log(`Order ${orderId} successfully paid via PayFast ITN`);
      }
    } else {
      console.log(`Order ${orderId} payment status: ${paymentStatus}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayFast ITN handler error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Restore cart and stock on payment failure/cancellation
router.post('/:id/restore-cart', optionalAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Order restoration is temporarily unavailable' });
    const orderId = req.params.id;
    const { data: order, error: orderErr } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single();

    if (orderErr || !order) return res.status(404).json({ error: 'Order not found' });
    const sessionId = validGuestSession(req);
    const isOwner = order.user_id
      ? !!(req.user && req.user.id === order.user_id)
      : !!(order.session_id && order.session_id !== 'guest' && sessionId === order.session_id);
    if (!isOwner) return res.status(403).json({ error: 'Order access denied' });
    if (order.status === 'cancelled') return res.json({ success: true, message: 'Already cancelled' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be restored' });

    // Only one cancellation may claim the pending order and restore its stock.
    const { data: cancelled, error: cancelError } = await supabase.from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (cancelError) throw cancelError;
    if (!cancelled) return res.status(409).json({ error: 'Order status changed; refresh and try again' });

    // 2. Restore stock
    if (order.order_items && order.order_items.length > 0) {
      for (const item of order.order_items) {
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (product) {
          await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
        }
      }
    }

    // 3. Rebuild the cart
    const cartKey = order.user_id || order.session_id;
    let { data: targetCart } = await supabase.from('carts').select('*').eq('session_id', cartKey).maybeSingle();
    if (!targetCart && order.user_id) {
      const { data: userCart } = await supabase.from('carts').select('*').eq('user_id', order.user_id).maybeSingle();
      targetCart = userCart;
    }

    if (!targetCart) {
      const { data: newCart } = await supabase.from('carts').insert({ user_id: order.user_id || null, session_id: cartKey }).select().single();
      targetCart = newCart;
    }

    if (targetCart && order.order_items) {
      for (const item of order.order_items) {
        const { data: existing } = await supabase.from('cart_items').select('*').eq('cart_id', targetCart.id).eq('product_id', item.product_id).single();
        if (existing) {
          await supabase.from('cart_items').update({ quantity: existing.quantity + item.quantity }).eq('id', existing.id);
        } else {
          await supabase.from('cart_items').insert({ cart_id: targetCart.id, product_id: item.product_id, quantity: item.quantity });
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Restore cart error:', error);
    res.status(500).json({ error: 'Failed to restore cart' });
  }
});

export default router;
