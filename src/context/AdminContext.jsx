import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/apiClient'

const AdminContext = createContext(null)

const VIEW_MODE_KEY = 'blog:viewMode'

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewModeState] = useState(
    () => sessionStorage.getItem(VIEW_MODE_KEY) || 'admin',
  )

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/admin/session')
      setIsAdmin(Boolean(data.isAdmin))
    } catch {
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setViewMode = (mode) => {
    setViewModeState(mode)
    sessionStorage.setItem(VIEW_MODE_KEY, mode)
  }

  // Returns the raw response so Login.jsx can branch on
  // `needsTwoFactor` — isAdmin only flips to true once fully signed in
  // (immediately here, or via verifyTwoFactor below).
  const login = async (password) => {
    const data = await api.post('/api/admin/login', { password })
    if (data.needsTwoFactor) return data
    setIsAdmin(true)
    setViewMode('admin')
    return data
  }

  const verifyTwoFactor = async (pendingToken, code) => {
    await api.post('/api/admin/verify-two-factor', { pendingToken, code })
    setIsAdmin(true)
    setViewMode('admin')
  }

  const logout = async () => {
    await api.post('/api/admin/logout', {})
    setIsAdmin(false)
  }

  const effectiveIsAdmin = isAdmin && viewMode === 'admin'

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        effectiveIsAdmin,
        viewMode,
        setViewMode,
        loading,
        login,
        verifyTwoFactor,
        logout,
        refresh,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within an AdminProvider')
  return context
}
