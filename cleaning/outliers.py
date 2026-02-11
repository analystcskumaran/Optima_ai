import numpy as np
from utils.logger import log_event


def detect_outliers(df):
    # Remove rows with any numeric value outside +/- 3 std deviations.
    numeric_cols = list(df.select_dtypes(include=["number"]).columns)
    if not numeric_cols:
        log_event("Outlier detection skipped - no numeric columns")
        return df

    mask = np.ones(len(df), dtype=bool)
    for col in numeric_cols:
        std = df[col].std()
        if std is None or std == 0 or np.isnan(std):
            continue

        z_scores = (df[col] - df[col].mean()) / std
        col_mask = z_scores.abs().le(3) | z_scores.isna()
        mask &= col_mask.to_numpy()

    cleaned = df.loc[mask].copy()
    log_event(f"Outliers detected and removed: {len(df) - len(cleaned)} rows")
    return cleaned
