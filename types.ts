
export interface Movie {
  id: string;
  title: string;
  rating: number; // 0-5
  review: string;
  createdAt: string;
  
  // Enhanced Metadata (Populated via Gemini Flash + Search)
  director?: string;
  releaseYear?: string;
  plotSummary?: string;
  tags?: string[]; // User defined tags (replaces theme)
  rottenTomatoesScore?: string; // e.g., "95%"
  imageUrl?: string; // URL for poster or still
  
  // AI Analysis (Populated via Gemini Pro + Thinking)
  aiAnalysis?: string;
}

export type ViewState = 'list' | 'add' | 'detail';

export interface MovieFormData {
  title: string;
  rating: number;
  review: string;
}

export interface SearchResult {
  title: string;
  director: string;
  year: string;
  plot: string;
  rottenTomatoesScore?: string;
  imageUrl?: string;
}
