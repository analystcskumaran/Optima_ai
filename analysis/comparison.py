import numpy as np
from utils.logger import log_event


def _distribution_mse(raw_series, cleaned_series):
    raw_values = raw_series.dropna().astype(float).sort_values().to_numpy()
    cleaned_values = cleaned_series.dropna().astype(float).sort_values().to_numpy()

    sample_size = min(len(raw_values), len(cleaned_values))
    if sample_size == 0:
        return None

    mse = np.mean((raw_values[:sample_size] - cleaned_values[:sample_size]) ** 2)
    return float(mse)


def generate_comparison_report(raw_df, cleaned_df):
    report = {
        "raw_shape": {"rows": int(raw_df.shape[0]), "columns": int(raw_df.shape[1])},
        "cleaned_shape": {"rows": int(cleaned_df.shape[0]), "columns": int(cleaned_df.shape[1])},
        "raw_missing_cells": int(raw_df.isna().sum().sum()),
        "cleaned_missing_cells": int(cleaned_df.isna().sum().sum()),
        "raw_duplicates": int(raw_df.duplicated().sum()),
        "cleaned_duplicates": int(cleaned_df.duplicated().sum()),
    }

    raw_rows = raw_df.shape[0] if raw_df.shape[0] else 1
    cleaned_rows = cleaned_df.shape[0]

    report["row_retention_pct"] = round((cleaned_rows / raw_rows) * 100, 2)
    report["missing_reduction_pct"] = round(
        ((report["raw_missing_cells"] - report["cleaned_missing_cells"]) / max(report["raw_missing_cells"], 1)) * 100,
        2,
    )

    numeric_columns = [
        col for col in raw_df.select_dtypes(include=["number"]).columns if col in cleaned_df.columns
    ]

    column_metrics = []
    for col in numeric_columns:
        raw_var = float(raw_df[col].var()) if raw_df[col].notna().sum() > 1 else None
        cleaned_var = float(cleaned_df[col].var()) if cleaned_df[col].notna().sum() > 1 else None

        column_metrics.append(
            {
                "column": col,
                "raw_mean": float(raw_df[col].mean()) if raw_df[col].notna().any() else None,
                "cleaned_mean": float(cleaned_df[col].mean()) if cleaned_df[col].notna().any() else None,
                "raw_variance": raw_var,
                "cleaned_variance": cleaned_var,
                "distribution_mse": _distribution_mse(raw_df[col], cleaned_df[col]),
            }
        )

    report["numeric_column_metrics"] = column_metrics

    verdict = "Good"
    if report["cleaned_missing_cells"] > 0 or report["cleaned_duplicates"] > 0:
        verdict = "Needs Review"
    if report["row_retention_pct"] < 40:
        verdict = "Aggressive Cleaning - Validate Business Impact"

    report["quality_verdict"] = verdict
    log_event("Raw vs cleaned comparison report generated")
    return report
