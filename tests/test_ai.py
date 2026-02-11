from ai.intent_classifier import classify_intent
from ai.entity_extractor import extract_entities
from ai.query_engine import execute_query
import pandas as pd


def test_classify_intent_stats():
    assert classify_intent("Show me the average sales") == "stats"


def test_extract_entities():
    entities = extract_entities("Show variance for sales and profit")
    assert "sales" in entities


def test_execute_quality_query():
    df = pd.DataFrame({"sales": [10, 20, 30]})
    report = {"quality_verdict": "Good"}
    result = execute_query("quality", ["quality"], df, comparison_report=report)
    assert result["quality_verdict"] == "Good"
