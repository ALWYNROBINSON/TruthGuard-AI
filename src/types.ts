export interface User {
  id: number;
  name: string;
  email: string;
  role: 'public' | 'journalist' | 'investigator' | 'admin';
}

export interface AnalysisResult {
  id: number;
  fileName: string;
  authenticity_score: number;
  confidence_level: 'High' | 'Medium' | 'Low';
  risk_level: 'Verified' | 'Suspicious' | 'High Risk';
  manipulation_type: string;
  explanation_text: string;
  metadata_analysis: any;
  frame_timeline: number[] | null;
  heatmap_regions?: string;
  references?: string[];
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
