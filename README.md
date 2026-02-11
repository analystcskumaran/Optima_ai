# OPTIMA - AI Data Analyst Assistant

## Overview
OPTIMA is a standalone Python-based utility for automating local CSV data cleaning, analysis, visualization, and dataset Q&A through a chatbot-style interface.

## Project Outputs (as required)
1. Cleaned dataset file
2. Analysis and validation output
3. Chatbot interface over processed data and pipeline details

## Features
- CSV ingestion with encoding detection and validation report
- Cleaning pipeline:
  - Missing value handling
  - Duplicate removal
  - Outlier removal (z-score threshold)
  - Datatype correction (numeric/date where applicable)
- Analysis pipeline:
  - Descriptive statistics
  - Correlation matrix
  - Visual plots (histogram, boxplot, trend line)
  - Raw-vs-cleaned comparison metrics:
    - missing/duplicate reduction
    - row retention
    - mean/variance shifts
    - distribution MSE
    - quality verdict
- EDA report with Sweetviz (comparison mode: raw vs cleaned)
- Offline chatbot-style query support (no model download required)

## Installation
1. Create and activate a virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run Streamlit:
   - `streamlit run app/main.py`

## Usage
1. Open `Upload & Process Data`
2. Upload any CSV file
3. Review:
   - validation report
   - cleaned data preview and download button
   - raw vs cleaned comparison metrics
   - statistics/correlation/plots
4. Open `AI Query Interface` and ask questions like:
   - `what is the shape of the dataset?`
   - `show average sales`
   - `give quality comparison`
   - `what pipeline/code is used?`
5. Open `View Reports` to inspect generated Sweetviz HTML reports.

## Folders
- `data/raw`: uploaded source CSV files
- `data/processed`: cleaned output CSV files
- `reports/eda_html`: Sweetviz report output

