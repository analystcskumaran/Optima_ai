
---

# 🚀 Optima AI: Intelligent Data Refinery & ML Engine

**Optima AI** is a state-of-the-art Final Year Project designed to automate data cleaning and machine learning evaluation. It combines a high-performance **FastAPI** backend with a premium **Next.js** frontend to provide a seamless "upload-to-insight" experience.

---

## ✨ Key Features & Recent Updates

### 🤖 Intelligent ML Metrics Engine
- **16+ Algorithms**: Integrated a comprehensive suite of models including Random Forest, XGBoost, SVM, LightGBM, and Bayesian Ridge.
- **Auto-ML Capability**: The system automatically detects the best target column and infers the task type (Classification or Regression) if none is provided.
- **Rich Analytics**: Generates Accuracy, F1-Score, Precision, Recall, MAE, MSE, and R² metrics with automated data encoding and scaling.

### 🧹 Advanced Data Refinery
- **AI-Powered Cleaning**: Uses LLMs to generate precise Python cleaning scripts tailored to your specific dataset issues.
- **Visual Diagnosis**: Automated profiling of missing values, duplicates, and data types.
- **Windows Robustness**: Fully optimized for Windows environments with forced UTF-8 encoding to prevent character crashes.

### 🎨 Premium UI/UX
- **Dark-Glass Aesthetic**: A modern, high-performance dashboard designed with Taiwind CSS and Lucide icons.
- **Live Previews**: Compare original vs. cleaned data side-by-side before applying changes.
- **Adaptive Metrics Hub**: A professional, segmented interface for switching between model architectures.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, React 19, Tailwind CSS, Lucide-React.
- **Backend**: Python 3.10+, FastAPI, Scikit-Learn, Pandas, NumPy, XGBoost.
- **AI**: Groq API / Llama 3.3 70B for intelligent script generation.

---

## ⚡ How to Run the Project

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- A [.env](cci:7://file:///d:/final_year_project/Optima_ai/backend/.env:0:0-0:0) file in the `backend` folder with your `GROQ_API_KEY`.

### 2. Setup Backend
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Install deps:
pip install -r requirements.txt
# Launch:
uvicorn main:app --reload --port 8000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
# Start dev server:
npm run dev
```

The app will be available at **`http://localhost:3000`**.

---

## 📂 Project Structure
- **/frontend**: Next.js application, components, and API integration.
- **/backend**: FastAPI routes, `core/` (ML and Cleaning engines), and `utils/`.
- **/backend/uploads**: Temporary storage for processed CSV files.

---
*Created as part of the Final Year Project — Optima AI.*
