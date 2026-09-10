import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as accountStore from '../data/accountStore'

const AccountContext = createContext(null)

export function AccountProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const current = await accountStore.getAccountSession()
      setAccount(current)
    } catch {
      setAccount(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signup = async (payload) => {
    const created = await accountStore.signup(payload)
    setAccount(created)
    return created
  }

  const login = async (payload) => {
    const loggedIn = await accountStore.login(payload)
    setAccount(loggedIn)
    return loggedIn
  }

  const logout = async () => {
    await accountStore.logout()
    setAccount(null)
  }

  const updateProfile = async (payload) => {
    const updated = await accountStore.updateProfile(payload)
    setAccount(updated)
    return updated
  }

  const changePassword = (payload) => accountStore.changePassword(payload)

  const uploadAvatar = async (file) => {
    const updated = await accountStore.uploadAvatar(file)
    setAccount(updated)
    return updated
  }

  return (
    <AccountContext.Provider
      value={{ account, loading, signup, login, logout, refresh, updateProfile, changePassword, uploadAvatar }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) throw new Error('useAccount must be used within an AccountProvider')
  return context
}
