import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import streamlit as st
import pandas as pd
import os
from ingestion.csv_loader import load_csv
from ingestion.data_validator import validate_data
from cleaning.missing_values import handle_missing_values
from cleaning.duplicates import remove_duplicates
from cleaning.outliers import detect_outliers
from cleaning.datatypes import correct_datatypes
from analysis.statistics import generate_statistics
from analysis.correlations import compute_correlations
from analysis.comparison import generate_comparison_report
from visualization.basic_plots import create_basic_plots
from visualization.trend_plots import create_trend_plots
from eda.sweetviz_report import generate_sweetviz_report
from ai.intent_classifier import classify_intent
from ai.entity_extractor import extract_entities
from ai.query_engine import execute_query
from utils.logger import log_event
from config.settings import RAW_DATA_DIR, PROCESSED_DATA_DIR, REPORTS_DIR

st.set_page_config(page_title="OPTIMA - AI Data Analyst Assistant", page_icon="🧠", layout="wide")

PIPELINE_STEPS = [
    "CSV loading with encoding detection",
    "Validation: shape, dtypes, missing values, duplicates",
    "Missing value handling (numeric mean, categorical mode)",
    "Duplicate row removal",
    "Outlier removal using z-score threshold (+/- 3)",
    "Data type correction for numeric/date-like columns",
    "Statistical summary and correlation analysis",
    "Chart generation (histogram, boxplot, trend line)",
    "Sweetviz EDA report generation",
]


def _load_latest_processed_dataset():
    processed_files = [f for f in os.listdir(PROCESSED_DATA_DIR) if f.endswith(".csv")]
    if not processed_files:
        return None, None

    # Pick the newest processed file.
    latest = max(
        processed_files,
        key=lambda name: os.path.getmtime(os.path.join(PROCESSED_DATA_DIR, name))
    )
    path = os.path.join(PROCESSED_DATA_DIR, latest)
    return pd.read_csv(path), path


def main():
    st.title("🧠 OPTIMA - AI Data Analyst Assistant")
    st.markdown("""
    OPTIMA is a standalone Python-based AI data analyst assistant designed to automate the end-to-end workflow of local CSV data processing, including data cleaning, statistical analysis, visualization, and exploratory data analysis.
    """)

    # Sidebar for navigation
    st.sidebar.header("Navigation")
    page = st.sidebar.radio("Choose a page:", ["Upload & Process Data", "AI Query Interface", "View Reports"])

    if page == "Upload & Process Data":
        upload_and_process()
    elif page == "AI Query Interface":
        ai_query_interface()
    elif page == "View Reports":
        view_reports()

def upload_and_process():
    st.header("Upload & Process Data")
    uploaded_file = st.file_uploader("Upload a CSV file", type=["csv"])

    if uploaded_file is not None:
        # Save raw file
        raw_path = os.path.join(RAW_DATA_DIR, uploaded_file.name)
        with open(raw_path, "wb") as f:
            f.write(uploaded_file.getbuffer())

        st.success(f"File uploaded: {uploaded_file.name}")

        # Load and validate
        df = load_csv(raw_path)
        if df is not None:
            raw_df = df.copy()

            validation_report = validate_data(raw_df)
            st.subheader("Data Validation Report")
            st.json(validation_report)

            # Cleaning pipeline
            df = handle_missing_values(df)
            df = remove_duplicates(df)
            df = detect_outliers(df)
            df = correct_datatypes(df)

            # Save processed data
            processed_path = os.path.join(PROCESSED_DATA_DIR, f"processed_{uploaded_file.name}")
            df.to_csv(processed_path, index=False)

            st.subheader("1) Cleaned Dataset Output")
            st.success(f"Processed data saved: {processed_path}")
            st.dataframe(df.head())
            st.download_button(
                "Download Cleaned CSV",
                data=df.to_csv(index=False).encode("utf-8"),
                file_name=f"processed_{uploaded_file.name}",
                mime="text/csv",
            )

            comparison_report = generate_comparison_report(raw_df, df)

            st.subheader("2) Analysis, Visuals, and Validation")
            st.markdown("**Raw vs Cleaned Comparison**")
            st.json(comparison_report)

            # Generate statistics
            stats = generate_statistics(df)
            st.subheader("Descriptive Statistics")
            st.json(stats)

            # Correlations
            corr = compute_correlations(df)
            st.subheader("Correlation Matrix")
            st.dataframe(corr)

            # Visualizations
            st.subheader("Basic Plots")
            create_basic_plots(df)

            st.subheader("Trend Plots")
            create_trend_plots(df)

            # EDA Report
            report_path = generate_sweetviz_report(df, REPORTS_DIR, raw_df=raw_df)
            st.success(f"EDA Report generated: {report_path}")

            st.session_state["processed_df"] = df
            st.session_state["comparison_report"] = comparison_report
            st.session_state["pipeline_steps"] = PIPELINE_STEPS
            st.session_state["latest_processed_path"] = processed_path

            log_event("Data processing completed for " + uploaded_file.name)
        else:
            st.error("Failed to load CSV file.")


def ai_query_interface():
    st.header("3) AI Chatbot Interface")
    st.caption("Ask about dataset insights, cleaning quality, validation metrics, or pipeline/code used.")
    query = st.text_input("Enter your query (e.g., 'What is the variance of sales?')")

    if st.button("Submit Query"):
        if query:
            intent = classify_intent(query)
            entities = extract_entities(query)
            st.write(f"Detected Intent: {intent}")
            st.write(f"Extracted Entities: {entities}")

            df = st.session_state.get("processed_df")
            if df is None:
                df, loaded_path = _load_latest_processed_dataset()
                if df is not None:
                    st.session_state["processed_df"] = df
                    st.session_state["latest_processed_path"] = loaded_path

            if df is not None:
                result = execute_query(
                    intent,
                    entities,
                    df,
                    comparison_report=st.session_state.get("comparison_report"),
                    pipeline_steps=st.session_state.get("pipeline_steps", PIPELINE_STEPS),
                )
                st.subheader("Query Result")
                st.write(result)
            else:
                st.warning("No processed data available. Upload and process a file first.")
        else:
            st.warning("Please enter a query.")


def view_reports():
    st.header("View Reports")
    reports = []
    for root, _, files in os.walk(REPORTS_DIR):
        for name in files:
            absolute_path = os.path.join(root, name)
            relative_path = os.path.relpath(absolute_path, REPORTS_DIR)
            reports.append(relative_path)

    if reports:
        selected_report = st.selectbox("Select a report", reports)
        selected_path = os.path.join(REPORTS_DIR, selected_report)
        if selected_report.endswith(".html"):
            with open(selected_path, "r", encoding="utf-8") as f:
                html_content = f.read()
            st.components.v1.html(html_content, height=600)
        else:
            with open(selected_path, "rb") as file_handle:
                st.download_button("Download Report", data=file_handle, file_name=selected_report)
    else:
        st.info("No reports available.")


if __name__ == "__main__":
    main()
