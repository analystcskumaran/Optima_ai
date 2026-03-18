import pandas as pd
import numpy as np
from typing import Any, Optional, cast

class EngineConfig:
    def __init__(self, copy: bool = True):
        self.copy = copy

def clean_dataframe(df: pd.DataFrame, plan: dict[str, Any], config: Optional[EngineConfig] = None) -> tuple[pd.DataFrame, dict[str, Any]]:
    if config is None:
        config = EngineConfig()
    
    df_clean: pd.DataFrame = cast(pd.DataFrame, df.copy() if config.copy else df)

    actions_applied: list[str] = []
    stats: dict[str, str] = {}
    
    actions = plan.get("actions", [])
    for action in actions:
        action_type: str = str(action.get("type", "unknown"))
        
        try:
            if action_type == "drop_empty_rows":
                df_clean.dropna(how="all", inplace=True)
                actions_applied.append(str(action_type))
            elif action_type == "drop_empty_cols":
                df_clean.dropna(axis=1, how="all", inplace=True)
                actions_applied.append(str(action_type))
            elif action_type == "strip_whitespace":
                str_cols = df_clean.select_dtypes(include=["object", "string"]).columns
                if len(str_cols) > 0:
                    df_clean.loc[:, str_cols] = df_clean[str_cols].apply(lambda s: s.astype("string").str.strip() if hasattr(s, "str") or (isinstance(s, pd.Series) and s.dtype == "string") else s)
                actions_applied.append(str(action_type))
            elif action_type == "deduplicate":
                subset = action.get("subset")
                keep = action.get("keep", "first")
                
                # Normalize lists to strings before dropping duplicates to handle unhashable types
                temp_df = df_clean.copy()
                obj_cols = temp_df.select_dtypes(include=["object"]).columns
                for col in obj_cols:
                    s = temp_df[col]
                    if s.map(lambda x: isinstance(x, list)).any():
                        temp_df.loc[:, col] = s.map(lambda x: ", ".join(map(str, x)) if isinstance(x, list) else x)
                
                # identify duplicate mask
                if subset and isinstance(subset, list):
                    duplicates = temp_df.duplicated(subset=subset, keep=keep)
                elif subset and isinstance(subset, str):
                    duplicates = temp_df.duplicated(subset=[subset], keep=keep)
                else:
                    duplicates = temp_df.duplicated(keep=keep)
                
                df_clean = df_clean[~duplicates]
                actions_applied.append(str(action_type))
            elif action_type == "coerce_numeric":
                cols = action.get("columns", [])
                if cols == "numeric":
                    cols = df_clean.select_dtypes(include=np.number).columns
                for c in cols:
                    if c in df_clean.columns:
                        if action.get("allow_currency") or action.get("allow_percent"):
                            df_clean.loc[:, c] = df_clean[c].astype(str).str.replace(r'[$,%]', '', regex=True)
                        df_clean.loc[:, c] = pd.to_numeric(df_clean[c], errors="coerce")
                actions_applied.append(str(action_type))
            elif action_type == "parse_dates":
                cols = action.get("columns", [])
                for c in cols:
                    if c in df_clean.columns:
                        df_clean.loc[:, c] = pd.to_datetime(df_clean[c], errors="coerce", dayfirst=action.get("dayfirst", False))
                actions_applied.append(str(action_type))
            elif action_type == "outliers_iqr":
                cols = action.get("columns", [])
                if cols == "numeric":
                    cols = df_clean.select_dtypes(include=np.number).columns
                k = action.get("k", 1.5)
                strategy = action.get("strategy", "clip")
                for c in cols:
                    if c in df_clean.columns and pd.api.types.is_numeric_dtype(df_clean[c]):
                        Q1 = df_clean[c].quantile(0.25)
                        Q3 = df_clean[c].quantile(0.75)
                        IQR = Q3 - Q1
                        lower = Q1 - k * IQR
                        upper = Q3 + k * IQR
                        if strategy == "clip":
                            df_clean.loc[:, c] = df_clean[c].clip(lower, upper)
                        elif strategy == "drop":
                            df_clean = df_clean[(df_clean[c] >= lower) & (df_clean[c] <= upper) | df_clean[c].isna()]
                actions_applied.append(str(action_type))
            elif action_type == "impute":
                numeric_strategy = action.get("numeric", "median")
                cat_strategy = action.get("categorical", "mode")
                
                for c in df_clean.columns:
                    if pd.api.types.is_numeric_dtype(df_clean[c]):
                        if numeric_strategy == "median":
                            val = df_clean[c].median()
                        elif numeric_strategy == "mean":
                            val = df_clean[c].mean()
                        elif numeric_strategy == "zero":
                            val = 0
                        else:
                            val = None
                        if val is not None and not pd.isna(val):
                            df_clean.fillna({c: val}, inplace=True)
                    else:
                        if cat_strategy == "mode":
                            mode_val = df_clean[c].mode()
                            if not mode_val.empty:
                                df_clean.fillna({c: mode_val[0]}, inplace=True)
                actions_applied.append(str(action_type))
            elif action_type == "drop_high_null_cols":
                threshold = action.get("threshold", 0.5)
                limit = len(df_clean) * threshold
                df_clean.dropna(thresh=limit, axis=1, inplace=True)
                actions_applied.append(str(action_type))
            elif action_type == "standardize_categories":
                cols = action.get("columns", [])
                for c in cols:
                    if c in df_clean.columns:
                        df_clean.loc[:, c] = df_clean[c].astype(str).str.lower().str.strip()
                actions_applied.append(str(action_type))
            elif action_type == "drop_columns":
                cols = action.get("columns", [])
                cols_to_drop = [c for c in cols if c in df_clean.columns]
                if cols_to_drop:
                    df_clean.drop(columns=cols_to_drop, inplace=True)
                actions_applied.append(str(action_type))
            elif action_type == "filter_range":
                c = action.get("column")
                min_val = action.get("min")
                max_val = action.get("max")
                if c in df_clean.columns and pd.api.types.is_numeric_dtype(df_clean[c]):
                    if min_val is not None:
                        df_clean = df_clean[df_clean[c] >= float(min_val)]
                    if max_val is not None:
                        df_clean = df_clean[df_clean[c] <= float(max_val)]
                actions_applied.append(str(action_type))
            elif action_type == "extract_numeric":
                cols = action.get("columns", [])
                for c in cols:
                    if c in df_clean.columns:
                        extracted = df_clean[c].astype(str).str.extract(r'(\d+\.?\d*)', expand=False)
                        df_clean.loc[:, c] = pd.to_numeric(extracted, errors="coerce")
                actions_applied.append(str(action_type))
            elif action_type == "regex_extract":
                c = action.get("column")
                pattern = action.get("pattern")
                new_cols = action.get("new_columns", [])
                if c in df_clean.columns and pattern and new_cols:
                    matches = df_clean[c].astype(str).str.extract(pattern, expand=True)
                    for i, new_col in enumerate(new_cols):
                        if i < len(matches.columns):
                            df_clean.loc[:, new_col] = matches.iloc[:, i]
                actions_applied.append(str(action_type))
            elif action_type == "map_categories":
                c = action.get("column")
                mapping = action.get("mapping", {})
                if c in df_clean.columns:
                    replacements = {}
                    for target, variants in mapping.items():
                        for v in variants:
                            replacements[str(v).lower().strip()] = target
                    def map_val(x):
                        try:
                            clean_x = str(x).lower().strip()
                            return replacements.get(clean_x, x)
                        except:
                            return x
                    df_clean.loc[:, c] = df_clean[c].map(map_val)
                actions_applied.append(str(action_type))
            # Other actions ignored
        except Exception as e:
            stats[str(action_type)] = f"Error: {e}"

    report = {"actions_applied": actions_applied, "stats": stats}
    return df_clean, report
