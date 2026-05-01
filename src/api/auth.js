import axios from 'axios'

const BASE = 'https://web-production-6e253.up.railway.app/api'

export const login = async (username, password) => {
  const res = await axios.post(`${BASE}/token/`, { username, password })
  localStorage.setItem('access_token', res.data.access)
  localStorage.setItem('refresh_token', res.data.refresh)
  return res.data
}

export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

export const isAuthenticated = () => !!localStorage.getItem('access_token')