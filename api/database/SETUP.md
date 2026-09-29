# Supabase Database Setup Guide for Fuji Card Market

## Step 1: Create a Supabase Account

1. Go to https://supabase.com
2. Click "Start your project" or "Sign In"
3. Sign up with GitHub, Google, or email

## Step 2: Create a New Project

1. Click **"New Project"** in Supabase dashboard
2. Fill in:
   - **Name**: `fuji-card-market`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you (e.g., London for UK)
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

## Step 3: Get Your Credentials

1. In your Supabase project dashboard:
2. Go to **Settings** (gear icon) → **API**
3. Copy these two values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 4: Update Environment Variables

Open `server/.env` and update:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=<generate-a-unique-random-secret-of-at-least-32-characters>
PORT=5000
```

## Step 5: Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file: `server/database/supabase-schema.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

## Step 6: Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see all these tables:
   - ✅ products
   - ✅ categories
   - ✅ users
   - ✅ addresses
   - ✅ carts
   - ✅ cart_items
   - ✅ orders
   - ✅ order_items
   - ✅ wishlists
   - ✅ wishlist_items
   - ✅ reviews

## Step 7: Insert Sample Products (Optional)

You can manually add products via Supabase Table Editor, or I'll help you migrate your existing data from `store.js` to Supabase.

## Step 8: Test Connection

Restart your server:

```bash
cd server
node index.js
```

Look for this message:
```
✅ Connected to Supabase successfully!
```

If you see:
```
⚠️  Supabase credentials not found. Using in-memory storage.
```

Check your `.env` file is correct.

---

## Next Steps

After setup, I can help you:

1. **Migrate existing data** from `store.js` to Supabase
2. **Update API routes** to use Supabase instead of in-memory arrays
3. **Add real-time features** (live stock updates, order tracking)
4. **Set up authentication** with Supabase Auth
5. **Enable file storage** for product images

---

## Troubleshooting

### Error: "Invalid API key"
- Make sure you copied the **anon/public** key, not the service role key
- Check for extra spaces in `.env`

### Error: "Relation does not exist"
- The SQL schema didn't run successfully
- Re-run the `supabase-schema.sql` in SQL Editor

### Can't connect to Supabase
- Check your internet connection
- Verify the project URL is correct
- Make sure the project is active in Supabase dashboard

---

## Free Tier Limits (Supabase Free Plan)

- ✅ **Database**: 500 MB
- ✅ **Users**: Unlimited
- ✅ **API Requests**: Unlimited
- ✅ **File Storage**: 1 GB
- ✅ **Bandwidth**: 2 GB/month
- ✅ **Email Auth**: 100 emails/month

Perfect for development and small production apps!

---

## Security Notes

- Row Level Security (RLS) is **enabled** on all tables
- Users can only access their own data (cart, orders, etc.)
- Products and categories are publicly readable
- Never commit `.env` file to Git (it's in .gitignore)
