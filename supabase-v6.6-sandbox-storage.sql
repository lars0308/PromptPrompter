-- Prompt.ai: allow private project ZIPs for isolated Vercel Sandbox builds.
-- Existing first-folder-per-user RLS policies continue to protect these files.
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array[
      'image/png','image/jpeg','image/webp',
      'application/pdf','text/plain','text/markdown','text/csv','application/json',
      'application/zip','application/x-zip-compressed'
    ]::text[]
where id = 'sitebrief-references';
