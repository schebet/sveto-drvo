/*
  # Add estimated_age column to trees table

  1. Changes
    - Add `estimated_age` column (integer) to `trees` table
      - Stores the estimated age of the tree in years
      - Default is null (unknown age)
    - Add index on `estimated_age` for filtering old trees

  2. Notes
    - Trees with estimated_age >= 100 will get a special "ancient" badge
    - This column is optional and can be left empty
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trees' AND column_name = 'estimated_age'
  ) THEN
    ALTER TABLE trees ADD COLUMN estimated_age integer;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trees_estimated_age ON trees(estimated_age) WHERE estimated_age IS NOT NULL;
