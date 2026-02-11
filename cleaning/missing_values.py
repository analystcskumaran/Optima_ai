from pandas.api.types import is_numeric_dtype
from utils.logger import log_event


def handle_missing_values(df):
    # Fill numeric with mean, categorical with mode or "Unknown".
    for col in df.columns:
        if is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].mean())
        else:
            mode = df[col].mode(dropna=True)
            fallback = mode.iloc[0] if not mode.empty else "Unknown"
            df[col] = df[col].fillna(fallback)

    log_event("Missing values handled")
    return df
