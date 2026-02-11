from analysis.statistics import generate_statistics
from utils.logger import log_event
from pandas.api.types import is_numeric_dtype


def _match_columns(entities, df):
    entity_set = set(entities)
    return [col for col in df.columns if col.lower() in entity_set]


def _safe_shape(df):
    return {"rows": int(df.shape[0]), "columns": int(df.shape[1])}


def execute_query(intent, entities, df, comparison_report=None, pipeline_steps=None):
    matched_cols = _match_columns(entities, df)

    if intent == "dataset":
        result = {
            "shape": _safe_shape(df),
            "columns": list(df.columns),
        }
        log_event("Query executed: dataset")
        return result

    if intent == "stats":
        if matched_cols:
            col = matched_cols[0]
            if is_numeric_dtype(df[col]):
                result = {
                    "column": col,
                    "mean": float(df[col].mean()),
                    "median": float(df[col].median()),
                    "variance": float(df[col].var()),
                    "std_dev": float(df[col].std()),
                }
            else:
                result = {
                    "column": col,
                    "top_values": df[col].value_counts(dropna=False).head(5).to_dict(),
                }
            log_event(f"Query executed: stats for {col}")
            return result

        result = generate_statistics(df)
        log_event("Query executed: global stats")
        return result

    if intent == "quality":
        if comparison_report is not None:
            log_event("Query executed: quality comparison")
            return comparison_report
        return "No comparison report available. Process a dataset first."

    if intent == "visualization":
        if matched_cols:
            return f"Use the Analysis section charts for: {', '.join(matched_cols)}"
        return "Charts are available in Upload & Process Data -> Basic Plots and Trend Plots."

    if intent == "pipeline":
        if pipeline_steps:
            return {"pipeline_steps": pipeline_steps}
        return "Pipeline: load -> validate -> clean missing -> remove duplicates -> remove outliers -> fix datatypes -> analyze -> visualize -> report."

    log_event("Query executed: general")
    return "Ask about dataset shape, columns, statistics, quality comparison, or pipeline steps."
