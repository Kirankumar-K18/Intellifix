import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: auto-refresh JWT ──────────────────────────────────
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          data  => api.post('/auth/login/', data),
  register:       data  => api.post('/auth/register/', data),
  logout:         data  => api.post('/auth/logout/', data),
  getProfile:     ()    => api.get('/auth/profile/'),
  updateProfile:  data  => api.patch('/auth/profile/', data),
  changePassword: data  => api.put('/auth/change-password/', data),
  getUsers:       (p='') => api.get(`/auth/users/?${p}`),
  getUser:        id    => api.get(`/auth/users/${id}/`),
  createUser:     data => api.post('/auth/users/', data),
  updateUser:     (id,d)=> api.patch(`/auth/users/${id}/`, d),
  deleteUser:     id    => api.delete(`/auth/users/${id}/`),
}

// ── Departments ───────────────────────────────────────────────────────────────
export const deptAPI = {
  getAll:   (p='')   => api.get(`/departments/?${p}`),
  get:      id       => api.get(`/departments/${id}/`),
  create:   data     => api.post('/departments/', data),
  update:   (id, d)  => api.patch(`/departments/${id}/`, d),
  delete:   id       => api.delete(`/departments/${id}/`),
}

// ── Complaints ────────────────────────────────────────────────────────────────
export const complaintAPI = {
  getAll:   (p='')  => api.get(`/complaints/?${p}`),
  getMine:  ()      => api.get('/complaints/mine/'),
  get:      id      => api.get(`/complaints/${id}/`),
  create:   data    => api.post('/complaints/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update:   (id, d) => api.patch(`/complaints/${id}/`, d),
  delete:   id      => api.delete(`/complaints/${id}/`),
  addFeedback:  d   => api.post('/complaints/feedback/add/', d),
  getFeedback:  ()  => api.get('/complaints/feedback/'),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  overview:    ()    => api.get('/analytics/'),
  department:  (p='') => api.get(`/analytics/department/?${p}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifAPI = {
  getAll:       ()   => api.get('/notifications/'),
  unreadCount:  ()   => api.get('/notifications/unread-count/'),
  markRead:     id   => api.post(`/notifications/${id}/read/`),
  markAllRead:  ()   => api.post('/notifications/mark-all-read/'),
}

// ── Chatbot / ML ──────────────────────────────────────────────────────────────
export const chatbotAPI = {
  suggestDept:     data => api.post('/chatbot/suggest/', data),
  predictPriority: data => api.post('/chatbot/predict-priority/', data),
}

export default api
