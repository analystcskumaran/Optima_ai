import streamlit as st
import pandas as pd
from openai import OpenAI
import os
from dotenv import load_dotenv

# Modern UI Config
st.set_page_config(page_title="Optima | Data Refinery", layout="wide", page_icon="💎")
load_dotenv(".env")
load_dotenv(".env.example") # Fallback to .env.example if .env is missing

# Style Injection for "Attraction"
st.markdown("""
    <style>
    /* Glassmorphism & Dark Mode Aesthetic */
    .stApp {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
    }
    
    /* Input & Upload styles */
    .stFileUploader, [data-testid="stFileUploader"] {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        backdrop-filter: blur(10px);
    }

    /* Chat styling */
    .stChatMessage {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 10px;
        margin-bottom: 10px;
    }
    
    /* Buttons */
    .stButton>button {
        border-radius: 8px;
        background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        transition: all 0.3s ease;
        padding: 10px 24px;
        font-weight: 600;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
        color: white;
    }

    /* Cards */
    div[data-testid="stMetricValue"] {
        font-size: 2.2rem;
        font-weight: 700;
        color: #60a5fa;
    }
    
    .stAlert {
        background: rgba(59, 130, 246, 0.1) !important;
        border: 1px solid rgba(59, 130, 246, 0.2) !important;
        color: #e2e8f0 !important;
        border-radius: 8px;
    }
    
    div[data-testid="stSidebar"] {
        background: rgba(15, 23, 42, 0.95);
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
    </style>
""", unsafe_allow_html=True)

# Helper to load API Key
def get_api_key():
    load_dotenv(override=True)
    return os.getenv("OPENROUTER_API_KEY")

# Local Preprocessing & Privacy
def local_preprocess(df):
    """Executes instant local cleaning before AI is involved."""
    df_clean = df.copy()
    # Remove 100% empty rows
    df_clean.dropna(how='all', inplace=True)
    # Remove 100% empty columns
    df_clean.dropna(axis=1, how='all', inplace=True)
    # Strip trailing whitespaces for string columns
    str_cols = df_clean.select_dtypes(include=['object']).columns
    for col in str_cols:
         df_clean[col] = df_clean[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
    return df_clean

def get_safe_data_summary(df, sample_size=5):
    """Redacts PII data (email, phone, name) before sending sample to AI."""
    safe_df = df.head(sample_size).copy()
    import re
    pii_patterns = ['email', 'phone', 'name', 'address', 'ssn', 'credit', 'card', 'password']
    
    for col in safe_df.columns:
        col_lower = col.lower()
        if any(re.search(word, col_lower) for word in pii_patterns):
             safe_df[col] = "[REDACTED]"
             
    data_summary = f"Columns: {df.columns.tolist()} \\nStats: {df.describe(include='all').to_json()} \\nSafe Sample: {safe_df.to_json()}"
    return data_summary


# Application Sidebar
with st.sidebar:
    st.title("⚙️ Optima Settings")
    st.markdown("Configure your AI Brain.")
    
    env_api_key = get_api_key()
    
    if env_api_key and len(env_api_key) > 5:
        api_key_input = env_api_key
        st.success("✅ Securely connected via Environment Variables.")
    else:
        api_key_input = st.text_input("OpenRouter API Key", type="password")
        if not api_key_input:
            st.warning("⚠️ Please provide your OpenRouter API Key to activate the AI Brain.")
            
    st.markdown("---")
    st.caption("Optima Data Refinery Pro v1.0")

if api_key_input:
    # Explicitly set headers to avoid 401 "Missing Authentication header"
    # Some older versions or specific setups might need this
    headers = {
        "Authorization": f"Bearer {api_key_input}",
        "HTTP-Referer": "http://localhost:8501",
        "X-OpenRouter-Title": "Optima Data Refinery",
    }
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key_input,
        default_headers=headers
    )
    # Store in session state for consistency
    st.session_state.client = client
else:
    client = None
    st.session_state.client = None

# Main Dashboard
st.title("💎 Optima Data Refinery")
st.markdown("<p style='color: #94a3b8; font-size: 1.2rem;'>AI-Powered CSV Cleaning & Redundancy Elimination</p>", unsafe_allow_html=True)

uploaded_file = st.file_uploader("Drop your dirty dataset here", type=['csv', 'xlsx'])

if uploaded_file and client:
    
    # --- Reset State on New File Upload ---
    if "current_file" not in st.session_state or st.session_state.current_file != uploaded_file.name:
        st.session_state.current_file = uploaded_file.name
        # Clear out previous AI runs/reports/chat
        for key in ["diagnostic_report", "cleaned_df", "last_code", "messages", "approved_refinery"]:
            if key in st.session_state:
                del st.session_state[key]
                
    try:
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file)
            
        # Apply Local Preprocessing automatically
        df = local_preprocess(df)
            
        st.write("### Raw Data Preview")
        st.dataframe(df.head(5), use_container_width=True)
        # Initialize chat history early
        if "messages" not in st.session_state:
            st.session_state.messages = []

        # Use tabs to separate AI tasks
        tab1, tab2, tab3 = st.tabs(["📊 Data Refinery", "🔍 Comparison View", "💬 Chat with AI"])

        with tab1:
            # --- PHASE 1: AI DIAGNOSTICS ---
            st.subheader("🕵️ AI Diagnostic Report")
        
        # We need a session state to hold the generated code to prevent re-running on every interaction
        if "diagnostic_report" not in st.session_state:
            with st.spinner("Optima AI is analyzing data patterns..."):
                # We send metadata + safe sample to Gemini 3.1 Pro
                # Limit the number of columns and rows we send to avoid token limits
                data_summary = get_safe_data_summary(df, sample_size=50)
                
                try:
                    response = client.chat.completions.create(
                        model="stepfun/step-3.5-flash:free",
                        messages=[
                            {"role": "system", "content": "You are Optima AI, a data quality expert. Analyze the provided data summary and suggest a precise cleaning plan."},
                            {"role": "user", "content": f"Analyze this dataset summary for errors, duplicates, and logical inconsistencies:\n{data_summary}\n\nProvide a structured report with:\n1. Data Health Score (0-100)\n2. Key Issues Identified\n3. Recommended Cleaning Steps (max 5)"}
                        ],
                        extra_body={"reasoning": {"enabled": True}}
                    )
                    st.session_state.diagnostic_report = response.choices[0].message.content
                except Exception as e:
                    st.error(f"Error calling OpenRouter API: {str(e)}")
                    st.session_state.diagnostic_report = "Failed to generate AI report."
                
        if "diagnostic_report" in st.session_state:
            st.info(st.session_state.diagnostic_report)

        # --- PHASE 2: APPROVAL & CLEANING ---
        st.markdown("---")
        
        # We track if the button was ever pushed for this file
        if st.button("🚀 Approve & Refine Data"):
            st.session_state.approved_refinery = True
            
        if st.session_state.get('approved_refinery', False):
            
            # Only run the AI code generation if we haven't already saved it
            if "cleaned_df" not in st.session_state:
                with st.spinner("Optima AI is generating refinery code..."):
                    data_summary = get_safe_data_summary(df, sample_size=5)
                    report = st.session_state.get('diagnostic_report', 'No report generated.')
                    
                    prompt = f"""
                    You are a Python Data Scientist. Based on the diagnostic report below and the dataset summary, generate Python code using pandas to clean the dataframe `df`.
                    
                    Diagnostic Report:
                    {report}
                    
                    Dataset Summary:
                    {data_summary}
                    
                    Requirements:
                    1. The input dataframe is named `df`.
                    2. The final cleaned dataframe MUST be named `df_cleaned`.
                    3. Perform the 6-phase refinery: Structural, Semantic, Fuzzy, Forensic Audit, Imputation, and Verification (as much as possible in code).
                    4. Use `pd.to_numeric` with `errors='coerce'` for unit stripping and type forcing.
                    5. Use `IQR` method for outliers.
                    6. Handle missing values with median (for numbers) and mode (for categories).
                    7. Return ONLY the Python code inside a markdown code block. Do not include any explanations.
                    """
                    
                    try:
                        response = client.chat.completions.create(
                            model="stepfun/step-3.5-flash:free",
                            messages=[{"role": "user", "content": prompt}]
                        )
                        generated_code = response.choices[0].message.content
                        
                        # Extract code from markdown block
                        import re
                        code_match = re.search(r'```python\n(.*?)```', generated_code, re.DOTALL)
                        if not code_match:
                             code_match = re.search(r'```(.*?)```', generated_code, re.DOTALL)
                        
                        code_to_run = code_match.group(1) if code_match else generated_code
                        
                        # Execute code safely (on a copy)
                        exec_globals = {"df": df.copy(), "pd": pd}
                        exec(code_to_run, exec_globals)
                        
                        if "df_cleaned" in exec_globals:
                            st.session_state.cleaned_df = exec_globals["df_cleaned"]
                            st.session_state.last_code = code_to_run
                        else:
                            st.error("AI generated code but 'df_cleaned' was not found. Please try again.")
                    except Exception as e:
                        st.error(f"Error during AI Refinery: {str(e)}")
                        # Fallback to simple cleaning if AI fails
                        st.session_state.cleaned_df = df.dropna().drop_duplicates()
                    
            if "cleaned_df" in st.session_state:
                st.success("Refinery Process Complete! ✨")
                if "last_code" in st.session_state:
                    with st.expander("Show AI-Generated Cleaning Code"):
                        st.code(st.session_state.last_code, language='python')
            
            # --- PHASE 6: Verification (Production Readiness) ---
            st.markdown("### 📊 Phase 6: Production Readiness Audit")
            
            # FIX: Convert any accidental lists/objects into strings so .duplicated() works
            temp_df = st.session_state.cleaned_df.copy()
            for col in temp_df.columns:
                # If a cell contains a list, join it into a string; otherwise leave it
                temp_df[col] = temp_df[col].apply(lambda x: ", ".join(map(str, x)) if isinstance(x, list) else x)

            col1, col2, col3, col4 = st.columns(4)
            
            original_rows = len(df)
            cleaned_rows = len(temp_df)
            rows_removed = original_rows - cleaned_rows
            
            original_nulls = df.isnull().sum().sum()
            cleaned_nulls = temp_df.isnull().sum().sum()
            nulls_fixed = original_nulls - cleaned_nulls
            
            # Now .duplicated() will work because temp_df contains no lists
            remaining_issues = cleaned_nulls + (temp_df.duplicated().sum())
            readiness_score = max(0, 100 - int((remaining_issues / (len(temp_df) * len(temp_df.columns) + 1)) * 100))

            with col1:
                st.metric("Rows Processed", int(original_rows))
            with col2:
                st.metric("Rows Removed", int(rows_removed), delta=int(-rows_removed) if rows_removed > 0 else 0)
            with col3:
                st.metric("Nulls Fixed", int(nulls_fixed), delta=int(nulls_fixed) if nulls_fixed > 0 else 0)
            with col4:
                st.metric("Readiness Score", f"{readiness_score}%", help="Higher is better for Power BI / SQL import")
                
            st.write("### Refined Data Sample (After 6-Phase Refinery)")
            st.dataframe(st.session_state.cleaned_df.head(10), use_container_width=True)

            # --- PHASE 3: DOWNLOAD ---
            st.markdown("---")
            csv = st.session_state.cleaned_df.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="📥 Download Refined CSV", 
                data=csv, 
                file_name="optima_refined.csv",
                mime="text/csv",
                use_container_width=True
            )

        with tab2:
            st.subheader("🔍 Comparison View")
            if "cleaned_df" in st.session_state:
                st.markdown("Compare your original data with the refined data.")
                col_orig, col_clean = st.columns(2)
                
                with col_orig:
                    st.metric("Original Rows", len(df))
                    st.metric("Original Columns", len(df.columns))
                    with st.expander("View Original Data", expanded=True):
                        st.dataframe(df.head(50), use_container_width=True)
                        
                with col_clean:
                    cleaned_df = st.session_state.cleaned_df
                    st.metric("Cleaned Rows", len(cleaned_df))
                    st.metric("Cleaned Columns", len(cleaned_df.columns))
                    with st.expander("View Cleaned Data", expanded=True):
                        st.dataframe(cleaned_df.head(50), use_container_width=True)
            else:
                st.info("Run the Data Refinery first to see the comparison.")

        with tab3:
            st.subheader("💬 Chat with AI Brain")
            st.caption("Ask questions about your data or give specific refinement instructions before downloading.")
            
            # Display chat messages from history on app rerun
            for message in st.session_state.messages:
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])

            # React to user input
            if prompt := st.chat_input("Ask Optima about your data..."):
                # Display user message in chat message container
                st.chat_message("user").markdown(prompt)
                # Add user message to chat history
                st.session_state.messages.append({"role": "user", "content": prompt})

                # Detailed context for the AI
                active_df = st.session_state.cleaned_df if "cleaned_df" in st.session_state else df
                dataset_state = 'Refined' if 'cleaned_df' in st.session_state else 'Raw'
                
                # Use safe summary for PII protection even in chat context
                safe_summary = get_safe_data_summary(active_df, sample_size=10)
                
                data_info = {
                    "shape": active_df.shape,
                    "null_counts": active_df.isnull().sum().to_dict(),
                    "dtypes": active_df.dtypes.astype(str).to_dict()
                }
                
                context = f"""
                You are Optima, an AI Data Assistant. You are chatting with a user about their dataset.
                Current Dataset State: {dataset_state}
                
                Data Overview: 
                Shape: {data_info['shape']}
                Null Counts: {data_info['null_counts']}
                Data Types: {data_info['dtypes']}
                
                Detailed Summary & Safe Sample:
                {safe_summary}
                
                Instructions:
                1. Answer questions accurately based on the data properties provided.
                2. Be concise and helpful.
                3. The data sample provided is safe and has PII redacted. If the user asks about specific sensitive values (like an email), inform them that you only see redacted data to protect privacy.
                """
                
                with st.spinner("Thinking..."):
                    try:
                        # Call OpenRouter for a response with reasoning
                        response = client.chat.completions.create(
                            model="stepfun/step-3.5-flash:free",
                            messages=[
                                {"role": "system", "content": context},
                                {"role": "user", "content": prompt}
                            ],
                            extra_body={"reasoning": {"enabled": True}}
                        )
                        bot_reply = response.choices[0].message.content
                        if hasattr(response.choices[0].message, "reasoning_details") and response.choices[0].message.reasoning_details:
                            # Optionally append reasoning if present (depends on how you want to display it)
                            pass # We only show the final content for clean UI, but it generated with reasoning
                    except Exception as e:
                        bot_reply = f"Error calling AI Brain: {str(e)}"

                # Display assistant response in chat message container
                with st.chat_message("assistant"):
                    st.markdown(bot_reply)
                # Add assistant response to chat history
                st.session_state.messages.append({"role": "assistant", "content": bot_reply})
                
    except Exception as e:
        st.error(f"Error processing file: {str(e)}")
elif not client:
    st.info("👈 Please enter your OpenRouter API Key in the sidebar to begin.")
