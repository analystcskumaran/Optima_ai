import pandas as pd
from utils.logger import log_event


def correct_datatypes(df):
    # Try numeric/date conversion only when a strong fraction parses successfully.
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            continue

        numeric = pd.to_numeric(df[col], errors="coerce")
        numeric_success = numeric.notna().mean()
        if numeric_success >= 0.7:
            df[col] = numeric
            continue

        dates = pd.to_datetime(df[col], errors="coerce")
        date_success = dates.notna().mean()
        if date_success >= 0.7:
            df[col] = dates

    log_event("Data types corrected")
    return df
