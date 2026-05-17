'use client'

import '@/styles/auth.css'
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link                           from 'next/link'
import { useAuth }                    from '@/contexts/AuthContext'
import { ApiError }                   from '@/lib/api'

function LoginForm() {
    const { login, isAuthenticated, isLoading } = useAuth()
    const router       = useRouter()
    const searchParams = useSearchParams()
    const justRegistered = searchParams.get('registered') === '1'

    const [email,    setEmail]    = useState('')
    const [password, setPassword] = useState('')
    const [loading,  setLoading]  = useState(false)
    const [error,    setError]    = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && isAuthenticated) router.replace('/dashboard')
    }, [isLoading, isAuthenticated, router])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await login(email, password)
            router.push('/dashboard')
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401)      setError('Email ou mot de passe incorrect.')
                else if (err.status === 403) setError('Compte désactivé. Contactez l\'administrateur.')
                else if (err.status === 404 || err.status === 0)
                    setError('Serveur inaccessible. Démarrez le backend : uvicorn main:app --reload')
                else setError(err.message)
            } else {
                setError('Erreur réseau. Vérifiez que le serveur est démarré.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (isLoading || isAuthenticated) {
        return (
            <div className="auth-root">
                <div className="auth-grid" />
                <div style={{
                    width: 36, height: 36,
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
            </div>
        )
    }

    return (
        <div className="auth-root">
            <div className="auth-grid" />

            <div className="auth-card">

                <div className="auth-logo">
                    <div className="auth-logo-icon">🧠</div>
                    <div className="auth-logo-title">Stroke<span>AI</span></div>
                    <div className="auth-logo-sub">Plateforme clinique ML</div>
                </div>

                <h1 className="auth-heading">Connexion</h1>
                <p className="auth-subheading">
                    Accédez à votre espace médical sécurisé
                </p>

                {justRegistered && (
                    <div className="auth-success">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="7" cy="7" r="6" stroke="#16a34a" strokeWidth="1.5"/>
                            <path d="M4.5 7l2 2 3-3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Compte créé avec succès ! Connectez-vous pour accéder à votre tableau de bord.
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="7" cy="7" r="6" stroke="#dc2626" strokeWidth="1.5"/>
                            <path d="M7 4v3M7 9.5v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} autoComplete="on">
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="email">Adresse e-mail</label>
                        <input
                            id="email"
                            type="email"
                            className="auth-input"
                            placeholder="docteur@hopital.fr"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="password">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading && <span className="auth-spinner" />}
                        {loading ? 'Connexion…' : 'Se connecter'}
                    </button>
                </form>

                <p className="auth-link-row" style={{ marginTop: '1.25rem' }}>
                    Pas encore de compte ?{' '}
                    <Link href="/register" className="auth-link">Créer un compte médecin</Link>
                </p>

            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
