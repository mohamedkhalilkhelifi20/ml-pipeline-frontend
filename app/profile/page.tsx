'use client'

import '@/styles/dashboard.css'
import '@/styles/clients.css'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppTopbar from '@/components/AppTopbar'
import { updateProfile, changePassword, ApiError } from '@/lib/api'

export default function ProfilePage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    const [fullName,   setFullName]   = useState('')
    const [email,      setEmail]      = useState('')
    const [telephone,  setTelephone]  = useState('')
    const [adresse,    setAdresse]    = useState('')
    const [specialite, setSpecialite] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [profileMsg,    setProfileMsg]    = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [currentPwd, setCurrentPwd] = useState('')
    const [newPwd,     setNewPwd]     = useState('')
    const [confirmPwd, setConfirmPwd] = useState('')
    const [savingPwd,  setSavingPwd]  = useState(false)
    const [pwdMsg,     setPwdMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (user) {
            setFullName(user.full_name ?? '')
            setEmail(user.email ?? '')
            setTelephone(user.telephone ?? '')
            setAdresse(user.adresse ?? '')
            setSpecialite(user.specialite ?? '')
        }
    }, [user])

    const handleProfileSave = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return
        if (!fullName.trim()) {
            setProfileMsg({ type: 'error', text: 'Le nom complet est obligatoire.' })
            return
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setProfileMsg({ type: 'error', text: 'Adresse email invalide.' })
            return
        }
        setSavingProfile(true)
        setProfileMsg(null)
        try {
            await updateProfile(token, {
                full_name:  fullName.trim(),
                email:      email.trim()     || undefined,
                telephone:  telephone.trim() || undefined,
                adresse:    adresse.trim()   || undefined,
                specialite: specialite.trim() || undefined,
            })
            setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès.' })
        } catch (err) {
            setProfileMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour.' })
        } finally {
            setSavingProfile(false)
        }
    }, [token, fullName, telephone, adresse, specialite])

    const handlePasswordSave = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return
        if (!currentPwd || !newPwd || !confirmPwd) {
            setPwdMsg({ type: 'error', text: 'Tous les champs sont obligatoires.' })
            return
        }
        if (newPwd !== confirmPwd) {
            setPwdMsg({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' })
            return
        }
        if (newPwd.length < 8) {
            setPwdMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
            return
        }
        setSavingPwd(true)
        setPwdMsg(null)
        try {
            await changePassword(token, { current_password: currentPwd, new_password: newPwd })
            setPwdMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' })
            setCurrentPwd('')
            setNewPwd('')
            setConfirmPwd('')
        } catch (err) {
            setPwdMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erreur lors du changement de mot de passe.' })
        } finally {
            setSavingPwd(false)
        }
    }, [token, currentPwd, newPwd, confirmPwd])

    if (isLoading || !user) {
        return <div className="dash-loading"><div className="dash-loading-spinner" /></div>
    }

    const roleLabel = user.role === 'doctor' ? 'Médecin' : user.role === 'secretary' ? 'Secrétaire' : 'Administrateur'

    return (
        <div className="dash-root">
            <AppTopbar />

            <div className="dash-body">
                <div className="dash-header">
                    <div className="dash-greeting">Mon profil</div>
                    <div className="dash-subtitle">{user.email} · {roleLabel}</div>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 640 }}>

                    {/* ── Profile info card ── */}
                    <div style={{
                        background: '#fff', borderRadius: 16,
                        border: '1px solid #e2e8f0', padding: '1.75rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 14,
                                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                color: '#fff', fontWeight: 800, fontSize: '1.35rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {user.full_name[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                                    {user.full_name}
                                </div>
                                <div style={{ marginTop: '0.25rem' }}>
                                    <span className={`dash-role-badge dash-role-badge--${user.role}`}>
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                            ✏️ Informations personnelles
                        </div>

                        {profileMsg && (
                            <div style={{
                                padding: '0.65rem 0.9rem', borderRadius: 8,
                                marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 500,
                                background: profileMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                border: `1px solid ${profileMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
                                color: profileMsg.type === 'success' ? '#166534' : '#dc2626',
                            }}>
                                {profileMsg.type === 'success' ? '✓ ' : '⚠ '}{profileMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleProfileSave} noValidate>
                            <div className="dash-modal-row2" style={{ marginBottom: '0.9rem' }}>
                                <div>
                                    <label className="dash-modal-label">Nom complet *</label>
                                    <input className="dash-modal-input" type="text"
                                        placeholder="Votre nom complet"
                                        value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="dash-modal-label">Email *</label>
                                    <input className="dash-modal-input" type="email"
                                        placeholder="votre@email.com"
                                        value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                            </div>

                            {user.role === 'doctor' && (
                                <div style={{ marginBottom: '0.9rem' }}>
                                    <label className="dash-modal-label">Spécialité</label>
                                    <input className="dash-modal-input" type="text"
                                        placeholder="Neurologie, Cardiologie…"
                                        value={specialite} onChange={e => setSpecialite(e.target.value)} />
                                </div>
                            )}

                            <div className="dash-modal-row2" style={{ marginBottom: '0.9rem' }}>
                                <div>
                                    <label className="dash-modal-label">Téléphone</label>
                                    <input className="dash-modal-input" type="tel"
                                        placeholder="+216 99 123 456"
                                        value={telephone} onChange={e => setTelephone(e.target.value)} />
                                </div>
                                <div>
                                    <label className="dash-modal-label">Adresse</label>
                                    <input className="dash-modal-input" type="text"
                                        placeholder="Tunis, Tunisie"
                                        value={adresse} onChange={e => setAdresse(e.target.value)} />
                                </div>
                            </div>

                            <button type="submit" className="clients-btn-primary" disabled={savingProfile}
                                style={{ width: '100%', justifyContent: 'center' }}>
                                {savingProfile ? (
                                    <>
                                        <span style={{
                                            width: 12, height: 12,
                                            border: '2px solid rgba(255,255,255,0.35)',
                                            borderTopColor: '#fff', borderRadius: '50%',
                                            animation: 'spin 0.7s linear infinite', display: 'inline-block',
                                        }} />
                                        Enregistrement…
                                    </>
                                ) : '✓ Enregistrer le profil'}
                            </button>
                        </form>
                    </div>

                    {/* ── Password card ── */}
                    <div style={{
                        background: '#fff', borderRadius: 16,
                        border: '1px solid #e2e8f0', padding: '1.75rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                            🔒 Changer le mot de passe
                        </div>

                        {pwdMsg && (
                            <div style={{
                                padding: '0.65rem 0.9rem', borderRadius: 8,
                                marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 500,
                                background: pwdMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                border: `1px solid ${pwdMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
                                color: pwdMsg.type === 'success' ? '#166534' : '#dc2626',
                            }}>
                                {pwdMsg.type === 'success' ? '✓ ' : '⚠ '}{pwdMsg.text}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSave} noValidate>
                            <div style={{ marginBottom: '0.9rem' }}>
                                <label className="dash-modal-label">Mot de passe actuel *</label>
                                <input className="dash-modal-input" type="password"
                                    placeholder="••••••••"
                                    value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                                    autoComplete="current-password" />
                            </div>

                            <div className="dash-modal-row2" style={{ marginBottom: '1rem' }}>
                                <div>
                                    <label className="dash-modal-label">Nouveau mot de passe *</label>
                                    <input className="dash-modal-input" type="password"
                                        placeholder="Min. 8 caractères"
                                        value={newPwd} onChange={e => setNewPwd(e.target.value)}
                                        autoComplete="new-password" />
                                </div>
                                <div>
                                    <label className="dash-modal-label">Confirmer *</label>
                                    <input className="dash-modal-input" type="password"
                                        placeholder="Répéter le mot de passe"
                                        value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                                        autoComplete="new-password" />
                                </div>
                            </div>

                            <button type="submit" className="clients-btn-secondary" disabled={savingPwd}
                                style={{ width: '100%', justifyContent: 'center', fontFamily: 'inherit' }}>
                                {savingPwd ? (
                                    <>
                                        <span style={{
                                            width: 12, height: 12,
                                            border: '2px solid rgba(37,99,235,0.3)',
                                            borderTopColor: '#2563eb', borderRadius: '50%',
                                            animation: 'spin 0.7s linear infinite', display: 'inline-block',
                                        }} />
                                        Modification…
                                    </>
                                ) : '🔑 Modifier le mot de passe'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
