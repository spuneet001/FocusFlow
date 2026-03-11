import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

// ── Tasks ─────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: () => api.get('/tasks'),
  getByDate: (date) => api.get(`/tasks/date/${date}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  toggleDone: (id) => api.patch(`/tasks/${id}/toggle`),
  updateEndTime: (id, data) => api.patch(`/tasks/${id}/end-time`, data),
  markStartReminderShown: (id) => api.patch(`/tasks/${id}/start-reminder`),
  uploadPhoto: (id, photoData) => api.patch(`/tasks/${id}/photo`, { photoData }),
  delete: (id) => api.delete(`/tasks/${id}`),
}

// ── AI Agent ──────────────────────────────────────────────────────────────
export const aiApi = {
  generatePlan: (goal) => api.post('/ai/plan', { goal }),
  chat: (message, planId, history) => api.post('/ai/chat', { message, planId, history }),
  getPlans: () => api.get('/ai/plans'),
}

// ── Reports ───────────────────────────────────────────────────────────────
export const reportsApi = {
  getCurrent: () => api.get('/reports/current'),
  getByWeek: (weekStart) => api.get(`/reports/week?start=${weekStart}`),
  getHistory: () => api.get('/reports'),
}

// ── User ──────────────────────────────────────────────────────────────────
export const userApi = {
  me: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me/profile', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  getGallery: () => api.get('/users/me/gallery'),
  upgradePlan: (plan) => api.patch('/users/me/plan', { plan }),
}

export default api
