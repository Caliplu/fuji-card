# Product image storage

Admin uploads use the public-read `products` bucket in Supabase Storage. The API uploads with its server-only Supabase secret; the browser sends the selected image to the authenticated admin route. No public upload policy is needed.

For a new Supabase project, create the bucket before using the admin photo upload:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products', 'products', true, 8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do nothing;
```

Product images must be JPEG, PNG, WebP or GIF files smaller than 8 MB. The API returns an error if Storage rejects an upload, leaving the product unchanged. Existing external image URLs remain as they are; use only supplier-approved photos for replacements.
