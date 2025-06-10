import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

// Export the context so it can be imported elsewhere
export { AuthContext }

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData.user)
    } catch (error) {
      localStorage.removeItem('token')
      setError('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authService.login(email, password)
      localStorage.setItem('token', response.token)
      setUser(response.user)
      return response
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed')
      throw error
    }
  }

  const register = async (name, email, password) => {
    try {
      setError(null)
      const response = await authService.register(name, email, password)
      localStorage.setItem('token', response.token)
      setUser(response.user)
      return response
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}