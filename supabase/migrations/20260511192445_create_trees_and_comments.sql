/*
  # Create cult trees map tables

  1. New Tables
    - `trees`
      - `id` (uuid, primary key) - Unique tree identifier
      - `title` (text, not null) - Name/title of the tree entry
      - `description` (text) - Description of the tree
      - `species` (text) - Tree species
      - `latitude` (double precision, not null) - GPS latitude
      - `longitude` (double precision, not null) - GPS longitude
      - `image_url` (text) - Optional image URL
      - `created_by` (uuid) - User who created the entry
      - `created_at` (timestamptz) - Creation timestamp
    - `comments`
      - `id` (uuid, primary key) - Unique comment identifier
      - `tree_id` (uuid, foreign key) - Reference to tree
      - `content` (text, not null) - Comment text
      - `author_name` (text) - Author display name
      - `created_by` (uuid) - User who created the comment
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Anyone can read trees and comments (public map)
    - Authenticated users can insert trees and comments
    - Users can update/delete their own entries
*/

CREATE TABLE IF NOT EXISTS trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  species text DEFAULT '',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  image_url text DEFAULT '',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trees"
  ON trees FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can add trees"
  ON trees FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own trees"
  ON trees FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own trees"
  ON trees FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text DEFAULT 'Анониман',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_comments_tree_id ON comments(tree_id);
