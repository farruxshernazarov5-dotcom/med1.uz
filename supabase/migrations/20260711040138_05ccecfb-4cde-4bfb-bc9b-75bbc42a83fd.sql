ALTER TABLE public.api_sdk_versions
  ADD COLUMN IF NOT EXISTS download_status TEXT NOT NULL DEFAULT 'unchecked' CHECK (download_status IN ('unchecked','available','missing','error')),
  ADD COLUMN IF NOT EXISTS download_status_code INTEGER,
  ADD COLUMN IF NOT EXISTS download_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS download_error TEXT,
  ADD COLUMN IF NOT EXISTS repository_status TEXT NOT NULL DEFAULT 'unchecked' CHECK (repository_status IN ('unchecked','available','missing','error','not_configured')),
  ADD COLUMN IF NOT EXISTS repository_status_code INTEGER,
  ADD COLUMN IF NOT EXISTS repository_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS repository_error TEXT,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

COMMENT ON COLUMN public.api_sdk_versions.download_status IS 'SDK download link verification status';
COMMENT ON COLUMN public.api_sdk_versions.repository_status IS 'SDK repository link verification status';

UPDATE public.api_sdk_versions
SET
  download_status = 'unchecked',
  repository_status = CASE WHEN repository_url IS NULL OR repository_url = '' THEN 'not_configured' ELSE repository_status END,
  next_retry_at = COALESCE(next_retry_at, now() + interval '24 hours')
WHERE download_checked_at IS NULL;