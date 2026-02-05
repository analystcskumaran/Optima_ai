import pandas as pd
from utils.logger import log_event

def handle_missing_values(df):
    # Fill numeric with mean, categorical with mode
    for col in df.columns:
        if df[col].dtype in ['int64', 'float64']:
            df[col].fillna(df[col].mean(), inplace=True)
        else:
            df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown', inplace=True)
    log_event("Missing values handled")
    return df