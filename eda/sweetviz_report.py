import sweetviz as sv
import os
from utils.logger import log_event
from config.settings import EDA_HTML_DIR

def generate_sweetviz_report(df, reports_dir):
    report = sv.analyze(df)
    report_path = os.path.join(EDA_HTML_DIR, "sweetviz_report.html")
    report.show_html(filepath=report_path, open_browser=False)
    log_event(f"Sweetviz report generated at {report_path}")
    return report_path