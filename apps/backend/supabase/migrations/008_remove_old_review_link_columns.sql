-- Remove old review link columns and ensure only review_links array exists
-- This migration removes google_review_link, facebook_review_link, other_review_link

-- First, ensure review_links column exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS review_links JSONB DEFAULT '[]'::jsonb;

-- Migrate any existing data from old columns to new array format
UPDATE users
SET review_links = (
  SELECT jsonb_agg(
    jsonb_build_object('name', name, 'url', url)
  )
  FROM (
    SELECT 'Google' as name, google_review_link as url WHERE google_review_link IS NOT NULL AND google_review_link != ''
    UNION ALL
    SELECT 'Facebook' as name, facebook_review_link as url WHERE facebook_review_link IS NOT NULL AND facebook_review_link != ''
    UNION ALL
    SELECT 'Other' as name, other_review_link as url WHERE other_review_link IS NOT NULL AND other_review_link != ''
  ) AS links
  WHERE url IS NOT NULL AND url != ''
)
WHERE (google_review_link IS NOT NULL 
   OR facebook_review_link IS NOT NULL 
   OR other_review_link IS NOT NULL)
   AND (review_links IS NULL OR review_links = '[]'::jsonb);

-- Now drop the old columns
ALTER TABLE users DROP COLUMN IF EXISTS google_review_link;
ALTER TABLE users DROP COLUMN IF EXISTS facebook_review_link;
ALTER TABLE users DROP COLUMN IF EXISTS other_review_link;

-- Add comment for documentation
COMMENT ON COLUMN users.review_links IS 'Array of review links: [{"name": "Google", "url": "https://..."}, ...]';

