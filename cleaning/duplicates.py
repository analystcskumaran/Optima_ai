import pandas as pd
from utils.logger import log_event

def remove_duplicates(df):
    initial_shape = df.shape
    df.drop_duplicates(inplace=True)
    log_event(f"Duplicates removed: {initial_shape[0] - df.shape[0]} rows")
    return df