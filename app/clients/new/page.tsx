'use client'

// =============================================================================
// app/clients/new/page.tsx — Create new patient (secretary)
// =============================================================================

import '@/styles/clients.css'
import '@/styles/dashboard.css'
import React, { useEffect, useState } from 'react'
import { useRouter }                       from 'next/navigation'
import Link                                from 'next/link'
import { useAuth }                         from '@/contexts/AuthContext'
import MenuButton                          from '@/components/MenuButton'
import { createClient, listDoctors, UserOut, ApiError } from '@/lib/api'

export default function NewClientPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    const [nom,            setNom]            = useState('')
    const [prenom,         setPrenom]         = useState('')
    const [dateNaissance,  setDateNaissance]  = useState('')
    const [sexe,           setSexe]           = useState<'M' | 'F' | ''>('')
    const [telephone,      setTelephone]      = useState('')
    const [adresse,        setAdresse]        = useState('')
    const [notes,          setNotes]          = useState('')
    const [doctorId,       setDoctorId]       = useState('')
    const [doctors,        setDoctors]        = useState<UserOut[]>([])
    const [loadingDoctors, setLoadingDoctors] = useState(false)
    const [submitting,     setSubmitting]     = useState(false)
    const [error,          setError]          = useState<string | null>(null)
    const [success,        setSuccess]        = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    // Admin can pick doctor — secretary already has one assigned in backend
    useEffect(() => {
        if (user?.role !== 'admin' || !token) return
        setLoadingDoctors(true)
        listDoctors(token)
            .then(setDoctors)
            .finally(() => setLoadingDoctors(false))
    }, [user, token])

    async function handleSubmit(e: React.BaseSyntheticEvent) {
        e.preventDefault()
        if (!token) return
        setError(null)
        setSubmitting(true)
        try {
            const created = await createClient(token, {
                nom,
                prenom,
                date_naissance: dateNaissance || undefined,
                sexe:           (sexe as 'M' | 'F') || undefined,
                telephone:      telephone || undefined,
                adresse:        adresse   || undefined,
                notes:          notes     || undefined,
                doctor_id:      user?.role === 'admin' && doctorId ? doctorId : undefined,
            })
            setSuccess(true)
            setTimeout(() => router.push(`/clients/${created.id}`), 900)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Erreur lors de la création.')
        } finally {
            setSubmitting(false)
        }
    }

    if (isLoading || !user) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
            </div>
        )
    }

    // Only secretary and admin can create clients
    if (user.role === 'doctor') {
        return (
            <div className="client-form-root">
                <div className="clients-header">
                    <div className="clients-header-left">
                        <MenuButton />
                        <Link href="/clients" className="clients-back">← Patients</Link>
                    </div>
                </div>
                <div className="client-form-body" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Seuls les secrétaires peuvent créer des dossiers patients.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="client-form-root">
            {/* Header */}
            <div className="clients-header">
                <div className="clients-header-left">
                    <MenuButton />
                    <Link href="/clients" className="clients-back">← Patients</Link>
                    <span style={{ color: '#1e293b' }}>/</span>
                    <span className="clients-page-title">Nouveau patient</span>
                </div>
            </div>

            <div className="client-form-body">
                <div className="client-form-card">
                    <div className="client-form-title">Créer un dossier patient</div>
                    <div className="client-form-sub">
                        Renseignez les informations du nouveau patient
                    </div>

                    {error && (
                        <div className="clients-error">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.5"/>
                                <path d="M7 4v3M7 9.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="clients-success">
                            ✓ Patient créé avec succès. Redirection…
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="client-form-section">Identité</div>

                        <div className="client-form-row">
                            <div className="client-form-field">
                                <label className="client-form-label" htmlFor="prenom">Prénom *</label>
                                <input id="prenom" type="text" className="client-form-input"
                                    placeholder="Ahmed" value={prenom}
                                    onChange={e => setPrenom(e.target.value)} required />
                            </div>
                            <div className="client-form-field">
                                <label className="client-form-label" htmlFor="nom">Nom *</label>
                                <input id="nom" type="text" className="client-form-input"
                                    placeholder="Bensalem" value={nom}
                                    onChange={e => setNom(e.target.value)} required />
                            </div>
                        </div>

                        <div className="client-form-row">
                            <div className="client-form-field">
                                <label className="client-form-label" htmlFor="sexe">Sexe</label>
                                <select id="sexe" className="client-form-input client-form-select"
                                    value={sexe} onChange={e => setSexe(e.target.value as 'M' | 'F' | '')}>
                                    <option value="">Non renseigné</option>
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                            </div>
                            <div className="client-form-field">
                                <label className="client-form-label" htmlFor="ddn">Date de naissance</label>
                                <input id="ddn" type="date" className="client-form-input"
                                    value={dateNaissance}
                                    onChange={e => setDateNaissance(e.target.value)}
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>

                        <div className="client-form-section">Contact</div>

                        <div className="client-form-row">
                            <div className="client-form-field">
                                <label className="client-form-label" htmlFor="tel">Téléphone</label>
                                <input id="tel" type="tel" className="client-form-input"
                                    placeholder="+216 99 123 456" value={telephone}
                                    onChange={e => setTelephone(e.target.value)} />
                            </div>
                            <div className="client-form-field">
                                <label className="client-form-label" htmlFor="adresse">Adresse</label>
                                <input id="adresse" type="text" className="client-form-input"
                                    placeholder="Tunis, Tunisie" value={adresse}
                                    onChange={e => setAdresse(e.target.value)} />
                            </div>
                        </div>

                        {user.role === 'admin' && (
                            <>
                                <div className="client-form-section">Assignation</div>
                                <div className="client-form-field">
                                    <label className="client-form-label" htmlFor="doctor">Médecin assigné</label>
                                    <select id="doctor" className="client-form-input client-form-select"
                                        value={doctorId} onChange={e => setDoctorId(e.target.value)}
                                        disabled={loadingDoctors}>
                                        <option value="">
                                            {loadingDoctors ? 'Chargement…' : 'Sélectionner un médecin'}
                                        </option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.full_name} {d.specialite ? `— ${d.specialite}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="client-form-section">Notes cliniques</div>

                        <div className="client-form-field">
                            <label className="client-form-label" htmlFor="notes">Observations</label>
                            <textarea id="notes" className="client-form-input client-form-textarea"
                                placeholder="Antécédents médicaux, allergies, informations complémentaires…"
                                value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>

                        <div className="client-form-actions">
                            <Link href="/clients" className="clients-btn-secondary">
                                Annuler
                            </Link>
                            <button type="submit" className="clients-btn-primary" disabled={submitting || success}>
                                {submitting ? (
                                    <>
                                        <span className="auth-spinner" style={{ width: 12, height: 12 }} />
                                        Création…
                                    </>
                                ) : '✓ Créer le patient'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
