import os

# Global configurations
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, 'data', 'raw')
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, 'data', 'processed')
REPORTS_DIR = os.path.join(BASE_DIR, 'reports')
EDA_HTML_DIR = os.path.join(REPORTS_DIR, 'eda_html')
EXPORTS_DIR = os.path.join(REPORTS_DIR, 'exports')

# Ensure directories exist
os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
os.makedirs(EDA_HTML_DIR, exist_ok=True)
os.makedirs(EXPORTS_DIR, exist_ok=True)

# AI Model settings
INTENT_MODEL = "distilbert-base-uncased"  # Hugging Face model for intent
ENTITY_MODEL = "dbmdz/bert-large-cased-finetuned-conll03-english"  # For NER