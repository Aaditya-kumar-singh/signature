import api from './api'

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response
  },

  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password })
    return response
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response
  }
}
