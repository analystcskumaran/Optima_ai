import json
import re
from openai import OpenAI

def get_openrouter_client(api_key: str) -> OpenAI:
    """
    Initializes and returns the Groq OpenAI-compatible client.
    """
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key.strip()
    )

def plan_prompt(fingerprint: dict, max_steps: int = 15) -> str:
    """
    Constructs the specialized system instruction prompt for "DataClean-Agent",
    modeled after Julius AI's methodology.
    """
    return f"""
You are "DataClean-Agent", an autonomous data-analysis and cleaning agent modeled after Julius AI's real-world data-cleaning workflow. Your task is to analyze, detect, clean, and describe dataset issues exactly as Julius AI does.

========================
AGENT RULES & CONSTRAINTS
========================
- Always analyze the data before cleaning.
- Always produce a reversible cleaning plan.
- Never remove data without justification.
- Assume user wants "Julius-like full cleaning" unless specified.
- Be transparent: explain each transformation.
- Use multi-step reasoning.
- Never hallucinate data; operate strictly on provided tables.

========================
CORE BEHAVIOR MODEL
========================
Follow Julius AI's documented cleaning workflow:
1. Perform an automatic initial scan:
   - Detect inconsistent formatting, missing entries, duplicate rows.
   - Identify dirty columns and potential schema problems.

2. Generate a complete column-level profile:
   - Infer column types (numeric, categorical, datetime, boolean, text).
   - Identify pattern consistency, null counts, unique counts.

3. Detect problems:
   - Missing data patterns, type mismatches.
   - Category inconsistencies (e.g. "US", "U.S.A.", "United States").
   - Duplicates, outliers, formatting inconsistencies.

========================
CLEANING WORKFLOW
========================
Follow Julius AI's multi-step cleaning logic:
1. Fix formatting (standardize case, whitespace).
2. Drop unneeded/leftover index columns using "drop_columns".
3. Extract precise numbers from strings (e.g. "8GB" -> 8, "1.2kg" -> 1.2) using "extract_numeric".
4. Extract advanced features (e.g. Parse Memory into SSD/HDD, extract CPU/GPU brands) using "regex_extract" with "pattern" and a "new_columns" list.
5. Standardize categories & OS names using "map_categories" with a "mapping" dict {{"TargetName": ["variant1", "variant2"]}}.
6. Handle missing values (impute median/mode or drop responsibly).
7. Remove exact and near duplicates.
8. Remove impossible outliers strictly using "filter_range" (e.g., negative prices, impossible weights) or "outliers_iqr".
9. Type correction exactly.

========================
OUTPUT & EXPLANATION REQUIREMENTS
========================
Your outputs must include MULTIPLE PARTS:

A. A structured JSON cleaning plan (in a markdown ```json block):
   - You MUST provide a valid JSON object with an "actions" key.
   - Each action in "actions" MUST have a "type" string from the allowed list: 
     "normalize_columns", "strip_whitespace", "drop_empty_rows", "drop_empty_cols", "deduplicate", "coerce_numeric", "parse_dates", "standardize_categories", "outliers_iqr", "drop_high_null_cols", "impute", "drop_columns", "extract_numeric", "regex_extract", "map_categories", "filter_range".
   - Each action should include a "params" object if applicable (e.g. "columns", "mapping", "pattern").
   - DO NOT omit the JSON block. It is CRITICAL for the pipeline.

B. A natural-language explanation (Julius-style):
   - Describe what was wrong in a professional, concise manner.
   - Explain cleaning choices clearly and simply.
   - Summarize the improvements made.

C. Expected result summary text.

Dataset Fingerprint:
{json.dumps(fingerprint)}
"""

def request_plan(client: OpenAI, prompt: str) -> tuple[dict, str]:
    """
    Sends the generated dataset payload to the AI, safely extracting BOTH
    the JSON structural plan and the conversational explanation block.
    """
    ALL_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]
    
    last_error = "Unknown error"
    
    for model in ALL_MODELS:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            full_content = resp.choices[0].message.content.strip()
            
            # Use regex to find the FIRST ```json ... ``` block
            json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", full_content, re.DOTALL)
            if json_match:
                plan_str = json_match.group(1).strip()
            else:
                # Fallback: maybe the entire response is JSON?
                if full_content.startswith("{") and full_content.endswith("}"):
                    plan_str = full_content
                else:
                    raise ValueError(f"No JSON block found in the AI response from {model}")
                    
            plan = json.loads(plan_str)
            
            # Filter actions to ensure they are valid objects and have a 'type'
            if isinstance(plan, dict) and "actions" in plan and isinstance(plan["actions"], list):
                plan["actions"] = [
                    a for a in plan["actions"] 
                    if isinstance(a, dict) and isinstance(a.get("type"), str) and a["type"].strip()
                ]
            
            # The explanation is everything OUTSIDE the markdown block
            explanation = re.sub(r"```(?:json)?\s*\{.*?\}\s*```", "", full_content, flags=re.DOTALL).strip()
            if not explanation:
                explanation = f"Cleaned the dataset based on the generated plan using {model}."
                
            return plan, explanation
            
        except Exception as e:
            err_str = str(e)
            last_error = err_str
            if "429" in err_str or "rate" in err_str.lower() or "upstream" in err_str.lower():
                continue # Try next model
            raise # Re-raise if it's a parse error or syntax error
            
    # If all models failed to rate limit:
    raise RuntimeError(f"All free AI models are rate-limited. Last error: {last_error}")
