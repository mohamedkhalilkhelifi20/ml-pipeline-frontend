'use client'

// =============================================================================
// app/clients/page.tsx — Patient list (doctor: mine, secretary: my-created)
// =============================================================================

import '@/styles/clients.css'
import '@/styles/dashboard.css'
import { useEffect, useState, useMemo }    from 'react'
import { useRouter }                        from 'next/navigation'
import Link                                 from 'next/link'
import { useAuth }                          from '@/contexts/AuthContext'
import AppTopbar                            from '@/components/AppTopbar'
import EditClientModal                      from '@/components/EditClientModal'
import { getDoctorClients, getSecretaryClients, ClientOut } from '@/lib/api'

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

export default function ClientsPage() {
    const { user, token, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    const [clients,       setClients]       = useState<ClientOut[]>([])
    const [loading,       setLoading]       = useState(true)
    const [search,        setSearch]        = useState('')
    const [editingClient, setEditingClient] = useState<ClientOut | null>(null)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (!token || !user) return
        const fetcher = user.role === 'secretary'
            ? getSecretaryClients
            : getDoctorClients

        fetcher(token)
            .then(setClients)
            .finally(() => setLoading(false))
    }, [token, user])

    const filtered = useMemo(() => {
        if (!search.trim()) return clients
        const q = search.toLowerCase()
        return clients.filter(c =>
            c.nom.toLowerCase().includes(q) ||
            c.prenom.toLowerCase().includes(q) ||
            c.telephone?.includes(q)
        )
    }, [clients, search])

    if (isLoading || !user) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
                <div className="dash-loading-text">Chargement…</div>
            </div>
        )
    }

    return (
        <div className="clients-root">
            <AppTopbar />

            <div className="clients-body">
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Link href="/dashboard" className="clients-back">← Dashboard</Link>
                    <span style={{ color: '#cbd5e1' }}>/</span>
                    <span className="clients-page-title">Patients</span>
                    {(user.role === 'secretary' || user.role === 'admin') && (
                        <Link href="/clients/new" className="clients-btn-primary" style={{ marginLeft: 'auto' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Nouveau patient
                        </Link>
                    )}
                </div>

                {/* Toolbar */}
                <div className="clients-toolbar">
                    <div className="clients-search-wrap">
                        <svg className="clients-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input
                            type="text"
                            className="clients-search"
                            placeholder="Rechercher par nom, prénom, téléphone…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="clients-count">
                        {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="clients-skeleton-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="clients-skeleton-card" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="clients-empty">
                        <span className="clients-empty-icon">👥</span>
                        <div className="clients-empty-title">
                            {search ? 'Aucun résultat' : 'Aucun patient'}
                        </div>
                        <div className="clients-empty-sub">
                            {search
                                ? `Aucun patient ne correspond à "${search}"`
                                : user.role === 'secretary'
                                    ? 'Créez le premier dossier patient.'
                                    : 'Aucun patient ne vous est encore assigné.'
                            }
                        </div>
                        {!search && user.role === 'secretary' && (
                            <Link href="/clients/new" className="clients-btn-primary" style={{ display: 'inline-flex' }}>
                                ➕ Créer un patient
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="clients-grid">
                        {filtered.map(c => (
                            <Link key={c.id} href={`/clients/${c.id}`} className="client-card">
                                <div className="client-card-top">
                                    <div className={`client-avatar${c.sexe === 'F' ? ' client-avatar--F' : ''}`}>
                                        {c.prenom[0]?.toUpperCase()}{c.nom[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="client-name">{c.prenom} {c.nom}</div>
                                        <div className="client-sub">
                                            {c.sexe === 'M' ? 'Homme' : c.sexe === 'F' ? 'Femme' : 'Genre non renseigné'}
                                        </div>
                                    </div>
                                </div>

                                <div className="client-card-body">
                                    {c.date_naissance && (
                                        <div className="client-info-row">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <rect x="1" y="2" width="10" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                                <path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                            </svg>
                                            Né(e) le {c.date_naissance}
                                        </div>
                                    )}
                                    {c.telephone && (
                                        <div className="client-info-row">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 2a1 1 0 011-1h1.5l1 2.5L4 5s.5 2 3 3l1.5-1.5L11 7.5V9a1 1 0 01-1 1C4.5 10 2 5.5 2 2z"
                                                    stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                                            </svg>
                                            {c.telephone}
                                        </div>
                                    )}
                                    {c.adresse && (
                                        <div className="client-info-row">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M6 1C3.8 1 2 2.8 2 5c0 3 4 7 4 7s4-4 4-7c0-2.2-1.8-4-4-4z"
                                                    stroke="currentColor" strokeWidth="1.2"/>
                                                <circle cx="6" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.2"/>
                                            </svg>
                                            {c.adresse}
                                        </div>
                                    )}
                                </div>

                                <div className="client-card-footer">
                                    <span className="client-date">Ajouté le {formatDate(c.created_at)}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {(user.role === 'secretary' || user.role === 'admin') && (
                                            <button
                                                className="client-edit-inline-btn"
                                                onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingClient(c) }}
                                                title="Modifier"
                                            >
                                                ✏️
                                            </button>
                                        )}
                                        <span className="client-arrow">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {editingClient && token && (
                <EditClientModal
                    token={token}
                    client={editingClient}
                    onClose={() => setEditingClient(null)}
                    onSaved={updated => {
                        setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
                        setEditingClient(null)
                    }}
                />
            )}
        </div>
    )
}
