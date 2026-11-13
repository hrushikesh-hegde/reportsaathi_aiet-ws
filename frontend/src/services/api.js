import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 120000,
})

export async function getHealth() {
  const response = await api.get('/api/health')
  return response.data
}

export async function analyzeReport(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/api/reports/analyze', formData)
  return response.data
}

export async function explainReport(extractedText, language = 'English') {
  const response = await api.post('/api/reports/explain', {
    extracted_text: extractedText,
    language,
  })
  return response.data
}


export async function chatAboutReport(extractedText, question, language = 'English', history = []) {
  const response = await api.post('/api/reports/chat', {
    extracted_text: extractedText,
    question,
    language,
    history: history.slice(-6),
  })
  return response.data
}
