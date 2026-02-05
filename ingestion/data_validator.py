import pandas as pd
from utils.logger import log_event

def validate_data(df):
    report = {}
    report['shape'] = df.shape
    report['columns'] = list(df.columns)
    report['dtypes'] = df.dtypes.to_dict()
    report['missing_values'] = df.isnull().sum().to_dict()
    report['duplicates'] = df.duplicated().sum()
    log_event("Data validation completed")
    return report