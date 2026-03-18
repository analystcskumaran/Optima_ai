/**
 * api.ts — Typed API client for all Optima backend endpoints.
 */

import type {
  UploadResponse,
  AnalyzeInitResponse,
  DiagnoseResponse,
  CleanResponse,
  MetricsResponse,
  DatasetFingerprint,
} from "./schemas";

const BASE_URL = "http://localhost:8000";

/** Shared error handler: reads .detail from FastAPI error responses */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore JSON parse errors on error responses
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

/** GET / — check if backend is online */
export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/`);
  return handleResponse<{ status: string }>(res);
}

// ─── Upload ───────────────────────────────────────────────────────────────────
/** POST /api/upload — stores the file server-side; returns file_path */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  // Manual fetch here to avoid handleResponse if we want custom error handling for "Failed to fetch"
  try {
    const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
    return handleResponse<UploadResponse>(res);
  } catch (err: any) {
    if (err.message === "Failed to fetch") {
      throw new Error(`Cannot connect to backend at ${BASE_URL}. Is it running?`);
    }
    throw err;
  }
}

// ─── Analyze Init ─────────────────────────────────────────────────────────────
/** POST /api/analyze-init — computes fingerprint + PII-redacted sample */
export async function analyzeInit(filePath: string): Promise<AnalyzeInitResponse> {
  const res = await fetch(`${BASE_URL}/api/analyze-init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: filePath }),
  });
  return handleResponse<AnalyzeInitResponse>(res);
}

// ─── Diagnose ─────────────────────────────────────────────────────────────────
/** POST /api/diagnose — generates AI health report from fingerprint */
export async function diagnose(
  fingerprint: DatasetFingerprint,
  model?: string,
  apiKey?: string
): Promise<DiagnoseResponse> {
  const res = await fetch(`${BASE_URL}/api/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint, model, api_key: apiKey }),
  });
  return handleResponse<DiagnoseResponse>(res);
}

// ─── Clean ────────────────────────────────────────────────────────────────────
/** POST /api/clean — executes AI cleaning plan on the dataset */
export async function cleanDataset(
  filePath: string,
  fingerprint: DatasetFingerprint,
  model?: string,
  apiKey?: string
): Promise<CleanResponse> {
  const res = await fetch(`${BASE_URL}/api/clean`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: filePath, fingerprint, model, api_key: apiKey }),
  });
  return handleResponse<CleanResponse>(res);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
/** POST /api/chat — conversational Q&A with dataset context */
export async function chat(
  prompt: string,
  datasetState: string,
  dataInfo: Record<string, unknown>,
  safeSummary: string,
  model?: string,
  apiKey?: string
): Promise<{ reply: string }> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      dataset_state: datasetState,
      data_info: dataInfo,
      safe_summary: safeSummary,
      model,
      api_key: apiKey,
    }),
  });
  return handleResponse<{ reply: string }>(res);
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
/** POST /api/metrics — computes F1/accuracy or MAE/R2 when target is provided */
export async function computeMetrics(
  filePath: string,
  targetColumn: string,
  task: "classification" | "regression"
): Promise<MetricsResponse> {
  const res = await fetch(`${BASE_URL}/api/metrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: filePath, target_column: targetColumn, task }),
  });
  return handleResponse<MetricsResponse>(res);
}

// ─── Downloads ────────────────────────────────────────────────────────────────
/** Returns the direct URL for downloading the cleaned CSV */
export function getCleanedCsvUrl(filename: string): string {
  return `${BASE_URL}/api/downloads/${filename}`;
}

/** Returns the direct URL for a report download (Python script or text report) */
export function getReportDownloadUrl(filename: string): string {
  return `${BASE_URL}/api/download/report/${filename}`;
}

