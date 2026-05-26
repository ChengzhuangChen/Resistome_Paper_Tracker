import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

export const fetchPapers = (params) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
  )
  return api.get('/papers', { params: clean })
}
export const fetchPaper = (id) => api.get(`/papers/${id}`)
export const fetchStats = () => api.get('/stats')
export const fetchTrend = (days = 30) => api.get('/stats/trend', { params: { days } })
export const fetchYearly = () => api.get('/stats/yearly')
export const fetchMonthly = () => api.get('/stats/monthly')
export const triggerUpdate = (token) =>
  api.post('/update', null, { headers: { Authorization: `Bearer ${token}` } })
export const fetchLogs = (params) => api.get('/logs', { params })
export const fetchUpdateLogs = (limit = 7) => api.get('/update-logs', { params: { limit } })
export const fetchVisitorStats = () => api.get('/visitors/stats')
export const recordVisitor = (payload) => api.post('/visitors', payload)
export const visitorPing = () => api.get('/visitors/ping')
export const fetchVisitorMap = () => api.get('/visitors/map')
export const fetchKeywords = (params) => api.get('/keywords', { params })
export const postGuestbook = (payload) => api.post('/guestbook', payload)
export const fetchGuestbook = (params) => api.get('/guestbook', { params })

export default api
