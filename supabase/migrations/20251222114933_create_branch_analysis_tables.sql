/*
  # Git Branch Analyzer Schema

  1. New Tables
    - `branch_analyses`
      - `id` (uuid, primary key)
      - `project_path` (text) - Path to the git repository
      - `main_branch` (text) - Name of the main/stable branch
      - `feature_branch` (text) - Name of the feature branch to compare
      - `diff_summary` (jsonb) - Summary of changes (files changed, insertions, deletions)
      - `file_changes` (jsonb) - Detailed file-by-file changes
      - `ai_analysis` (text) - Ollama's analysis of the changes
      - `errors_warnings` (jsonb) - Array of detected errors and warnings
      - `created_at` (timestamptz) - When the analysis was performed
      - `status` (text) - Status of the analysis (pending, completed, failed)
      
  2. Security
    - Enable RLS on `branch_analyses` table
    - Add policies for public access (since this is a local tool)

  3. Indexes
    - Index on created_at for sorting
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS branch_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_path text NOT NULL,
  main_branch text NOT NULL DEFAULT 'main',
  feature_branch text NOT NULL,
  diff_summary jsonb DEFAULT '{}',
  file_changes jsonb DEFAULT '[]',
  ai_analysis text DEFAULT '',
  errors_warnings jsonb DEFAULT '[]',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE branch_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON branch_analyses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON branch_analyses FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON branch_analyses FOR UPDATE
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_branch_analyses_created_at 
  ON branch_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_branch_analyses_status 
  ON branch_analyses(status);