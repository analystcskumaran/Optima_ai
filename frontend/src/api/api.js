import axios from 'axios';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

const client = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'http://localhost:5173',
    'X-OpenRouter-Title': 'Optima AI Refinery',
    'Content-Type': 'application/json'
  }
});

export const getAiDiagnostic = async (summary) => {
  try {
    const response = await client.post('/chat/completions', {
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are Optima AI, a data quality expert. Analyze the provided data summary and suggest a precise cleaning plan.' },
        { role: 'user', content: `Analyze this dataset summary for errors, duplicates, and logical inconsistencies:\n${summary}\n\nProvide a structured report with:\n1. Data Health Score (0-100)\n2. Key Issues Identified\n3. Recommended Cleaning Steps (max 5)` }
      ]
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI Diagnostic Error:", error);
    throw error;
  }
};

export const getRefinementCode = async (summary, report) => {
  try {
    const prompt = `
      You are a JavaScript Data Scientist. Based on the diagnostic report below and the dataset summary, generate JavaScript code to clean an array of objects named 'data'.
      
      Diagnostic Report:
      ${report}
      
      Dataset Summary:
      ${summary}
      
      Requirements:
      1. The input array is named 'data'.
      2. The final cleaned array MUST be named 'cleanedData'.
      3. Use standard modern JavaScript.
      4. Preserve ALL original columns in each object unless explicitly told to drop them.
      5. Return ONLY the code inside a markdown code block. Do not include any explanations.
    `;

    const response = await client.post('/chat/completions', {
      model: MODEL,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.data.choices[0].message.content;
    const codeMatch = content.match(/```javascript\n([\s\S]*?)```/) || content.match(/```\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1] : content;
  } catch (error) {
    console.error("AI Refinement Error:", error);
    throw error;
  }
};

export const sendMessage = async (userText, context = "") => {
  try {
    const response = await client.post('/chat/completions', {
      model: MODEL,
      messages: [
        { role: 'system', content: `You are Optima, an AI Data Assistant. ${context}` },
        { role: 'user', content: userText }
      ]
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};
