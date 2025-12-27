/*
  # Create analysis campaigns and results tables

  1. New Tables
    - `campaigns`
      - `id` (uuid, primary key)
      - `project_path` (text)
      - `main_branch` (text)
      - `feature_branch` (text)
      - `status` (enum: pending, in_progress, completed, failed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `analysis_results`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key)
      - `diff_summary` (jsonb)
      - `file_changes` (jsonb)
      - `ai_analysis` (text)
      - `errors_warnings` (jsonb)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add public read/insert policies for analysis
  3. Notes
    - Public tables allow anyone to create and view analyses
    - Data is not sensitive (code diffs, analysis results)
*/

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_path text NOT NULL,
  main_branch text NOT NULL,
  feature_branch text NOT NULL,
  excluded_folders text[] DEFAULT '{}',
  ollama_url text DEFAULT 'http://localhost:11434',
  ollama_model text DEFAULT 'llama2',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  diff_summary jsonb NOT NULL,
  file_changes jsonb NOT NULL,
  ai_analysis text,
  errors_warnings jsonb DEFAULT '[]',
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaigns"
  ON campaigns FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update campaign status"
  ON campaigns FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view results"
  ON analysis_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create results"
  ON analysis_results FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_analysis_results_campaign_id ON analysis_results(campaign_id);
