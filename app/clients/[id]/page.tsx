'use client'

import '@/styles/clients.css'
import '@/styles/dashboard.css'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams }   from 'next/navigation'
import Link                        from 'next/link'
import { useAuth }                 from '@/contexts/AuthContext'
import AppTopbar                   from '@/components/AppTopbar'
import EditClientModal             from '@/components/EditClientModal'
import { getClient, getClientRapports, ClientOut, RapportOut, ApiError } from '@/lib/api'

const AXE_META: Record<number, { label: string; icon: string; bg: string }> = {
    1: { label: 'Risque AVC',    icon: '🎯', bg: '#dbeafe' },
    2: { label: 'Sévérité AVC',  icon: '📊', bg: '#ede9fe' },
    3: { label: 'Mortalité AVC', icon: '💀', bg: '#fee2e2' },
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
    })
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()
    const params = useParams()
    const id     = params.id as string

    const [client,    setClient]    = useState<ClientOut | null>(null)
    const [rapports,  setRapports]  = useState<RapportOut[]>([])
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [showEdit,  setShowEdit]  = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    const loadData = useCallback(async () => {
        if (!token || !id) return
        try {
            const [c, r] = await Promise.all([
                getClient(token, id),
                getClientRapports(token, id),
            ])
            setClient(c)
            setRapports(r)
        } catch (e: unknown) {
            setError(e instanceof ApiError ? e.message : 'Erreur de chargement.')
        } finally {
            setLoading(false)
        }
    }, [token, id])

    useEffect(() => { loadData() }, [loadData])

    if (isLoading || !user) {
        return <div className="dash-loading"><div className="dash-loading-spinner" /></div>
    }

    if (loading) {
        return (
            <div className="client-detail-root">
                <AppTopbar />
                <div className="client-detail-body">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="dash-skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 12 }} />
                    ))}
                </div>
            </div>
        )
    }

    if (error || !client) {
        return (
            <div className="client-detail-root">
                <AppTopbar />
                <div className="client-detail-body">
                    <div style={{ marginBottom: '1rem' }}>
                        <Link href="/clients" className="clients-back">← Retour aux patients</Link>
                    </div>
                    <div className="clients-error">{error ?? 'Patient introuvable.'}</div>
                </div>
            </div>
        )
    }

    const isFemale = client.sexe === 'F'
    const canEdit  = user.role === 'secretary' || user.role === 'admin'

    return (
        <div className="client-detail-root">
            <AppTopbar />

            <div className="client-detail-body">
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Link href="/clients" className="clients-back">← Patients</Link>
                    <span style={{ color: '#cbd5e1' }}>/</span>
                    <span className="clients-page-title">{client.full_name}</span>
                </div>

                {/* Hero card */}
                <div className="client-detail-hero">
                    <div className={`client-detail-avatar${isFemale ? ' client-detail-avatar--F' : ''}`}>
                        {client.prenom[0]?.toUpperCase()}{client.nom[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="client-detail-name">{client.full_name}</div>
                        <div className="client-detail-meta">
                            <span style={{
                                background: '#dbeafe', color: '#1d4ed8',
                                fontSize: '0.68rem', fontWeight: 700,
                                padding: '0.15rem 0.55rem', borderRadius: 6,
                                letterSpacing: '0.05em', marginRight: '0.5rem',
                            }}>
                                {client.numero_dossier}
                            </span>
                            {client.sexe === 'M' ? 'Homme' : client.sexe === 'F' ? 'Femme' : 'Genre non renseigné'}
                            {client.date_naissance ? ` · Né(e) le ${client.date_naissance}` : ''}
                            {' · '}Créé le {formatDate(client.created_at)}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {canEdit && (
                            <button
                                className="clients-btn-secondary"
                                onClick={() => setShowEdit(true)}
                                style={{ fontSize: '0.78rem' }}
                            >
                                ✏️ Modifier
                            </button>
                        )}
                        {user.role === 'doctor' && (
                            <>
                                <Link href={`/axe1?client=${client.id}`} className="clients-btn-secondary" style={{ fontSize: '0.72rem' }}>🎯 Axe 1</Link>
                                <Link href={`/axe2?client=${client.id}`} className="clients-btn-secondary" style={{ fontSize: '0.72rem' }}>📊 Axe 2</Link>
                                <Link href={`/axe3?client=${client.id}`} className="clients-btn-secondary" style={{ fontSize: '0.72rem' }}>💀 Axe 3</Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Info grid */}
                <div className="client-detail-grid">
                    {[
                        { label: 'Nom complet',      value: client.full_name },
                        { label: 'N° dossier',        value: client.numero_dossier },
                        { label: 'Sexe',              value: client.sexe === 'M' ? 'Masculin' : client.sexe === 'F' ? 'Féminin' : '—' },
                        { label: 'Date de naissance', value: client.date_naissance ?? '—' },
                        { label: 'Téléphone',         value: client.telephone ?? '—' },
                        { label: 'Adresse',           value: client.adresse ?? '—' },
                        { label: 'Médecin',           value: client.doctor_name ?? '—' },
                        { label: 'Secrétaire',        value: client.secretary_name ?? '—' },
                    ].map(f => (
                        <div key={f.label} className="client-detail-field">
                            <div className="client-detail-field-label">{f.label}</div>
                            <div className="client-detail-field-value">{f.value}</div>
                        </div>
                    ))}
                </div>

                {/* Rapports */}
                <div className="client-rapports-section">
                    <div className="client-rapports-title">
                        Rapports IA ({rapports.length})
                    </div>

                    {rapports.length === 0 ? (
                        <div className="clients-empty" style={{ padding: '2.5rem 1rem' }}>
                            <span className="clients-empty-icon">📋</span>
                            <div className="clients-empty-title">Aucun rapport disponible</div>
                            <div className="clients-empty-sub">
                                {user.role === 'doctor'
                                    ? 'Lancez une prédiction depuis un axe ci-dessous.'
                                    : 'Le médecin n\'a pas encore généré de rapport pour ce patient.'}
                            </div>
                            {user.role === 'doctor' && (
                                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                    {[1, 2, 3].map(axe => {
                                        const m = AXE_META[axe]
                                        return (
                                            <Link key={axe} href={`/axe${axe}?client=${client.id}`} className="clients-btn-secondary">
                                                {m.icon} Axe {axe}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        rapports.map(r => {
                            const meta = AXE_META[r.axe] ?? AXE_META[1]
                            return (
                                <Link key={r.id} href={`/history/${r.id}`} className="client-rapport-card">
                                    <div className="client-rapport-left">
                                        <div className="client-rapport-icon" style={{ background: meta.bg }}>
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <div className="client-rapport-label">{meta.label}</div>
                                            <div className="client-rapport-date">
                                                {formatDateTime(r.created_at)}
                                                {r.medecin_nom ? ` · Dr. ${r.medecin_nom}` : ''}
                                                {r.note_medecin && (
                                                    <span style={{ marginLeft: '0.4rem', color: '#16a34a', fontSize: '0.65rem' }}>✎ Note</span>
                                                )}
                                                {r.documents_lab?.length > 0 && (
                                                    <span style={{ marginLeft: '0.4rem', color: '#94a3b8', fontSize: '0.65rem' }}>
                                                        📎 {r.documents_lab.length} doc{r.documents_lab.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {r.prediction?.verdict != null && (
                                            <span style={{
                                                fontSize: '0.68rem', fontWeight: 700,
                                                padding: '0.18rem 0.55rem', borderRadius: 999,
                                                background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                                            }}>
                                                {String(r.prediction.verdict)}
                                            </span>
                                        )}
                                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>›</span>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </div>
            </div>

            {showEdit && token && (
                <EditClientModal
                    token={token}
                    client={client}
                    onClose={() => setShowEdit(false)}
                    onSaved={updated => { setClient(updated); setShowEdit(false) }}
                />
            )}
        </div>
    )
}
