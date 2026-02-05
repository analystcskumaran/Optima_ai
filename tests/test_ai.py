from ai.intent_classifier import classify_intent

def test_classify_intent():
    result = classify_intent("Show me stats")
    assert isinstance(result, str)