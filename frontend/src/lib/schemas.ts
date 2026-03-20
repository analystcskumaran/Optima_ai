// ─── Metrics ──────────────────────────────────────────────────────────────────
export type MetricsTask = "classification" | "regression" | "clustering";

export interface MetricsResponse {
  task: MetricsTask;
  model: string;
  target?: string;
  // Classification
  accuracy?: number;
  f1?: number;
  precision?: number;
  recall?: number;
  // Regression
  mae?: number;
  mse?: number;
  r2?: number;
  // Common Visuals
  feature_importance?: { feature: string; value: number }[];
  prediction_preview?: { id: number; actual: any; predicted: any }[];
  // Clustering
  cluster_count?: number;
  plot_data?: { x: number; y: number; cluster: number }[];
  silhouette_score?: number;
}
