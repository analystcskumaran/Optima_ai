import pandas as pd
from cleaning.missing_values import handle_missing_values
from cleaning.duplicates import remove_duplicates

def test_handle_missing_values():
    df = pd.DataFrame({'A': [1, None, 3], 'B': ['a', None, 'c']})
    result = handle_missing_values(df)
    assert result.isnull().sum().sum() == 0

def test_remove_duplicates():
    df = pd.DataFrame({'A': [1, 1, 2], 'B': ['a', 'a', 'b']})
    result = remove_duplicates(df)
    assert result.shape[0] == 2