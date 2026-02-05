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
from visualization.basic_plots import create_basic_plots
from visualization.trend_plots import create_trend_plots
from eda.sweetviz_report import generate_sweetviz_report
from ai.intent_classifier import classify_intent
from ai.entity_extractor import extract_entities
from ai.query_engine import execute_query
from utils.logger import log_event
from config.settings import RAW_DATA_DIR, PROCESSED_DATA_DIR, REPORTS_DIR

st.set_page_config(page_title="OPTIMA - AI Data Analyst Assistant", page_icon="🧠", layout="wide")

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
            validation_report = validate_data(df)
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
            st.success(f"Processed data saved: {processed_path}")
            
            # Display processed data
            st.subheader("Processed Data Preview")
            st.dataframe(df.head())
            
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
            report_path = generate_sweetviz_report(df, REPORTS_DIR)
            st.success(f"EDA Report generated: {report_path}")
            
            log_event("Data processing completed for " + uploaded_file.name)
        else:
            st.error("Failed to load CSV file.")

def ai_query_interface():
    st.header("AI Query Interface")
    query = st.text_input("Enter your query (e.g., 'Show me the average sales by region')")
    
    if st.button("Submit Query"):
        if query:
            intent = classify_intent(query)
            entities = extract_entities(query)
            st.write(f"Detected Intent: {intent}")
            st.write(f"Extracted Entities: {entities}")
            
            # Load processed data (assuming one file; in production, select from list)
            processed_files = [f for f in os.listdir(PROCESSED_DATA_DIR) if f.endswith('.csv')]
            if processed_files:
                df = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, processed_files[0]))
                result = execute_query(intent, entities, df)
                st.subheader("Query Result")
                st.write(result)
            else:
                st.warning("No processed data available. Upload and process a file first.")
        else:
            st.warning("Please enter a query.")

def view_reports():
    st.header("View Reports")
    reports = os.listdir(REPORTS_DIR)
    if reports:
        selected_report = st.selectbox("Select a report", reports)
        if selected_report.endswith(".html"):
            with open(os.path.join(REPORTS_DIR, selected_report), "r") as f:
                html_content = f.read()
            st.components.v1.html(html_content, height=600)
        else:
            st.download_button("Download Report", data=open(os.path.join(REPORTS_DIR, selected_report), "rb"), file_name=selected_report)
    else:
        st.info("No reports available.")

if __name__ == "__main__":
    main()