import express from 'express';
import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth.js';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const productColumns = new Set([
    'name', 'description', 'price', 'original_price', 'image_url', 'category_id',
    'card_type', 'set_name', 'rarity', 'condition', 'language', 'stock',
    'featured', 'promo', 'discount', 'graded', 'grading_company', 'grade'
]);
const productAliases = {
    cardType: 'card_type', set: 'set_name', originalPrice: 'original_price',
    image: 'image_url', gradingCompany: 'grading_company'
};
const productFields = input => {
    const fields = {};
    for (const [alias, column] of Object.entries(productAliases)) {
        if (input[alias] !== undefined) fields[column] = input[alias];
    }
    // Canonical fields win when the API response also carries display aliases.
    for (const column of productColumns) {
        if (input[column] !== undefined) fields[column] = input[column];
    }
    return fields;
};

// --- IMAGE PROCESSING HELPERS ---
const uploadBase64Image = async (base64Str, productName) => {
    if (!base64Str || !base64Str.startsWith('data:')) return base64Str;

    const imageTypes = { jpeg: 'jpg', png: 'png', webp: 'webp', gif: 'gif' };
    const matches = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(base64Str);
    if (!matches) throw Object.assign(new Error('Use a JPEG, PNG, WebP or GIF image.'), { status: 400 });

    const buffer = Buffer.from(matches[2], 'base64');
    if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
        throw Object.assign(new Error('Image must be smaller than 8 MB.'), { status: 400 });
    }
    const name = String(productName || 'product').replace(/[^A-Za-z0-9]/g, '_').slice(0, 60);
    const fileName = `products/${name}_${Date.now()}_${Math.random().toString(36).slice(2)}.${imageTypes[matches[1]]}`;
    let error;
    try {
        ({ error } = await supabase.storage.from('products').upload(fileName, buffer, {
            contentType: `image/${matches[1]}`,
            upsert: false
        }));
    } catch (uploadError) {
        console.error('[Admin] Product image upload failed:', uploadError);
        throw Object.assign(new Error('Image upload failed. Product was not saved; please try again.'), { status: 502 });
    }
    if (error) {
        console.error('[Admin] Product image upload failed:', error);
        throw Object.assign(new Error('Image upload failed. Product was not saved; please try again.'), { status: 502 });
    }

    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
    if (!publicUrl) throw Object.assign(new Error('Image URL unavailable. Product was not saved.'), { status: 502 });
    return publicUrl;
};

// --- SETTINGS MIGRATION (SUPABASE) ---
const getSetting = async (key, defaultValue) => {
    try {
        // If Supabase is not configured, return default immediately
        if (!supabase) {
            console.log(`[getSetting] Supabase not configured, using default for ${key}`);
            return defaultValue;
        }
        
        const { data, error } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', key)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) return defaultValue;
        return data[0].value;
    } catch (e) {
        console.error(`[getSetting] Error fetching ${key}:`, e.message);
        return defaultValue;
    }
};

const updateSetting = async (key, value) => {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert(
                { key, value, updated_at: new Date().toISOString() },
                { onConflict: 'key' }
            );
        if (error) throw error;
        return true;
    } catch (e) {
        console.error(`Failed to update setting ${key}`, e);
        return false;
    }
};
// --- END SETTINGS MIGRATION ---

// Multer config — saves files directly to client/public as <coin>-qr.png
const qrStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(__dirname, '../../client/public');
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const coin = (req.body.coin || 'btc').toLowerCase();
        cb(null, `${coin}-qr.png`);
    }
});
const uploadQR = multer({ storage: qrStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Publicly available Paystack Key (needed for checkout)
router.get('/paystack-key', async (req, res) => {
    try {
        console.log('[Paystack Key] Request received');
        console.log('[Paystack Key] Environment variables:', {
            publicKeyEnv: !!process.env.PAYSTACK_PUBLIC_KEY,
            currencyEnv: process.env.PAYSTACK_CURRENCY || 'not set'
        });
        
        const paystack = await getSetting('paystack', { publicKey: '', currency: 'USD' });
        console.log('[Paystack Key] Settings retrieved:', { publicKey: !!paystack.publicKey, currency: paystack.currency });
        
        // Fall back to environment variables if not set in settings
        const publicKey = paystack.publicKey || process.env.PAYSTACK_PUBLIC_KEY || '';
        const currency = paystack.currency || process.env.PAYSTACK_CURRENCY || 'ZAR';
        
        console.log('[Paystack Key] Final values:', { publicKey: publicKey ? 'set' : 'empty', currency });
        
        if (!publicKey) {
            console.warn('[Paystack Key] Public key is empty!');
            // Still return 200 with the keys even if empty
            return res.status(200).json({ publicKey: '', currency, warning: 'Paystack not configured' });
        }
        
        res.status(200).json({ publicKey, currency });
    } catch (error) {
        console.error('[Paystack Key] Error:', error.message);
        console.error('[Paystack Key] Stack:', error.stack);
        // Return fallback with 200 status to avoid breaking frontend
        const publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
        const currency = process.env.PAYSTACK_CURRENCY || 'ZAR';
        res.status(200).json({ publicKey, currency, fallback: true });
    }
});

// Get current crypto wallet config (public for checkout)
router.get('/crypto-wallets', async (req, res) => {
    try {
        console.log('[Crypto Wallets] Request received');
        const wallets = await getSetting('wallets', {});
        console.log('[Crypto Wallets] Retrieved:', { hasWallets: !!wallets, walletCount: Object.keys(wallets || {}).length });
        res.status(200).json(wallets || {});
    } catch (error) {
        console.error('[Crypto Wallets] Error:', error.message);
        // Return empty wallets but with 200 status
        res.status(200).json({});
    }
});

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized as admin' });
        }
        req.user = user;
        next();
    });
};

// Apply middleware to all admin routes
router.use(authenticateAdmin);

// Send only a short-lived upload grant through Vercel; the image bytes go
// directly from the administrator's browser to Supabase Storage.
router.post('/products/image-upload-url', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Image storage is temporarily unavailable' });
        const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
        const { contentType, size } = req.body;
        if (!imageTypes[contentType] || !Number.isSafeInteger(size) || size < 1 || size > 8 * 1024 * 1024) {
            return res.status(400).json({ error: 'Choose a JPEG, PNG, WebP or GIF image smaller than 8 MB.' });
        }
        const path = `products/${crypto.randomUUID()}.${imageTypes[contentType]}`;
        const { data, error } = await supabase.storage.from('products').createSignedUploadUrl(path);
        if (error || !data?.signedUrl) throw error || new Error('Signed upload URL missing');
        const { data: publicData } = supabase.storage.from('products').getPublicUrl(path);
        if (!publicData?.publicUrl) throw new Error('Public image URL missing');
        res.json({ uploadUrl: data.signedUrl, imageUrl: publicData.publicUrl });
    } catch (error) {
        console.error('Admin image upload URL error:', error);
        res.status(502).json({ error: 'Could not prepare the image upload. Please try again.' });
    }
});

// Get global stats
router.get('/stats', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Admin statistics are temporarily unavailable' });
        const [users, products, orders] = await Promise.all(['users', 'products', 'orders'].map(table =>
            supabase.from(table).select('*', { count: 'exact', head: true })
        ));
        if (users.error || products.error || orders.error ||
            [users.count, products.count, orders.count].some(count => !Number.isSafeInteger(count))) {
            throw users.error || products.error || orders.error || new Error('Statistics count missing');
        }

        res.json({
            users: users.count,
            products: products.count,
            orders: orders.count
        });
    } catch (error) {
        console.warn('Admin stats error:', error);
        res.status(503).json({ error: 'Admin statistics are temporarily unavailable' });
    }
});

// Debug environment configuration (Redacted values)
router.get('/debug-env', (req, res) => {
    res.json({
        has_url: !!process.env.SUPABASE_URL,
        has_server_key: !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    });
});

// Add a new product
router.post('/products', async (req, res) => {
    try {
        const newProduct = req.body;

        // Allow zero stock so sold-out products can be marked unavailable
        if (newProduct.stock !== undefined) {
            const stockValue = Number(newProduct.stock);
            if (newProduct.stock === '' || newProduct.stock === null || !Number.isSafeInteger(stockValue) || stockValue < 0) {
                return res.status(400).json({ error: 'Stock must be a non-negative whole number.' });
            }
            newProduct.stock = stockValue;
        } else {
            // Do not claim inventory that has not been entered.
            newProduct.stock = 0;
        }

        // Ensure you use the right category_id - for now assume client sends it or map name -> id
        if (newProduct.category_name) {
            const { data: catData } = await supabase
                .from('categories')
                .select('id')
                .ilike('name', newProduct.category_name.trim())
                .single();

            if (catData) {
                console.log(`[Admin] Map category '${newProduct.category_name}' to ID: ${catData.id}`);
                newProduct.category_id = catData.id;
            } else {
                console.warn(`[Admin] Category '${newProduct.category_name}' NOT FOUND in DB! Product might not appear.`);
            }
            delete newProduct.category_name;
        }

        const product = productFields(newProduct);
        if (!product.name?.trim() || !product.category_id || !Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
            return res.status(400).json({ error: 'A product needs a name, category and positive price.' });
        }
        product.price = Number(product.price);
        if (product.image_url?.startsWith('data:')) {
            product.image_url = await uploadBase64Image(product.image_url, product.name);
        }
        const { data, error } = await supabase.from('products').insert([product]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to add product', details: error.message });
    }
});

// Bulk update stock for sold-out products
router.put('/products/bulk-stock', async (req, res) => {
    try {
        const { productIds, stockToAdd } = req.body;
        if (!Array.isArray(productIds) || productIds.length === 0 || productIds.length > 1000 ||
            productIds.some(id => typeof id !== 'string' || !id.trim())) {
            return res.status(400).json({ error: 'No products selected' });
        }

        const addedStock = Number(stockToAdd);
        if (stockToAdd === '' || stockToAdd === null || !Number.isSafeInteger(addedStock) || addedStock <= 0 || addedStock > 2147483647) {
            return res.status(400).json({ error: 'Stock to add must be a positive whole number' });
        }

        const uniqueIds = [...new Set(productIds)];
        console.log(`[Admin] Bulk stock update: adding ${addedStock} to ${uniqueIds.length} products`);

        const errors = [];
        let updatedCount = 0;
        // Bound concurrent requests and only update the quantity we read. A
        // competing inventory change becomes a conflict instead of being lost.
        const updateProduct = async (pid) => {
            const { data: product, error: fetchErr } = await supabase
                .from('products')
                .select('stock')
                .eq('id', pid)
                .single();

            if (fetchErr || !product) {
                errors.push(`Product ${pid}: fetch failed - ${fetchErr?.message}`);
                return;
            }

            const currentStock = Number(product.stock);
            if (!Number.isSafeInteger(currentStock) || currentStock < 0 || currentStock + addedStock > 2147483647) {
                errors.push(`Product ${pid}: stock is invalid or would exceed the database limit`);
                return;
            }
            const newStock = currentStock + addedStock;

            console.log(`[Admin] Updating stock for ${pid}: ${currentStock} -> ${newStock}`);

            const { data: updatedData, error: updateErr } = await supabase
                .from('products')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('id', pid)
                .eq('stock', currentStock)
                .select('id');

            if (updateErr) {
                errors.push(`Product ${pid}: update failed - ${updateErr.message}`);
            } else if (!updatedData || updatedData.length === 0) {
                errors.push(`Product ${pid}: stock changed during update or no row was available`);
            } else {
                updatedCount++;
            }
        };
        let nextIndex = 0;
        await Promise.all(Array.from({ length: Math.min(8, uniqueIds.length) }, async () => {
            while (nextIndex < uniqueIds.length) {
                const pid = uniqueIds[nextIndex++];
                try {
                    await updateProduct(pid);
                } catch (error) {
                    errors.push(`Product ${pid}: ${error.message || 'request failed'}`);
                }
            }
        }));

        if (errors.length > 0) {
            console.error('Bulk stock update results contains errors:', errors);
            return res.status(409).json({ error: 'Some products could not be updated. Refresh inventory before retrying.', updatedCount, failedCount: errors.length, details: errors });
        }

        res.json({ message: 'Stock updated successfully', updatedCount });
    } catch (error) {
        console.error('Bulk stock update error:', error);
        res.status(500).json({ error: 'Failed to update stock in bulk', details: error.message });
    }
});

// Update an existing product
router.put('/products/:id', async (req, res) => {
    try {
        const updateData = req.body;

        // Allow zero stock so sold-out products can be marked unavailable
        if (updateData.stock !== undefined) {
            const stockValue = Number(updateData.stock);
            if (updateData.stock === '' || updateData.stock === null || !Number.isSafeInteger(stockValue) || stockValue < 0) {
                return res.status(400).json({ error: 'Stock must be a non-negative whole number.' });
            }
            updateData.stock = stockValue;
        }

        if (updateData.category_name) {
            const { data: catData } = await supabase
                .from('categories')
                .select('id')
                .ilike('name', updateData.category_name.trim())
                .single();
            if (catData) {
                console.log(`[Admin] Map category '${updateData.category_name}' to ID: ${catData.id}`);
                updateData.category_id = catData.id;
            } else {
                console.warn(`[Admin] Category '${updateData.category_name}' NOT FOUND in DB! Product might not appear.`);
            }
            delete updateData.category_name;
        }

        // Clean fields we shouldn't update manually here
        delete updateData.id;
        delete updateData.categories;
        delete updateData.created_at;
        delete updateData.updated_at;

        // Map any boolean strings back to bool
        if (updateData.featured !== undefined) updateData.featured = updateData.featured === 'true' || updateData.featured === true;
        if (updateData.promo !== undefined) updateData.promo = updateData.promo === 'true' || updateData.promo === true;

        console.log(`[Admin] Updating product ${req.params.id}`);

        if (supabase) {
            const product = productFields(updateData);
            if (!product.name?.trim() || !Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
                return res.status(400).json({ error: 'A product needs a name, category and positive price.' });
            }
            product.price = Number(product.price);
            if (product.image_url?.startsWith('data:')) {
                product.image_url = await uploadBase64Image(product.image_url, product.name);
            }
            const { data, error } = await supabase.from('products')
                .update({ ...product, updated_at: new Date().toISOString() })
                .eq('id', req.params.id).select().maybeSingle();
            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Product not found' });
            return res.json(data);
        } else {
            // FALLBACK: Update local memory and attempt to persist to store.js
            console.log('⚠️ [Admin] Supabase disconnected. Updating local store files...');

            // Try updating fallbackProducts (which is the live reference in memory)
            // Note: need to import it or use a shared store
            // For now, let's at least return a successful simulation message or a 501
            res.status(501).json({
                error: 'Database not connected.',
                details: 'Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file to persist changes.'
            });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to update product', details: error.message });
    }
});

// Delete a product
router.delete('/products/:id', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(501).json({ error: 'Database disconnected. Cannot delete products locally.' });
        }

        const { error } = await supabase.from('products').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product', details: error.message });
    }
});


// Category Management
router.post('/categories', async (req, res) => {
    try {
        const { name } = req.body;
        const { data, error } = await supabase.from('categories').insert([{ name }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add category' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        // Can't delete category if it has products attached (FK constraint) unless CASCADE
        const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category. Ensure no products are left inside it.' });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('id, username, email, created_at, is_banned').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user ban status
router.put('/users/:id/ban', async (req, res) => {
    try {
        const { is_banned } = req.body;
        const { error } = await supabase.from('users').update({ is_banned }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Delete ALL users (nuclear option — admin confirmed)
router.delete('/users', async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // neq trick to delete all rows
        if (error) throw error;
        res.json({ message: 'All users deleted successfully' });
    } catch (error) {
        console.error('Error deleting all users:', error);
        res.status(500).json({ error: 'Failed to delete all users', details: error.message });
    }
});

// Delete ALL orders
router.delete('/orders', async (req, res) => {
    try {
        const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        res.json({ message: 'All orders deleted successfully' });
    } catch (error) {
        console.error('Error deleting all orders:', error);
        res.status(500).json({ error: 'Failed to delete all orders', details: error.message });
    }
});

// Get all orders for tracking
router.get('/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users ( username, email )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Get recent transactions for notifications
router.get('/notifications', async (req, res) => {
    try {
        // Fetch the 10 most recent orders with their associated users if any
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                total,
                currency,
                payment_method,
                created_at,
                user_id,
                users ( username, email )
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Format the notifications
        const notifications = data.map(order => ({
            id: order.id,
            order_number: order.order_number,
            amount: order.total,
            currency: order.currency,
            method: order.payment_method || 'Unknown',
            time: order.created_at,
            customer: order.users ? order.users.username : 'Guest Checkout',
            email: order.users ? order.users.email : 'N/A',
            isRead: false // In a real app we would store read status in DB
        }));

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Update a single coin's wallet address and trust link
router.put('/crypto-wallets/:symbol', authenticateAdmin, async (req, res) => {
    const { symbol } = req.params;
    const { address, trustLink } = req.body;
    const wallets = await getSetting('wallets', {});
    if (!wallets[symbol]) return res.status(404).json({ error: 'Unknown coin symbol' });
    wallets[symbol] = { ...wallets[symbol], address, trustLink };
    if (!(await updateSetting('wallets', wallets))) {
        return res.status(503).json({ error: 'Wallet settings could not be saved' });
    }
    res.json({ message: `${symbol} wallet updated`, config: wallets[symbol] });
});

// Upload a new QR code image for a coin
router.post('/crypto-wallets/qr', authenticateAdmin, uploadQR.single('qr'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ message: 'QR code uploaded successfully', filename: req.file.filename });
});

// Get current Paystack config (admin only)
router.get('/paystack-config', authenticateAdmin, async (req, res) => {
    const paystack = await getSetting('paystack', {});
    res.json(paystack);
});

// Update Paystack config
router.put('/paystack-config', authenticateAdmin, async (req, res) => {
    const { publicKey, secretKey } = req.body;
    const paystack = { publicKey, secretKey };
    if (!(await updateSetting('paystack', paystack))) {
        return res.status(503).json({ error: 'Paystack settings could not be saved' });
    }
    res.json({ message: 'Paystack settings updated', config: paystack });
});

// Get current PayFast config (admin only)
router.get('/payfast-config', authenticateAdmin, async (req, res) => {
    const payfast = await getSetting('payfast', {});
    res.json(payfast);
});

// Update PayFast config
router.put('/payfast-config', authenticateAdmin, async (req, res) => {
    const { merchantId, merchantKey, passphrase, url } = req.body;
    const payfast = { merchantId, merchantKey, passphrase, url };
    if (!(await updateSetting('payfast', payfast))) {
        return res.status(503).json({ error: 'PayFast settings could not be saved' });
    }
    res.json({ message: 'PayFast settings updated', config: payfast });
});

export default router;
