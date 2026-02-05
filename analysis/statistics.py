import pandas as pd
from utils.logger import log_event

def generate_statistics(df):
    stats = df.describe().to_dict()
    log_event("Statistics generated")
    return stats