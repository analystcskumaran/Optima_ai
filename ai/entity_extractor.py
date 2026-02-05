from transformers import pipeline
from utils.logger import log_event

# Load NER model
ner_pipeline = pipeline("ner", model="dbmdz/bert-large-cased-finetuned-conll03-english")

def extract_entities(query):
    entities = ner_pipeline(query)
    extracted = [ent['word'] for ent in entities if ent['entity'].startswith('B-')]  # Extract entities
    log_event(f"Entities extracted: {extracted}")
    return extracted