import pandas as pd
import chardet
from utils.logger import log_event

def load_csv(file_path):
    try:
        # Detect encoding
        with open(file_path, 'rb') as f:
            result = chardet.detect(f.read())
        encoding = result['encoding']
        
        # Load CSV
        df = pd.read_csv(file_path, encoding=encoding)
        log_event(f"CSV loaded successfully from {file_path}")
        return df
    except Exception as e:
        log_event(f"Error loading CSV: {str(e)}")
        return None