import pandas as pd
from utils.logger import log_event


def compute_correlations(df):
    corr = df.corr(numeric_only=True)
    log_event("Correlations computed")
    return corr
