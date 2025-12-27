import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Campaign {
  id: string;
  project_path: string;
  main_branch: string;
  feature_branch: string;
  excluded_folders: string[];
  ollama_url: string;
  ollama_model: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  campaign_id: string;
  diff_summary: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  file_changes: Array<{
    file: string;
    changes: number;
    insertions: number;
    deletions: number;
    diff: string;
  }>;
  ai_analysis: string;
  errors_warnings: Array<{
    type: string;
    message: string;
  }>;
  completed_at: string;
}

export async function getCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as Campaign[];
}

export async function getCampaignResults(campaignId: string) {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) throw error;
  return data as AnalysisResult | null;
}
