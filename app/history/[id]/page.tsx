'use client'

// =============================================================================
// app/history/[id]/page.tsx — Rapport detail : prediction + patient data + AI text
// =============================================================================

import '@/styles/history.css'
import '@/styles/dashboard.css'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams }             from 'next/navigation'
import Link                                 from 'next/link'
import { useAuth }                          from '@/contexts/AuthContext'
import MenuButton                           from '@/components/MenuButton'
import { getHistoryItem, deleteHistoryItem, RapportOut } from '@/lib/api'

const AXE_META: Record<number, { label: string; icon: string; color: string }> = {
    1: { label: 'Risque AVC',    icon: '🎯', color: 'rgba(59,130,246,0.12)'  },
    2: { label: 'Sévérité AVC',  icon: '📊', color: 'rgba(139,92,246,0.12)' },
    3: { label: 'Mortalité AVC', icon: '💀', color: 'rgba(239,68,68,0.1)'   },
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatPercent(val: unknown): string {
    if (typeof val !== 'number') return String(val ?? '—')
    return `${(val * 100).toFixed(1)}%`
}

function isProb(key: string): boolean {
    return key.toLowerCase().includes('prob') || key.toLowerCase().includes('probability')
}

function getRiskClass(val: unknown, key: string): string {
    if (typeof val !== 'number' || !isProb(key)) return ''
    if (val >= 0.6) return 'history-pred-value--high'
    if (val >= 0.3) return 'history-pred-value--medium'
    return 'history-pred-value--low'
}

export default function HistoryDetailPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()
    const params = useParams()
    const id     = params.id as string

    const [report,    setReport]    = useState<RapportOut | null>(null)
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState<string | null>(null)
    const [deleting,  setDeleting]  = useState(false)
    const [copied,    setCopied]    = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (!token || !id) return
        getHistoryItem(token, id)
            .then(setReport)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [token, id])

    const handleDelete = useCallback(async () => {
        if (!token || !report) return
        if (!window.confirm('Supprimer ce rapport définitivement ?')) return
        setDeleting(true)
        try {
            await deleteHistoryItem(token, report.id)
            router.push('/history')
        } catch {
            setDeleting(false)
        }
    }, [token, report, router])

    const handleCopy = useCallback(() => {
        if (!report?.rapport_texte) return
        navigator.clipboard.writeText(report.rapport_texte)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }, [report])

    if (isLoading || !user) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="history-detail-root">
                <div className="history-header">
                    <div className="history-header-left">
                        <MenuButton />
                        <Link href="/history" className="history-back">← Historique</Link>
                    </div>
                </div>
                <div className="history-detail-body">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="dash-skeleton"
                            style={{ height: 80, marginBottom: 12, borderRadius: 14 }} />
                    ))}
                </div>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="history-detail-root">
                <div className="history-header">
                    <div className="history-header-left">
                        <MenuButton />
                        <Link href="/history" className="history-back">← Historique</Link>
                    </div>
                </div>
                <div className="history-detail-body">
                    <div className="clients-error">{error ?? 'Rapport introuvable.'}</div>
                </div>
            </div>
        )
    }

    const meta = AXE_META[report.axe] ?? AXE_META[1]

    const predEntries = Object.entries(report.prediction ?? {})
        .filter(([k]) => k !== 'engineered_features' && k !== 'deficit_summary')

    const patientEntries = Object.entries(report.patient_data ?? {})

    return (
        <div className="history-detail-root">
            {/* Header */}
            <div className="history-header">
                <div className="history-header-left">
                    <MenuButton />
                    <Link href="/history" className="history-back">← Historique</Link>
                    <span style={{ color: '#1e293b' }}>/</span>
                    <span className="history-page-title">
                        {report.patient_prenom} {report.patient_nom}
                    </span>
                </div>
            </div>

            <div className="history-detail-body">
                {/* Hero */}
                <div className="history-detail-hero">
                    <div className={`history-detail-axe-icon history-detail-axe-icon--${report.axe}`}>
                        {meta.icon}
                    </div>
                    <div>
                        <div className="history-detail-patient-name">
                            {report.patient_prenom} {report.patient_nom}
                        </div>
                        <div className="history-detail-meta">
                            {meta.label} · {formatDateTime(report.created_at)}
                            {report.medecin_nom ? ` · Dr. ${report.medecin_nom}` : ''}
                            {report.modele_llm  ? ` · ${report.modele_llm}`       : ''}
                        </div>
                    </div>
                </div>

                {/* Prediction results */}
                {predEntries.length > 0 && (
                    <div className="history-section-card">
                        <div className="history-section-title">Résultats de prédiction</div>
                        <div className="history-pred-grid">
                            {predEntries.map(([key, val]) => {
                                const display = isProb(key) ? formatPercent(val) : String(val ?? '—')
                                const cls     = getRiskClass(val, key)
                                return (
                                    <div key={key} className="history-pred-item">
                                        <div className="history-pred-label">
                                            {key.replace(/_/g, ' ')}
                                        </div>
                                        <div className={`history-pred-value ${cls}`}>
                                            {display}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Engineered features (collapsed) */}
                        {report.prediction?.engineered_features != null && (
                            <details style={{ marginTop: '0.75rem' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.72rem', color: '#475569', userSelect: 'none' }}>
                                    Features calculées →
                                </summary>
                                <div className="history-pred-grid" style={{ marginTop: '0.6rem' }}>
                                    {Object.entries(report.prediction.engineered_features as Record<string, number>)
                                        .map(([k, v]) => (
                                            <div key={k} className="history-pred-item">
                                                <div className="history-pred-label">{k.replace(/_/g, ' ')}</div>
                                                <div className="history-pred-value">{Number(v).toFixed(3)}</div>
                                            </div>
                                        ))}
                                </div>
                            </details>
                        )}
                    </div>
                )}

                {/* Patient data */}
                {patientEntries.length > 0 && (
                    <div className="history-section-card">
                        <div className="history-section-title">
                            Données patient ({patientEntries.length} variables)
                        </div>
                        <div className="history-data-grid">
                            {patientEntries.map(([k, v]) => (
                                <div key={k} className="history-data-item">
                                    <div className="history-data-key">{k.replace(/_/g, ' ')}</div>
                                    <div className="history-data-val">{String(v ?? '—')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Report */}
                {report.rapport_texte && (
                    <div className="history-section-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div className="history-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                                Rapport IA — {report.modele_llm ?? 'phi3:mini'}
                            </div>
                        </div>
                        <div className="history-rapport-text">
                            {report.rapport_texte}
                        </div>
                        <button className="history-copy-btn" onClick={handleCopy}>
                            {copied ? '✓ Copié !' : (
                                <>
                                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                                        <path d="M2 8H1a1 1 0 01-1-1V1a1 1 0 011-1h6a1 1 0 011 1v1"
                                            stroke="currentColor" strokeWidth="1.3"/>
                                    </svg>
                                    Copier le rapport
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Delete zone */}
                {(user.role === 'doctor' || user.role === 'admin') && (
                    <div className="history-danger-zone">
                        <div>
                            <div className="history-danger-title">Supprimer ce rapport</div>
                            <div className="history-danger-text">
                                Cette action est irréversible. Le rapport sera définitivement supprimé.
                            </div>
                        </div>
                        <button
                            className="history-delete-confirm-btn"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Suppression…' : '🗑 Supprimer'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
