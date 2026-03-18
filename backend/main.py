import os
import json
import shutil
import uuid
import time
import pandas as pd
from io import BytesIO
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Internal imports from our migrated modules
from utils.data_profiler import load_and_preprocess, dataset_fingerprint
from utils.ai_client import get_openrouter_client, plan_prompt, request_plan
from core.cleaning_engine import clean_dataframe, EngineConfig

# ── CONFIGURATION ──
load_dotenv()

app = FastAPI(title="Optima AI Backend", version="1.0.0")

# Ensure local upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the uploads directory to serve downloaded cleaned files
app.mount("/api/downloads", StaticFiles(directory=UPLOAD_DIR), name="downloads")

# ── MODELS ──
class AnalyzeInitRequest(BaseModel):
    file_path: str

class AnalyzeRequest(BaseModel):
    fingerprint: dict
    model: str | None = None
    api_key: str | None = None

class CleanRequest(BaseModel):
    file_path: str
    fingerprint: dict
    model: str | None = None
    api_key: str | None = None

class ChatRequest(BaseModel):
    prompt: str
    dataset_state: str
    data_info: dict
    safe_summary: str
    model: str | None = None
    api_key: str | None = None

# ── HELPERS ──
def _generate_python_script(original_file_path: str, actions_applied: list, plan_actions: list) -> str:
    """Generates a reproducible Python script from the executed cleaning actions."""
    plan_dict = {"actions": plan_actions}
    plan_json = json.dumps(plan_dict, indent=4)
    
    lines = [
        """#!/usr/bin/env python3
"""
        '"""',
        "Optima AI — Auto-generated Cleaning Script",
        f"Source file: {original_file_path}",
        f"Actions executed: {', '.join(actions_applied) if actions_applied else 'none'}",
        '"""',
        "",
        "import pandas as pd",
        "import numpy as np",
        "import json",
        "",
        "# ── Load raw data ──",
        f"INPUT_FILE = r\"{original_file_path}\"",
        "OUTPUT_FILE = INPUT_FILE.replace('.csv', '_cleaned.csv')",
        "",
        "df = pd.read_csv(INPUT_FILE)",
        "print(f'Loaded: {len(df)} rows x {len(df.columns)} columns')",
        "",
        "# ── Cleaning Plan (AI-generated) ──",
        "CLEANING_PLAN = " + plan_json,
        "",
        "# ── Execute actions ──",
    ]
    
    # Per-action inline code
    action_code = {
        "normalize_columns":      "df.columns = df.columns.str.lower().str.replace(' ', '_').str.strip()",
        "strip_whitespace":       "df = df.apply(lambda c: c.str.strip() if c.dtype == 'object' else c)",
        "drop_empty_rows":        "df.dropna(how='all', inplace=True)",
        "drop_empty_cols":        "df.dropna(axis=1, how='all', inplace=True)",
        "deduplicate":            "df.drop_duplicates(inplace=True)",
        "coerce_numeric":         "df = df.apply(pd.to_numeric, errors='ignore')",
        "parse_dates":            "# parse_dates: applied to date-like columns during cleaning",
        "outliers_iqr":           "# outliers_iqr: IQR clipping applied to numeric columns",
        "impute":                 "df.fillna(df.median(numeric_only=True), inplace=True)\n  for c in df.select_dtypes('object').columns:\n    df[c].fillna(df[c].mode()[0] if not df[c].mode().empty else '', inplace=True)",
        "drop_high_null_cols":    "df.dropna(thresh=int(len(df)*0.5), axis=1, inplace=True)",
        "standardize_categories": "for c in df.select_dtypes('object').columns: df[c] = df[c].str.lower().str.strip()",
        "drop_columns":           "# drop_columns: specific columns dropped per AI plan",
        "extract_numeric":        "# extract_numeric: numbers extracted from text columns",
        "regex_extract":          "# regex_extract: regex patterns applied to extract sub-values",
        "map_categories":         "# map_categories: category values remapped per AI plan",
        "filter_range":           "# filter_range: rows outside valid ranges removed",
    }
    
    for ac in actions_applied:
        code = action_code.get(ac, f"# {ac}: applied")
        lines.append(f"# {ac}")
        for sub in code.split("\n"):
            lines.append(sub)
        lines.append("")
    
    lines += [
        "# ── Save output ──",
        "df.to_csv(OUTPUT_FILE, index=False)",
        "print(f'Saved cleaned data to: {OUTPUT_FILE}')",
        "print(f'Result: {len(df)} rows x {len(df.columns)} columns')",
    ]
    
    return "\n".join(lines)

# ── ENDPOINTS ──
@app.get("/")
def health_check():
    return {"status": "Optima Data Engine is online."}

@app.post("/api/upload")
def upload_file(file: UploadFile = File(...)):
    """Saves an uploaded file locally and returns its path."""
    start_time = time.time()
    try:
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"DEBUG: Upload took {time.time() - start_time:.4f}s")
        return {"file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/api/analyze-init")
def analyze_initial_file(req: AnalyzeInitRequest):
    """Reads the localized file into memory and generates the initial fingerprint."""
    start_time = time.time()
    try:
        # Read local file
        with open(req.file_path, "rb") as f:
            res = f.read()
            
        # Load and preprocess using the existing engine
        df = load_and_preprocess(req.file_path, res)
        fingerprint = dataset_fingerprint(df)
        
        print(f"DEBUG: Analyze-init took {time.time() - start_time:.4f}s")
        return {
            "message": "File analyzed successfully",
            "file_path": req.file_path,
            "shape": fingerprint["shape"],
            "fingerprint": fingerprint,
            "safe_summary": fingerprint.get("safe_summary", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing file from storage: {str(e)}")

@app.post("/api/analyze")
def analyze_data(req: AnalyzeRequest):
    """Takes a dataset fingerprint and generates a cleaning plan via OpenRouter."""
    start_time = time.time()
    api_key = req.api_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="OpenRouter API Key required.")
    
    client = get_openrouter_client(api_key)
    prompt = plan_prompt(req.fingerprint)
    
    try:
        plan, explanation = request_plan(client, prompt)
        print(f"DEBUG: Analyze (AI Plan) took {time.time() - start_time:.4f}s")
        return {
            "plan": plan,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/diagnose")
def diagnose_data(req: AnalyzeRequest):
    """Generates an AI diagnostic report. Auto-retries with fallback models on rate-limit (429)."""
    api_key = req.api_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="OpenRouter API Key required.")

    # All free models — preferred first. If user selected one, try it first.
    ALL_MODELS = [
        "stepfun/step-3.5-flash:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
    ]
    # Put the user's chosen model first in the retry queue
    preferred = req.model if req.model and req.model in ALL_MODELS else ALL_MODELS[0]
    model_queue = [preferred] + [m for m in ALL_MODELS if m != preferred]

    client = get_openrouter_client(api_key)
    last_error = "Unknown error"

    for model in model_queue:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are 'Optima AI', an expert data analyst. Analyze the dataset fingerprint, detect problems, and provide a structured data health report."
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Analyze this dataset fingerprint:\n{json.dumps(req.fingerprint)}\n\n"
                            "Provide a structured report covering:\n"
                            "1. **Data Health Score & Initial Scan** — overall quality score out of 10\n"
                            "2. **Column-level Profile** — type, null %, unique count, problems per column\n"
                            "3. **Detected Issues** — missing data, duplicates, outliers, type mismatches\n"
                            "4. **Recommended Cleaning Workflow** — step-by-step actions to take"
                        )
                    }
                ]
            )
            return {
                "report": response.choices[0].message.content,
                "model_used": model
            }
        except Exception as e:
            err_str = str(e)
            last_error = err_str
            # 429 = rate limit — try next model. Other errors also fall through.
            if "429" in err_str or "rate" in err_str.lower() or "upstream" in err_str.lower():
                continue  # try the next model in the queue
            else:
                # Non-rate-limit error — no point retrying (auth issue, bad request, etc.)
                raise HTTPException(status_code=500, detail=f"AI Engine error: {err_str}")

    # All models exhausted
    raise HTTPException(
        status_code=429,
        detail=(
            "⚠️ All free AI models are currently rate-limited. "
            "Please wait 30–60 seconds and try again. "
            f"Last error: {last_error}"
        )
    )

@app.post("/api/clean")
def clean_dataset(req: CleanRequest):
    """Generates a cleaning plan using AI, executes it on the dataset, and uploads the cleaned version."""
    start_time = time.time()
    api_key = req.api_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="OpenRouter API Key required.")
    
    client = get_openrouter_client(api_key)
    prompt = plan_prompt(req.fingerprint)
    
    try:
        # 1. Get the plan from AI (with multi-model fallback built-in)
        plan, explanation = request_plan(client, prompt)
        
        # 2. Load the local raw file into Pandas
        with open(req.file_path, "rb") as f:
            res = f.read()
        df = load_and_preprocess(req.file_path, res)
        
        # 3. Execute the cleaning plan
        engine_config = EngineConfig()
        cleaned_df, report = clean_dataframe(df, plan, engine_config)
        
        # 4. Generate new fingerprint for the frontend Comparison View
        cleaned_fingerprint = dataset_fingerprint(cleaned_df)
        
        # 5. Save the cleaned CSV into the uploads directory (basename only)
        base_name = os.path.splitext(os.path.basename(req.file_path))[0]
        cleaned_filename = f"{base_name}_cleaned.csv"
        cleaned_file_path = os.path.join(UPLOAD_DIR, cleaned_filename)
        cleaned_df.to_csv(cleaned_file_path, index=False)
        
        # 6. Build a reproducible Python script from executed actions
        actions_applied = report.get("actions_applied", [])
        python_script_content = _generate_python_script(req.file_path, actions_applied, plan.get("actions", []))

        # Save the Python script to the uploads directory
        script_filename = f"{base_name}_cleaning_script.py"
        script_file_path = os.path.join(UPLOAD_DIR, script_filename)
        with open(script_file_path, "w") as f:
            f.write(python_script_content)

        return {
            "message": "Data cleaned successfully",
            "cleaning_report": script_filename,   # The filename
            "explanation": explanation,
            "plan": plan,                         # The JSON plan for action cards
            "python_code": python_script_content, # The actual code content
            "cleaned_data": {
                "file_path": cleaned_filename,
                "shape": cleaned_fingerprint["shape"],
                "fingerprint": cleaned_fingerprint
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during data cleaning: {str(e)}")

@app.get("/api/download/report/{filename}")
def download_report(filename: str):
    """Serves a generated report file (e.g., Python script) for download."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found.")
    
    # Determine media type based on file extension
    media_type = "application/octet-stream"
    if filename.endswith(".py"):
        media_type = "text/x-python"
    elif filename.endswith(".txt"):
        media_type = "text/plain"
    elif filename.endswith(".json"):
        media_type = "application/json"
    
    return FileResponse(path=file_path, filename=filename, media_type=media_type)

@app.post("/api/chat")
def chat_with_data(req: ChatRequest):
    """Streams a chat response based on the dataset profile and user prompt."""
    start_time = time.time()
    api_key = req.api_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="OpenRouter API Key required.")
    
    # Use the model the user selected, fall back to a default
    SUPPORTED_MODELS = [
        "stepfun/step-3.5-flash:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
    ]
    DEFAULT_MODEL = "stepfun/step-3.5-flash:free"
    model = req.model if req.model and req.model in SUPPORTED_MODELS else DEFAULT_MODEL
    
    client = get_openrouter_client(api_key)
    context = f"""
    You are 'Optima AI', an autonomous data-assistant that helps users analyze, clean, and understand their datasets.
    Current Dataset State: {req.dataset_state}
    
    Data Overview: 
    Shape: {req.data_info.get('shape')}
    Null Counts: {req.data_info.get('null_counts')}
    Data Types: {req.data_info.get('dtypes')}
    
    Detailed Summary & Safe Sample:
    {req.safe_summary}
    
    Instructions:
    1. Answer questions clearly, professionally, and insightfully.
    2. The data sample provided is safe and has PII redacted.
    3. Be concise but thorough. Use markdown formatting when appropriate.
    """
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": req.prompt}
            ]
        )
        print(f"DEBUG: Chat with Data (AI) took {time.time() - start_time:.4f}s")
        return {"reply": response.choices[0].message.content, "model_used": model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")
