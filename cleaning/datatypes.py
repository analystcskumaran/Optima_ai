import pandas as pd
from utils.logger import log_event

def correct_datatypes(df):
    # Attempt to convert to numeric if possible
    for col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col], errors='ignore')
        except:
            pass
    log_event("Data types corrected")
    return df