/*
  # Add admin role and policies for seloschebet@gmail.com

  1. Changes
    - Add `role` column to auth.users raw_app_meta_data for the admin user
      - Sets role = 'admin' for seloschebet@gmail.com
    - Add UPDATE policies on `trees` and `comments` tables for admin users
      - Admins can update ANY tree or comment (not just their own)
    - Add DELETE policies on `trees` and `comments` tables for admin users
      - Admins can delete ANY tree or comment (not just their own)

  2. Security
    - Admin role is stored in raw_app_meta_data (cannot be modified by the user)
    - Policies check for admin role using auth.jwt() -> 'app_metadata' -> 'role'
    - Existing ownership-based policies remain intact
    - New admin policies are restrictive and only apply to the specific admin user

  3. Notes
    - The admin user can now edit and delete all trees and comments
    - Regular users can still only modify their own data
*/

-- Set admin role in app_metadata for the admin user
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE email = 'seloschebet@gmail.com';

-- Admin can update any tree
CREATE POLICY "Admin can update any tree"
  ON trees
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin can delete any tree
CREATE POLICY "Admin can delete any tree"
  ON trees
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin can update any comment
CREATE POLICY "Admin can update any comment"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin can delete any comment
CREATE POLICY "Admin can delete any comment"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
