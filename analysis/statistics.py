import pandas as pd
from utils.logger import log_event


def generate_statistics(df):
    numeric_summary = df.describe(include=["number"]).to_dict()
    try:
        categorical_summary = df.describe(include=["object", "category"]).to_dict()
    except ValueError:
        categorical_summary = {}

    stats = {
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary,
    }

    log_event("Statistics generated")
    return stats
