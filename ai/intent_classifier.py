from utils.logger import log_event


INTENT_KEYWORDS = {
    "stats": ["mean", "average", "variance", "std", "summary", "statistics", "median"],
    "quality": ["missing", "duplicate", "quality", "validation", "clean", "mse", "compare", "comparison"],
    "visualization": ["plot", "chart", "graph", "visual", "trend", "histogram", "boxplot"],
    "pipeline": ["code", "pipeline", "process", "steps", "method", "algorithm", "used", "how"],
    "dataset": ["column", "columns", "rows", "shape", "dataset", "data"],
}


def classify_intent(query):
    text = query.lower().strip()

    for intent, keywords in INTENT_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            log_event(f"Intent classified: {intent}")
            return intent

    log_event("Intent classified: general")
    return "general"
