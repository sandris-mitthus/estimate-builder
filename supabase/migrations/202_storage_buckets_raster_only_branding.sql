-- Disallow SVG uploads on branding / logo buckets (raster-only XSS hardening).

update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id in ('site-assets', 'company-assets');
