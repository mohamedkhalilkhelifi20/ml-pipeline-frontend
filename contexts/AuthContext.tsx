'use client'

// =============================================================================
// contexts/AuthContext.tsx — JWT auth state, persisted in localStorage
// =============================================================================

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react'
import { authLogin, authMe, authRegister, DoctorRegisterRequest, TokenResponse, UserOut } from '@/lib/api'

const TOKEN_KEY = 'strokeai_token'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
    user:            UserOut | null
    token:           string | null
    isLoading:       boolean
    isAuthenticated: boolean
    login:           (email: string, password: string) => Promise<void>
    register:        (data: DoctorRegisterRequest) => Promise<void>
    logout:          () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user,      setUser]      = useState<UserOut | null>(null)
    const [token,     setToken]     = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Restore session from localStorage on mount
    useEffect(() => {
        const stored = typeof window !== 'undefined'
            ? localStorage.getItem(TOKEN_KEY)
            : null

        if (!stored) {
            setIsLoading(false)
            return
        }

        authMe(stored)
            .then(u => {
                setToken(stored)
                setUser(u)
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY)
            })
            .finally(() => setIsLoading(false))
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        const res: TokenResponse = await authLogin(email, password)
        localStorage.setItem(TOKEN_KEY, res.access_token)
        setToken(res.access_token)
        const me = await authMe(res.access_token)
        setUser(me)
    }, [])

    const register = useCallback(async (data: DoctorRegisterRequest) => {
        // Create account, then auto-login
        await authRegister(data)
        const res = await authLogin(data.email, data.password)
        localStorage.setItem(TOKEN_KEY, res.access_token)
        setToken(res.access_token)
        const me = await authMe(res.access_token)
        setUser(me)
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
        }),
        [user, token, isLoading, login, register, logout]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
    return ctx
}
