'use client'

import '@/styles/auth.css'
import React, { useState, useEffect } from 'react'
import { useRouter }  from 'next/navigation'
import Link           from 'next/link'
import { useAuth }    from '@/contexts/AuthContext'
import { authRegister, ApiError } from '@/lib/api'

export default function RegisterPage() {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    const [fullName,    setFullName]    = useState('')
    const [email,       setEmail]       = useState('')
    const [password,    setPassword]    = useState('')
    const [specialite,  setSpecialite]  = useState('')
    const [submitting,  setSubmitting]  = useState(false)
    const [error,       setError]       = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!isLoading && isAuthenticated) router.replace('/dashboard')
    }, [isLoading, isAuthenticated, router])

    function validate(): boolean {
        const e: Record<string, string> = {}
        if (!fullName.trim())    e.fullName   = 'Le nom complet est requis.'
        if (!email.trim())       e.email      = "L'adresse e-mail est requise."
        if (password.length < 8) e.password   = 'Minimum 8 caractères.'
        if (!specialite.trim())  e.specialite = 'La spécialité est requise.'
        setFieldErrors(e)
        return Object.keys(e).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        if (!validate()) return

        setSubmitting(true)
        try {
            await authRegister({
                email:      email.trim().toLowerCase(),
                password,
                full_name:  fullName.trim(),
                specialite: specialite.trim(),
            })
            // Redirect to login page with success flag
            router.push('/login?registered=1')
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 409)
                    setError('Cet email est déjà utilisé.')
                else if (err.status === 422)
                    setError('Données invalides. Vérifiez les champs.')
                else if (err.status === 404 || err.status === 0)
                    setError('Serveur inaccessible. Démarrez le backend : uvicorn main:app --reload')
                else
                    setError(err.message)
            } else {
                setError('Erreur réseau. Vérifiez que le serveur backend est démarré.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    if (isLoading || isAuthenticated) return <Spinner />

    return (
        <div className="auth-root">
            <div className="auth-grid" />

            <div className="auth-card" style={{ maxWidth: '480px' }}>

                <div className="auth-logo">
                    <div className="auth-logo-icon">🧠</div>
                    <div className="auth-logo-title">Stroke<span>AI</span></div>
                    <div className="auth-logo-sub">Espace médecin</div>
                </div>

                <h1 className="auth-heading">Créer votre compte</h1>
                <p className="auth-subheading">
                    Inscrivez-vous en tant que médecin. Vous pourrez ensuite créer le compte de votre secrétaire depuis votre tableau de bord.
                </p>

                {error && (
                    <div className="auth-error">
                        <ErrIcon />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} autoComplete="on" noValidate>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="fullName">Nom complet *</label>
                        <input
                            id="fullName"
                            type="text"
                            className="auth-input"
                            placeholder="Dr. Ahmed Bensalem"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            autoComplete="name"
                        />
                        {fieldErrors.fullName && <span className="auth-field-error">{fieldErrors.fullName}</span>}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="specialite">Spécialité médicale *</label>
                        <input
                            id="specialite"
                            type="text"
                            className="auth-input"
                            placeholder="Ex : Neurologie, Cardiologie…"
                            value={specialite}
                            onChange={e => setSpecialite(e.target.value)}
                        />
                        {fieldErrors.specialite && <span className="auth-field-error">{fieldErrors.specialite}</span>}
                    </div>

                    <div className="auth-row-2">
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="email">Email *</label>
                            <input
                                id="email"
                                type="email"
                                className="auth-input"
                                placeholder="docteur@hopital.fr"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                            {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="password">
                                Mot de passe *{' '}
                                <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(min. 8 car.)</span>
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={submitting} style={{ marginTop: '0.75rem' }}>
                        {submitting && <span className="auth-spinner" />}
                        {submitting ? 'Création du compte…' : 'Créer mon compte médecin'}
                    </button>
                </form>

                <p className="auth-link-row" style={{ marginTop: '1.25rem' }}>
                    Déjà inscrit ?{' '}
                    <Link href="/login" className="auth-link">Se connecter</Link>
                </p>

            </div>
        </div>
    )
}

function Spinner() {
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

function ErrIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="6" stroke="#dc2626" strokeWidth="1.5"/>
            <path d="M7 4v3M7 9.5v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    )
}
