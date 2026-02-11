import pandas as pd
from analysis.comparison import generate_comparison_report


def test_generate_comparison_report():
    raw_df = pd.DataFrame(
        {
            "sales": [10, 20, None, 20],
            "cost": [4, 7, 8, 7],
        }
    )
    cleaned_df = pd.DataFrame(
        {
            "sales": [10, 20, 20],
            "cost": [4, 7, 7],
        }
    )

    report = generate_comparison_report(raw_df, cleaned_df)

    assert report["raw_missing_cells"] == 1
    assert report["cleaned_missing_cells"] == 0
    assert report["row_retention_pct"] == 75.0
    assert len(report["numeric_column_metrics"]) == 2
