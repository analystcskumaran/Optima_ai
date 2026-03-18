import pandas as pd
import numpy as np
import re
from io import BytesIO

# --- Constants ---
PII_VALUE_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", re.I)
PII_VALUE_PHONE = re.compile(r"\+?\d[\d\s\-()]{6,}\d")

def local_preprocess_fast(df: pd.DataFrame) -> pd.DataFrame:
    """
    Performs fast local preprocessing directly on load to remove completely empty rows/cols
    and strip standard string objects before AI processing.
    """
    # Drop completely empty rows/cols first
    df = df.dropna(how="all").dropna(axis=1, how="all")
    
    # Vectorized strip on object/string columns - more efficient than .apply()
    str_cols = df.select_dtypes(include=["object", "string"]).columns
    for col in str_cols:
        # Only strip if it's actually an object/string series
        df[col] = df[col].astype(str).str.strip()
    
    return df

def load_and_preprocess(file_name: str, file_bytes: bytes) -> pd.DataFrame:
    """
    Loads a CSV or Excel file from bytes and runs the initial fast preprocessing pass.
    """
    if file_name.endswith(".csv"):
        # Use low_memory=False to avoid DtypeWarnings on large files
        df = pd.read_csv(BytesIO(file_bytes), low_memory=False)
    else:
        df = pd.read_excel(BytesIO(file_bytes), engine="openpyxl")
    return local_preprocess_fast(df)

def dataset_fingerprint(df: pd.DataFrame, sample_rows: int = 10, max_cat_cols: int = 30) -> dict:
    """
    Generates a secure, statistical fingerprint of the dataset.
    This safely samples the data, redacting detected PII (like emails and phones),
    and aggregates column statistics without sending full proprietary data to the LLM.
    """
    # Vectorized operations are much faster than loops
    shape = df.shape
    dtypes = df.dtypes.astype(str).to_dict()
    null_pct = (df.isna().mean() * 100).round(2).to_dict()
    
    # Vectorized nunique
    nunique = df.nunique(dropna=True).to_dict()

    # Vectorized numeric stats
    num_cols = df.select_dtypes(include=np.number).columns
    num_stats = {}
    if not num_cols.empty:
        # median and std can be slow on huge datasets, but on small ones it's fine.
        # we round to 4 decimals to keep JSON size smaller.
        num_stats = df[num_cols].agg(["min", "max", "mean", "median", "std"]).round(4).to_dict()

    # Create a safe sample with PII masked
    sample = df.head(sample_rows).copy()
    obj_cols = df.select_dtypes(include=["object", "string"]).columns[:max_cat_cols]
    
    for c in obj_cols:
        if c in sample.columns:
            s = sample[c].astype(str)
            # Redact identifiable data using vectorized .str.replace
            s = s.str.replace(PII_VALUE_EMAIL, "[REDACTED_EMAIL]", regex=True)
            s = s.str.replace(PII_VALUE_PHONE, "[REDACTED_PHONE]", regex=True)
            sample[c] = s

    # Generate a safe human-readable summary for the AI context
    safe_summary = f"Dataset with {shape[0]} rows and {shape[1]} columns. "
    safe_summary += f"Columns: {', '.join(df.columns)}. "
    safe_summary += f"Data quality: {round(df.notna().mean().mean() * 100, 1)}% complete."

    return {
        "shape": shape,
        "columns": list(df.columns),
        "dtypes": dtypes,
        "null_pct": null_pct,
        "nunique": nunique,
        "numeric_stats": num_stats,
        "safe_sample": sample.to_dict(orient="records"),
        "safe_summary": safe_summary
    }
