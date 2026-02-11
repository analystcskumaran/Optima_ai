import re
from utils.logger import log_event


STOP_WORDS = {
    "the", "is", "a", "an", "and", "or", "to", "of", "for", "in", "on", "by", "with",
    "show", "me", "what", "which", "tell", "about", "give", "please", "dataset",
}


def extract_entities(query):
    tokens = re.findall(r"[A-Za-z_][A-Za-z0-9_]*", query.lower())
    entities = [token for token in tokens if token not in STOP_WORDS and len(token) > 2]
    log_event(f"Entities extracted: {entities}")
    return entities
