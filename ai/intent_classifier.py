from transformers import pipeline
from utils.logger import log_event

# Load pre-trained model for intent classification (text classification)
intent_pipeline = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")  # Placeholder; fine-tune for intents

def classify_intent(query):
    result = intent_pipeline(query)
    intent = result[0]['label']  # e.g., 'POSITIVE' or 'NEGATIVE'; map to custom intents like 'stats', 'visualize'
    log_event(f"Intent classified: {intent}")
    return intent  # In production, map to specific intents