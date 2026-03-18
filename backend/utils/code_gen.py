def plan_to_code(plan: dict) -> str:
    """
    Translates the AI-generated JSON task plan into readable python Pandas code
    so the user can legally / visually verify the changes going to happen.
    """
    lines = ["# Generated from cleaning plan (preview only)", "df_cleaned = df.copy()"]
    
    for a in plan.get("actions", []):
        t = a.get("type")
        if t == "deduplicate":
            subset = a.get("subset")
            keep = a.get("keep", "first")
            lines.append(f"df_cleaned = df_cleaned.drop_duplicates(subset={subset}, keep='{keep}')")
            
        elif t == "strip_whitespace":
            lines.append("for c in df_cleaned.select_dtypes(include=['object','string']).columns:")
            lines.append("    df_cleaned[c] = df_cleaned[c].astype('string').str.strip()")
            
        elif t == "drop_empty_rows":
            lines.append("df_cleaned.dropna(how='all', inplace=True)")
            
        elif t == "drop_empty_cols":
            lines.append("df_cleaned.dropna(how='all', axis=1, inplace=True)")
            
        elif t == "drop_columns":
            cols = a.get("columns", [])
            lines.append(f"cols_to_drop = [c for c in {cols} if c in df_cleaned.columns]")
            lines.append("if cols_to_drop: df_cleaned.drop(columns=cols_to_drop, inplace=True)")
            
        elif t == "filter_range":
            c = a.get("column")
            min_val = a.get("min")
            max_val = a.get("max")
            if min_val is not None: lines.append(f"df_cleaned = df_cleaned[df_cleaned['{c}'] >= {min_val}]")
            if max_val is not None: lines.append(f"df_cleaned = df_cleaned[df_cleaned['{c}'] <= {max_val}]")
            
        elif t == "extract_numeric":
            cols = a.get("columns", [])
            lines.append(f"for c in {cols}:")
            lines.append("    if c in df_cleaned.columns:")
            lines.append(r"        extracted = df_cleaned[c].astype(str).str.extract(r'(\d+\.?\d*)', expand=False)")
            lines.append("        df_cleaned[c] = pd.to_numeric(extracted, errors='coerce')")
            
        elif t == "regex_extract":
            c = a.get("column")
            pat = a.get("pattern")
            new_cols = a.get("new_columns", [])
            lines.append(f"matches = df_cleaned['{c}'].astype(str).str.extract(r'{pat}', expand=True)")
            lines.append(f"for i, new_col in enumerate({new_cols}):")
            lines.append("    if i < len(matches.columns): df_cleaned[new_col] = matches.iloc[:, i]")
            
        elif t == "map_categories":
            c = a.get("column")
            mapping = a.get("mapping", {})
            lines.append(f"# Mapping for {c}")
            lines.append(f"mapping = {mapping}")
            lines.append("replacements = {str(v).lower().strip(): k for k, vals in mapping.items() for v in vals}")
            lines.append(f"df_cleaned['{c}'] = df_cleaned['{c}'].map(lambda x: replacements.get(str(x).lower().strip(), x))")
            
        elif t == "coerce_numeric":
            cols = a.get("columns", [])
            lines.append(f"for c in {cols}:")
            lines.append("    if c in df_cleaned.columns:")
            lines.append("        df_cleaned[c] = pd.to_numeric(df_cleaned[c], errors='coerce')")
            
    return "\\n".join(lines)
