-- 017: Create private invoices storage bucket
--
-- PDF invoices are generated in the razorpay-webhook Edge Function after each
-- successful payment and stored here as invoice-{booking_id}.pdf.
-- The bucket is private (public=false). The anon SELECT policy lets the
-- admin panel (anon key + client-side password) generate time-limited signed
-- URLs for download — the bucket is not publicly listable and file paths
-- are UUIDs, so the risk surface is acceptable for an admin-only tool.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  5242880,                -- 5 MB per file (simple PDFs are < 100 KB)
  '{application/pdf}'
)
ON CONFLICT (id) DO NOTHING;

-- Allow anon key to generate signed URLs (SELECT on storage.objects).
-- Service role (used by Edge Functions) bypasses RLS and can upload freely.
CREATE POLICY "invoices_anon_select"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'invoices');
