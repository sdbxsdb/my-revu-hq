-- Update users table to use a links array instead of separate review link columns
-- First, create a new column for the links array
ALTER TABLE users
ADD COLUMN IF NOT EXISTS review_links JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data from old columns to new array format
-- This will convert existing links to the new format
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
WHERE google_review_link IS NOT NULL 
   OR facebook_review_link IS NOT NULL 
   OR other_review_link IS NOT NULL;

-- Drop the old columns (commented out for safety - uncomment after verifying migration)
-- ALTER TABLE users DROP COLUMN IF EXISTS google_review_link;
-- ALTER TABLE users DROP COLUMN IF EXISTS facebook_review_link;
-- ALTER TABLE users DROP COLUMN IF EXISTS other_review_link;

-- Add comment for documentation
COMMENT ON COLUMN users.review_links IS 'Array of review links: [{"name": "Google", "url": "https://..."}, ...]';

