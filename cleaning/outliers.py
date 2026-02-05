import pandas as pd
from scipy import stats
from utils.logger import log_event

def detect_outliers(df):
    # Remove outliers using Z-score for numeric columns
    numeric_cols = df.select_dtypes(include=['number']).columns
    for col in numeric_cols:
        z_scores = stats.zscore(df[col])
        df = df[(z_scores < 3) & (z_scores > -3)]
    log_event("Outliers detected and removed")
    return df