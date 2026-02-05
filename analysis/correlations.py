import pandas as pd
from utils.logger import log_event

def compute_correlations(df):
    corr = df.corr()
    log_event("Correlations computed")
    return corr