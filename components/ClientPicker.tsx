'use client'

// =============================================================================
// components/ClientPicker.tsx
// Inline searchable patient selector for axe prediction pages
// =============================================================================

import { useEffect, useState, useRef } from 'react'
import { getMyClients, ClientOut }      from '@/lib/api'

interface Props {
    token: string
    onSelect: (client: ClientOut) => void
}

export default function ClientPicker({ token, onSelect }: Props) {
    const [clients,  setClients]  = useState<ClientOut[]>([])
    const [search,   setSearch]   = useState('')
    const [open,     setOpen]     = useState(false)
    const [loading,  setLoading]  = useState(true)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        getMyClients(token)
            .then(setClients)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [token])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = clients.filter(c =>
        `${c.prenom} ${c.nom} ${c.numero_dossier}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                background: '#fff', padding: '0.55rem 0.75rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>👤</span>
                <input
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        fontSize: '0.85rem', color: '#0f172a', background: 'transparent',
                    }}
                    placeholder={loading ? 'Chargement des patients…' : 'Rechercher un patient…'}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    disabled={loading}
                />
                {search && (
                    <button
                        onClick={() => { setSearch(''); setOpen(true) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', lineHeight: 1 }}
                    >×</button>
                )}
            </div>

            {open && !loading && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000,
                    maxHeight: 240, overflowY: 'auto',
                }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                            Aucun patient trouvé
                        </div>
                    ) : filtered.map(c => (
                        <button
                            key={c.id}
                            onClick={() => { onSelect(c); setSearch(`${c.prenom} ${c.nom}`); setOpen(false) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                width: '100%', padding: '0.65rem 0.9rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                textAlign: 'left', borderBottom: '1px solid #f1f5f9',
                                transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'linear-gradient(135deg,#dbeafe,#ede9fe)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', flexShrink: 0,
                            }}>
                                {c.prenom[0]?.toUpperCase()}{c.nom[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                                    {c.prenom} {c.nom}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                    {c.numero_dossier} · {c.sexe === 'M' ? 'Homme' : c.sexe === 'F' ? 'Femme' : '—'}
                                    {c.date_naissance ? ` · ${c.date_naissance}` : ''}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
