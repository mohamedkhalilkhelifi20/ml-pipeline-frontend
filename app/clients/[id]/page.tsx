'use client'

// =============================================================================
// app/clients/[id]/page.tsx — Patient detail + rapports
// =============================================================================

import '@/styles/clients.css'
import '@/styles/dashboard.css'
import { useEffect, useState }         from 'react'
import { useRouter, useParams }        from 'next/navigation'
import Link                            from 'next/link'
import { useAuth }                     from '@/contexts/AuthContext'
import MenuButton                      from '@/components/MenuButton'
import { getClient, getClientRapports, ClientOut, RapportOut } from '@/lib/api'

const AXE_META: Record<number, { label: string; icon: string; color: string }> = {
    1: { label: 'Risque AVC',    icon: '🎯', color: 'rgba(59,130,246,0.12)' },
    2: { label: 'Sévérité AVC',  icon: '📊', color: 'rgba(139,92,246,0.12)' },
    3: { label: 'Mortalité AVC', icon: '💀', color: 'rgba(239,68,68,0.1)'  },
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

export default function ClientDetailPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router  = useRouter()
    const params  = useParams()
    const id      = params.id as string

    const [client,   setClient]   = useState<ClientOut | null>(null)
    const [rapports, setRapports] = useState<RapportOut[]>([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (!token || !id) return
        Promise.all([
            getClient(token, id),
            getClientRapports(token, id),
        ])
            .then(([c, r]) => { setClient(c); setRapports(r) })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [token, id])

    if (isLoading || !user) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="client-detail-root">
                <div className="clients-header">
                    <div className="clients-header-left">
                        <MenuButton />
                        <Link href="/clients" className="clients-back">← Patients</Link>
                    </div>
                </div>
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
                <div className="clients-header">
                    <div className="clients-header-left">
                        <MenuButton />
                        <Link href="/clients" className="clients-back">← Patients</Link>
                    </div>
                </div>
                <div className="client-detail-body">
                    <div className="clients-error">
                        {error ?? 'Patient introuvable.'}
                    </div>
                </div>
            </div>
        )
    }

    const isFemale = client.sexe === 'F'

    return (
        <div className="client-detail-root">
            {/* Header */}
            <div className="clients-header">
                <div className="clients-header-left">
                    <MenuButton />
                    <Link href="/clients" className="clients-back">← Patients</Link>
                    <span style={{ color: '#1e293b' }}>/</span>
                    <span className="clients-page-title">{client.prenom} {client.nom}</span>
                </div>
                <div className="clients-header-actions">
                    {/* Predicting actions */}
                    {user.role === 'doctor' && (
                        <>
                            <Link href={`/axe1?client=${client.id}`} className="clients-btn-secondary" style={{ fontSize: '0.72rem' }}>
                                🎯 Axe 1
                            </Link>
                            <Link href={`/axe2?client=${client.id}`} className="clients-btn-secondary" style={{ fontSize: '0.72rem' }}>
                                📊 Axe 2
                            </Link>
                            <Link href={`/axe3?client=${client.id}`} className="clients-btn-secondary" style={{ fontSize: '0.72rem' }}>
                                💀 Axe 3
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="client-detail-body">
                {/* Hero card */}
                <div className="client-detail-hero">
                    <div className={`client-detail-avatar${isFemale ? ' client-detail-avatar--F' : ''}`}>
                        {client.prenom[0]?.toUpperCase()}{client.nom[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div className="client-detail-name">{client.prenom} {client.nom}</div>
                        <div className="client-detail-meta">
                            {client.sexe === 'M' ? 'Homme' : client.sexe === 'F' ? 'Femme' : 'Genre non renseigné'}
                            {client.date_naissance ? ` · Né(e) le ${client.date_naissance}` : ''}
                            {' · '} Dossier créé le {formatDate(client.created_at)}
                        </div>
                    </div>
                </div>

                {/* Info fields */}
                <div className="client-detail-grid">
                    {[
                        { label: 'Prénom',          value: client.prenom          },
                        { label: 'Nom',              value: client.nom             },
                        { label: 'Sexe',             value: client.sexe === 'M' ? 'Masculin' : client.sexe === 'F' ? 'Féminin' : '—' },
                        { label: 'Date de naissance',value: client.date_naissance ?? '—'   },
                        { label: 'Téléphone',        value: client.telephone ?? '—'        },
                        { label: 'Adresse',          value: client.adresse ?? '—'          },
                    ].map(f => (
                        <div key={f.label} className="client-detail-field">
                            <div className="client-detail-field-label">{f.label}</div>
                            <div className="client-detail-field-value">{f.value}</div>
                        </div>
                    ))}
                </div>

                {/* Notes */}
                {client.notes && (
                    <div className="client-detail-grid" style={{ marginBottom: '1.5rem' }}>
                        <div className="client-detail-field" style={{ gridColumn: '1/-1' }}>
                            <div className="client-detail-field-label">Notes cliniques</div>
                            <div className="client-detail-field-value" style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                {client.notes}
                            </div>
                        </div>
                    </div>
                )}

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
                                Lancez une prédiction pour générer un rapport IA.
                            </div>
                            {user.role === 'doctor' && (
                                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {[1, 2, 3].map(axe => {
                                        const m = AXE_META[axe]
                                        return (
                                            <Link key={axe} href={`/axe${axe}`} className="clients-btn-secondary">
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
                                        <div className="client-rapport-icon"
                                            style={{ background: meta.color }}>
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <div className="client-rapport-label">
                                                {meta.label}
                                            </div>
                                            <div className="client-rapport-date">
                                                {formatDateTime(r.created_at)}
                                                {r.medecin_nom ? ` · Dr. ${r.medecin_nom}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {r.prediction?.verdict != null && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                padding: '0.18rem 0.5rem',
                                                borderRadius: 6,
                                                background: 'rgba(59,130,246,0.1)',
                                                color: '#93c5fd',
                                            }}>
                                                {String(r.prediction.verdict)}
                                            </span>
                                        )}
                                        <span style={{ color: '#334155', fontSize: '0.85rem' }}>›</span>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
