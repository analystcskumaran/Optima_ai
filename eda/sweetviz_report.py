import sweetviz as sv
import os
from utils.logger import log_event
from config.settings import EDA_HTML_DIR


def generate_sweetviz_report(cleaned_df, reports_dir, raw_df=None):
    if raw_df is not None:
        report = sv.compare([raw_df, "Raw"], [cleaned_df, "Cleaned"])
    else:
        report = sv.analyze(cleaned_df)

    report_path = os.path.join(EDA_HTML_DIR, "sweetviz_report.html")
    report.show_html(filepath=report_path, open_browser=False)
    log_event(f"Sweetviz report generated at {report_path}")
    return report_path
