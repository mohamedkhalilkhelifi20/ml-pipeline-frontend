'use client'

// =============================================================================
// app/history/page.tsx — Report history list with filters + search
// =============================================================================

import '@/styles/history.css'
import '@/styles/dashboard.css'
import { useEffect, useState, useMemo } from 'react'
import { useRouter }                     from 'next/navigation'
import Link                              from 'next/link'
import { useAuth }                       from '@/contexts/AuthContext'
import MenuButton                        from '@/components/MenuButton'
import { listMyHistory, deleteHistoryItem, RapportOut } from '@/lib/api'

const AXE_META: Record<number, { label: string; icon: string }> = {
    1: { label: 'Risque AVC',    icon: '🎯' },
    2: { label: 'Sévérité AVC',  icon: '📊' },
    3: { label: 'Mortalité AVC', icon: '💀' },
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

export default function HistoryPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    const [reports,  setReports]  = useState<RapportOut[]>([])
    const [loading,  setLoading]  = useState(true)
    const [search,   setSearch]   = useState('')
    const [axeFilter, setAxeFilter] = useState<number | null>(null)
    const [deleting,  setDeleting]  = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (!token) return
        listMyHistory(token)
            .then(setReports)
            .finally(() => setLoading(false))
    }, [token])

    const filtered = useMemo(() => {
        let list = reports
        if (axeFilter !== null) list = list.filter(r => r.axe === axeFilter)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(r =>
                r.patient_nom.toLowerCase().includes(q) ||
                r.patient_prenom.toLowerCase().includes(q)
            )
        }
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [reports, axeFilter, search])

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.preventDefault()
        e.stopPropagation()
        if (!token) return
        if (!window.confirm('Supprimer ce rapport ? Cette action est irréversible.')) return
        setDeleting(id)
        try {
            await deleteHistoryItem(token, id)
            setReports(prev => prev.filter(r => r.id !== id))
        } finally {
            setDeleting(null)
        }
    }

    if (isLoading || !user) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
                <div className="dash-loading-text">Chargement…</div>
            </div>
        )
    }

    return (
        <div className="history-root">
            {/* Header */}
            <div className="history-header">
                <div className="history-header-left">
                    <MenuButton />
                    <Link href="/dashboard" className="history-back">← Dashboard</Link>
                    <span style={{ color: '#1e293b' }}>/</span>
                    <span className="history-page-title">Historique des rapports</span>
                </div>
            </div>

            {/* Body */}
            <div className="history-body">
                {/* Toolbar */}
                <div className="history-toolbar">
                    <div className="history-search-wrap">
                        <svg className="history-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input
                            type="text"
                            className="history-search"
                            placeholder="Rechercher par nom du patient…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="history-filters">
                        <button
                            className={`history-filter${axeFilter === null ? ' history-filter--active-all' : ''}`}
                            onClick={() => setAxeFilter(null)}
                        >
                            Tous
                        </button>
                        {[1, 2, 3].map(n => (
                            <button
                                key={n}
                                className={`history-filter${axeFilter === n ? ` history-filter--active-${n}` : ''}`}
                                onClick={() => setAxeFilter(axeFilter === n ? null : n)}
                            >
                                Axe {n}
                            </button>
                        ))}
                    </div>

                    <span className="history-count">
                        {filtered.length} rapport{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* List */}
                {loading ? (
                    <div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="history-skeleton-row" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="history-empty">
                        <span className="history-empty-icon">📂</span>
                        <div className="history-empty-title">
                            {search || axeFilter !== null ? 'Aucun résultat' : 'Aucun rapport'}
                        </div>
                        <div className="history-empty-sub">
                            {search || axeFilter !== null
                                ? 'Modifiez vos filtres ou votre recherche.'
                                : 'Lancez une prédiction pour générer votre premier rapport.'}
                        </div>
                    </div>
                ) : (
                    <div className="history-list">
                        {filtered.map(r => {
                            const meta = AXE_META[r.axe] ?? AXE_META[1]
                            const axeTag = `axe${r.axe}` as 'axe1' | 'axe2' | 'axe3'
                            const verdict = r.prediction?.verdict as string | undefined
                            return (
                                <Link key={r.id} href={`/history/${r.id}`} className="history-row">
                                    <div className="history-row-left">
                                        <div className={`history-row-icon history-row-icon--${r.axe}`}>
                                            {meta.icon}
                                        </div>
                                        <div className="history-row-info">
                                            <div className="history-row-name">
                                                {r.patient_prenom} {r.patient_nom}
                                            </div>
                                            <div className="history-row-meta">
                                                {formatDateTime(r.created_at)}
                                                {r.medecin_nom ? ` · Dr. ${r.medecin_nom}` : ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="history-row-right">
                                        <span className={`history-tag history-tag--${axeTag}`}>
                                            {meta.label}
                                        </span>
                                        {verdict && (
                                            <span className="history-verdict">{verdict}</span>
                                        )}
                                        {(user.role === 'doctor' || user.role === 'admin') && (
                                            <button
                                                className="history-delete-btn"
                                                onClick={e => handleDelete(e, r.id)}
                                                disabled={deleting === r.id}
                                                title="Supprimer ce rapport"
                                            >
                                                {deleting === r.id
                                                    ? '…'
                                                    : (
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                            <path d="M2 3h8M5 3V2h2v1M4 3v7h4V3H4z"
                                                                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    )}
                                            </button>
                                        )}
                                        <span style={{ color: '#334155', fontSize: '0.8rem' }}>›</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
