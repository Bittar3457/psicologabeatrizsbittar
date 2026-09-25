import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export interface AuthUser extends RecordModel {
  email: string
  name?: string
  avatar?: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  getUserAvatarUrl: (userRecord?: AuthUser | null) => string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (token: string, password: string, passwordConfirm: string) => Promise<void>
  confirmVerification: (token: string) => Promise<void>
  requestEmailChange: (newEmail: string) => Promise<void>
  confirmEmailChange: (token: string, password: string) => Promise<void>
  updateProfile: (data: { name?: string; avatar?: File | null }) => Promise<AuthUser>
  updatePassword: (
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>((pb.authStore.record as AuthUser) || null)
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const syncAuth = useCallback(() => {
    setUser((pb.authStore.record as AuthUser) || null)
    setToken(pb.authStore.token || null)
  }, [])

  useEffect(() => {
    // Listen to changes in auth store
    const unsubscribe = pb.authStore.onChange(() => {
      syncAuth()
    })

    // If we have an existing token, refresh it
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then(() => {
          syncAuth()
        })
        .catch(() => {
          pb.authStore.clear()
          syncAuth()
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [syncAuth])

  const login = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email.trim(), password)
    syncAuth()
  }

  const logout = () => {
    pb.authStore.clear()
    syncAuth()
  }

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      const refreshed = await pb.collection('users').authRefresh()
      setUser(refreshed.record as AuthUser)
      setToken(refreshed.token)
    }
  }

  const requestPasswordReset = async (email: string) => {
    await pb.collection('users').requestPasswordReset(email.trim())
  }

  const confirmPasswordReset = async (
    tokenStr: string,
    password: string,
    passwordConfirm: string,
  ) => {
    await pb.collection('users').confirmPasswordReset(tokenStr, password, passwordConfirm)
  }

  const confirmVerification = async (tokenStr: string) => {
    await pb.collection('users').confirmVerification(tokenStr)
  }

  const requestEmailChange = async (newEmail: string) => {
    await pb.collection('users').requestEmailChange(newEmail.trim())
  }

  const confirmEmailChange = async (tokenStr: string, password: string) => {
    await pb.collection('users').confirmEmailChange(tokenStr, password)
    logout()
  }

  const getUserAvatarUrl = useCallback(
    (targetUser?: AuthUser | null): string | null => {
      const record = targetUser !== undefined ? targetUser : user
      if (
        !record ||
        !record.avatar ||
        typeof record.avatar !== 'string' ||
        record.avatar.trim() === ''
      ) {
        return null
      }
      try {
        return pb.files.getURL(record, record.avatar)
      } catch {
        return null
      }
    },
    [user],
  )

  const updateProfile = async (data: {
    name?: string
    avatar?: File | null
  }): Promise<AuthUser> => {
    if (!pb.authStore.record?.id) throw new Error('Não autenticado')
    const formData = new FormData()
    if (data.name !== undefined) {
      formData.append('name', data.name)
    }
    if (data.avatar instanceof File) {
      formData.append('avatar', data.avatar)
    } else if (data.avatar === null) {
      formData.append('avatar', '')
    }

    const updated = await pb.collection('users').update<AuthUser>(pb.authStore.record.id, formData)
    // Atualiza authStore local para manter consistência total com pb.authStore.record
    pb.authStore.save(pb.authStore.token, updated)
    setUser(updated)
    return updated
  }

  const updatePassword = async (
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
  ) => {
    if (!pb.authStore.record?.id) throw new Error('Não autenticado')
    await pb.collection('users').update(pb.authStore.record.id, {
      oldPassword,
      password: newPassword,
      passwordConfirm: newPasswordConfirm,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && pb.authStore.isValid,
        isLoading,
        getUserAvatarUrl,
        login,
        logout,
        refreshUser,
        requestPasswordReset,
        confirmPasswordReset,
        confirmVerification,
        requestEmailChange,
        confirmEmailChange,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
