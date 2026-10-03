import express from 'express';
import { supabase } from '../config/supabase.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to get cart key (user id or session id)
const getCartKey = (req) => {
  if (req.user) return req.user.id;
  const sessionId = req.headers['x-session-id'];
  return typeof sessionId === 'string' && /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(sessionId)
    ? sessionId : null;
};

const requireCartKey = (req, res, next) => {
  if (!getCartKey(req)) return res.status(400).json({ error: 'A valid cart session is required' });
  next();
};

router.use(optionalAuth, requireCartKey, (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Cart is temporarily unavailable' });
  }
  next();
});

// Get cart
router.get('/', async (req, res) => {
  try {
    const cartKey = getCartKey(req);

    // Get or create cart for this user/session
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', cartKey)
      .single();

    if (cartError || !cart) {
      console.log('Creating new cart for:', cartKey);
      const { data: newCart, error: insertError } = await supabase
        .from('carts')
        .insert({ session_id: cartKey })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
          const { data: recoveredCart } = await supabase.from('carts').select('*').eq('session_id', cartKey).single();
          cart = recoveredCart;
        } else {
          throw insertError;
        }
      } else {
        cart = newCart;
      }
    }

    // Get cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          stock
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) throw itemsError;

    const populatedItems = cartItems?.map(item => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      product: item.products
    })) || [];

    const subtotal = populatedItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

    res.json({
      items: populatedItems,
      itemCount: populatedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: subtotal.toFixed(2),
      updatedAt: cart.updated_at
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const cartKey = getCartKey(req);

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Parallelize product stock check and cart lookup
    const [productRes, cartRes] = await Promise.all([
      supabase.from('products').select('id, stock, price').eq('id', productId).single(),
      supabase.from('carts').select('*').eq('session_id', cartKey).single()
    ]);

    const { data: product, error: productError } = productRes;
    let { data: cart, error: cartError } = cartRes;

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    if (cartError || !cart) {
      const { data: newCart, error: insertError } = await supabase
        .from('carts')
        .insert({ session_id: cartKey })
        .select()
        .single();
      if (insertError) throw insertError;
      cart = newCart;
    }

    // Check if item already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: 'Not enough stock available' });
      }
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          quantity: quantity
        });
      if (insertError) throw insertError;
    }

    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update cart item quantity
router.put('/update/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;
    const cartKey = getCartKey(req);
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative integer' });
    }

    // A cart item ID alone is not proof of ownership. Scope every mutation
    // through the cart belonging to this authenticated user or guest session.
    const { data: cart, error: cartError } = await supabase.from('carts')
      .select('id').eq('session_id', cartKey).maybeSingle();
    if (cartError) throw cartError;
    if (!cart) return res.status(404).json({ error: 'Item not found' });

    // Get cart item
    const { data: item } = await supabase
      .from('cart_items')
      .select(`*, products (stock)`)
      .eq('id', itemId)
      .eq('cart_id', cart.id)
      .single();

    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (quantity <= 0) {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId).eq('cart_id', cart.id);
      if (error) throw error;
    } else {
      if (!item.products || quantity > Number(item.products.stock)) {
        return res.status(409).json({ error: 'Not enough stock available' });
      }
      const { error } = await supabase.from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', itemId).eq('cart_id', cart.id);
      if (error) throw error;
    }
    res.json({ message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from cart
router.delete('/remove/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const cartKey = getCartKey(req);

    const { data: cart, error: cartError } = await supabase.from('carts')
      .select('id').eq('session_id', cartKey).maybeSingle();
    if (cartError) throw cartError;
    if (!cart) return res.status(404).json({ error: 'Item not found' });
    const { data: removed, error } = await supabase.from('cart_items')
      .delete().eq('id', itemId).eq('cart_id', cart.id).select('id').maybeSingle();
    if (error) throw error;
    if (!removed) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cart
router.delete('/clear', async (req, res) => {
  try {
    const cartKey = getCartKey(req);
    const { data: cart, error: cartError } = await supabase.from('carts')
      .select('id').eq('session_id', cartKey).maybeSingle();
    if (cartError) throw cartError;
    if (cart) {
      const { error: deleteError } = await supabase.from('cart_items')
        .delete().eq('cart_id', cart.id);
      if (deleteError) throw deleteError;
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
