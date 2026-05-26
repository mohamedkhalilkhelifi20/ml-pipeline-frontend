'use client'

import '@/styles/dashboard.css'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link          from 'next/link'
import { useAuth }   from '@/contexts/AuthContext'
import {
    getDoctorProfile, getSecretaryProfile,
    listMyHistory, listAllUsers,
    getDoctorClients, getSecretaryClients,
    toggleUserActive, createSecretary,
    ClientOut, RapportOut, UserOut, DoctorInfo, SecretaryInfo,
} from '@/lib/api'
import AppTopbar       from '@/components/AppTopbar'
import EditClientModal from '@/components/EditClientModal'

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
    const map: Record<string, string> = {
        admin:     'Administrateur',
        doctor:    'Médecin',
        secretary: 'Secrétaire',
    }
    return (
        <span className={`dash-role-badge dash-role-badge--${role}`}>
            {map[role] ?? role}
        </span>
    )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, accent }: {
    icon: string; value: string | number; label: string; accent: string
}) {
    return (
        <div className="dash-stat-card" style={{ '--stat-accent': accent } as React.CSSProperties}>
            <span className="dash-stat-icon">{icon}</span>
            <div className="dash-stat-value">{value}</div>
            <div className="dash-stat-label">{label}</div>
        </div>
    )
}

// ── Format date ───────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

// ── Axe labels ────────────────────────────────────────────────────────────────

const AXE_LABELS: Record<number, { label: string; tag: string }> = {
    1: { label: 'Risque AVC', tag: 'axe1' },
    2: { label: 'Sévérité',   tag: 'axe2' },
    3: { label: 'Mortalité',  tag: 'axe3' },
}

// ── Secretary Modal ───────────────────────────────────────────────────────────

function SecretaryModal({
    token,
    onClose,
    onSuccess,
}: {
    token: string
    onClose: () => void
    onSuccess: () => void
}) {
    const [name,     setName]     = useState('')
    const [email,    setEmail]    = useState('')
    const [password, setPassword] = useState('')
    const [phone,    setPhone]    = useState('')
    const [saving,   setSaving]   = useState(false)
    const [error,    setError]    = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || !email.trim() || password.length < 8) {
            setError('Tous les champs obligatoires doivent être remplis (mot de passe min. 8 caractères).')
            return
        }
        setSaving(true)
        setError(null)
        try {
            await createSecretary(token, {
                full_name: name.trim(),
                email:     email.trim().toLowerCase(),
                password,
                telephone: phone.trim() || undefined,
            })
            onSuccess()
        } catch {
            setError('Erreur lors de la création. Vérifiez que cet email n\'est pas déjà utilisé.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="dash-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="dash-modal">
                <div className="dash-modal-header">
                    <div>
                        <div className="dash-modal-title">📋 Créer le compte secrétaire</div>
                        <div className="dash-modal-subtitle">
                            La secrétaire sera automatiquement assignée à votre compte
                        </div>
                    </div>
                    <button className="dash-modal-close" onClick={onClose}>✕</button>
                </div>

                {error && <div className="dash-modal-error">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="dash-modal-field">
                        <label className="dash-modal-label">Nom complet *</label>
                        <input className="dash-modal-input" type="text"
                            placeholder="Fatma Trabelsi"
                            value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="dash-modal-row2">
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Email *</label>
                            <input className="dash-modal-input" type="email"
                                placeholder="secretaire@hopital.fr"
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="dash-modal-field">
                            <label className="dash-modal-label">Téléphone</label>
                            <input className="dash-modal-input" type="tel"
                                placeholder="+216 …"
                                value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>

                    <div className="dash-modal-field">
                        <label className="dash-modal-label">Mot de passe * <span style={{ color: '#94a3b8', fontWeight: 400 }}>(min. 8 caractères)</span></label>
                        <input className="dash-modal-input" type="password"
                            placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password" />
                    </div>

                    <div className="dash-modal-actions">
                        <button type="button" className="dash-modal-btn-secondary" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="dash-modal-btn-primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <span style={{
                                        width: 12, height: 12,
                                        border: '2px solid rgba(255,255,255,0.35)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        animation: 'spin 0.7s linear infinite',
                                        display: 'inline-block',
                                    }} />
                                    Création…
                                </>
                            ) : 'Créer le compte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// =============================================================================
// Doctor Dashboard
// =============================================================================

function DoctorDashboard({ token }: { token: string }) {
    const [profile,       setProfile]       = useState<DoctorInfo | null>(null)
    const [clients,       setClients]       = useState<ClientOut[]>([])
    const [history,       setHistory]       = useState<RapportOut[]>([])
    const [loading,       setLoading]       = useState(true)
    const [showSecModal,  setShowSecModal]  = useState(false)
    const [editingClient, setEditingClient] = useState<ClientOut | null>(null)

    const loadData = useCallback(async () => {
        const [p, c, h] = await Promise.all([
            getDoctorProfile(token),
            getDoctorClients(token),
            listMyHistory(token),
        ])
        setProfile(p)
        setClients(c)
        setHistory(Array.isArray(h) ? h : [])
    }, [token])

    useEffect(() => {
        loadData().finally(() => setLoading(false))
    }, [loadData])

    if (loading) return (
        <div className="dash-section">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="dash-skeleton dash-skeleton-row" />
            ))}
        </div>
    )

    return (
        <>
            {/* Stats */}
            <div className="dash-stats">
                <StatCard icon="👥" value={profile?.nb_clients ?? clients.length}
                    label="Patients assignés"
                    accent="linear-gradient(90deg, #2563eb, #7c3aed)" />
                <StatCard icon="📋" value={history.length}
                    label="Rapports générés"
                    accent="linear-gradient(90deg, #7c3aed, #a855f7)" />
                <StatCard icon="🧬" value={history.filter(r => r.axe === 1).length}
                    label="Axe 1 — Risque"
                    accent="linear-gradient(90deg, #0891b2, #06b6d4)" />
                <StatCard icon="⚕️" value={history.filter(r => r.axe !== 1).length}
                    label="Axe 2 & 3"
                    accent="linear-gradient(90deg, #059669, #10b981)" />
            </div>

            {/* Secretary section */}
            <div className="dash-section">
                <div className="dash-section-header">
                    <span className="dash-section-title">
                        {profile?.secretary ? '📋 Secrétaire assignée' : '📋 Secrétaire'}
                    </span>
                    {!profile?.secretary && (
                        <button
                            className="dash-section-link"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onClick={() => setShowSecModal(true)}
                        >
                            + Créer un compte
                        </button>
                    )}
                </div>

                {profile?.secretary ? (
                    <div className="dash-info-card">
                        <div className="dash-info-card-icon">📋</div>
                        <div style={{ flex: 1 }}>
                            <div className="dash-info-card-name">{profile.secretary.full_name}</div>
                            <div className="dash-info-card-sub">
                                {profile.secretary.email}
                                {profile.secretary.telephone ? ` · ${profile.secretary.telephone}` : ''}
                            </div>
                        </div>
                        <span className={`dash-status-dot dash-status-dot--${profile.secretary.is_active ? 'active' : 'inactive'}`} />
                    </div>
                ) : (
                    <div className="dash-empty">
                        <span className="dash-empty-icon">📋</span>
                        <div className="dash-empty-text">Aucune secrétaire assignée</div>
                        <button
                            style={{
                                marginTop: '0.75rem',
                                padding: '0.5rem 1.25rem',
                                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                            }}
                            onClick={() => setShowSecModal(true)}
                        >
                            Créer le compte secrétaire
                        </button>
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="dash-section">
                <div className="dash-section-header">
                    <span className="dash-section-title">Actions rapides</span>
                </div>
                <div className="dash-actions">
                    {[
                        { href: '/axe1',    icon: '🎯', label: 'Risque AVC',   bg: '#dbeafe' },
                        { href: '/axe2',    icon: '📊', label: 'Sévérité',     bg: '#ede9fe' },
                        { href: '/axe3',    icon: '💀', label: 'Mortalité',    bg: '#fee2e2' },
                        { href: '/clients', icon: '👥', label: 'Mes patients', bg: '#d1fae5' },
                        { href: '/history', icon: '📂', label: 'Historique',   bg: '#fef3c7' },
                    ].map(a => (
                        <Link key={a.href} href={a.href} className="dash-action-btn">
                            <div className="dash-action-icon" style={{ background: a.bg }}>{a.icon}</div>
                            {a.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Two-column layout: patients + reports */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                {/* Recent patients */}
                <div className="dash-section" style={{ margin: 0 }}>
                    <div className="dash-section-header">
                        <span className="dash-section-title">Patients récents</span>
                        <Link href="/clients" className="dash-section-link">Voir tous →</Link>
                    </div>
                    {clients.length === 0
                        ? <div className="dash-empty">
                            <span className="dash-empty-icon">👥</span>
                            <div className="dash-empty-text">Aucun patient assigné</div>
                          </div>
                        : (
                            <div className="dash-list">
                                {clients.slice(0, 5).map(c => (
                                    <div key={c.id} className="dash-item">
                                        <Link href={`/clients/${c.id}`} className="dash-item-left" style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                            <div className="dash-item-avatar">
                                                {c.prenom?.[0]}{c.nom?.[0]}
                                            </div>
                                            <div>
                                                <div className="dash-item-name">{c.prenom} {c.nom}</div>
                                                <div className="dash-item-meta">
                                                    {c.sexe === 'M' ? 'Homme' : c.sexe === 'F' ? 'Femme' : '—'}
                                                    {c.date_naissance ? ` · ${c.date_naissance}` : ''}
                                                </div>
                                            </div>
                                        </Link>
                                        <span className="dash-item-chevron">›</span>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>

                {/* Recent reports */}
                <div className="dash-section" style={{ margin: 0 }}>
                    <div className="dash-section-header">
                        <span className="dash-section-title">Rapports récents</span>
                        <Link href="/history" className="dash-section-link">Voir tous →</Link>
                    </div>
                    {history.length === 0
                        ? <div className="dash-empty">
                            <span className="dash-empty-icon">📂</span>
                            <div className="dash-empty-text">Aucun rapport généré</div>
                          </div>
                        : (
                            <div className="dash-list">
                                {history.slice(0, 5).map(r => {
                                    const ax = AXE_LABELS[r.axe] ?? { label: `Axe ${r.axe}`, tag: 'axe1' }
                                    return (
                                        <Link key={r.id} href={`/history/${r.id}`} className="dash-item">
                                            <div className="dash-item-left">
                                                <div className="dash-item-avatar">
                                                    {r.patient_prenom?.[0] ?? '?'}{r.patient_nom?.[0] ?? '?'}
                                                </div>
                                                <div>
                                                    <div className="dash-item-name">
                                                        {r.patient_prenom} {r.patient_nom}
                                                    </div>
                                                    <div className="dash-item-meta">{formatDate(r.created_at)}</div>
                                                </div>
                                            </div>
                                            <div className="dash-item-right">
                                                <span className={`dash-item-tag dash-item-tag--${ax.tag}`}>{ax.label}</span>
                                                <span className="dash-item-chevron">›</span>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                </div>
            </div>

            {/* Secretary modal */}
            {showSecModal && (
                <SecretaryModal
                    token={token}
                    onClose={() => setShowSecModal(false)}
                    onSuccess={async () => {
                        setShowSecModal(false)
                        const p = await getDoctorProfile(token)
                        setProfile(p)
                    }}
                />
            )}

            {/* Edit client modal */}
            {editingClient && (
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
        </>
    )
}

// =============================================================================
// Secretary Dashboard
// =============================================================================

function SecretaryDashboard({ token }: { token: string }) {
    const [profile,       setProfile]       = useState<SecretaryInfo | null>(null)
    const [clients,       setClients]       = useState<ClientOut[]>([])
    const [loading,       setLoading]       = useState(true)
    const [editingClient, setEditingClient] = useState<ClientOut | null>(null)

    useEffect(() => {
        Promise.all([
            getSecretaryProfile(token),
            getSecretaryClients(token),
        ])
            .then(([p, c]) => {
                setProfile(p)
                setClients(c)
            })
            .finally(() => setLoading(false))
    }, [token])

    if (loading) return (
        <div className="dash-section">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="dash-skeleton dash-skeleton-row" />
            ))}
        </div>
    )

    return (
        <>
            {/* Stats */}
            <div className="dash-stats">
                <StatCard icon="👥" value={clients.length}
                    label="Dossiers créés"
                    accent="linear-gradient(90deg, #7c3aed, #a855f7)" />
                <StatCard icon="🩺" value={profile?.assigned_doctor ? 1 : 0}
                    label="Médecin assigné"
                    accent="linear-gradient(90deg, #0891b2, #06b6d4)" />
            </div>

            {/* Doctor card + quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="dash-section" style={{ margin: 0 }}>
                    <div className="dash-section-header">
                        <span className="dash-section-title">🩺 Médecin responsable</span>
                    </div>
                    {profile?.assigned_doctor ? (
                        <div className="dash-info-card">
                            <div className="dash-info-card-icon">🩺</div>
                            <div style={{ flex: 1 }}>
                                <div className="dash-info-card-name">{profile.assigned_doctor.full_name}</div>
                                <div className="dash-info-card-sub">
                                    {profile.assigned_doctor.specialite ?? 'Médecin'} · {profile.assigned_doctor.email}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="dash-empty" style={{ padding: '1.5rem' }}>
                            <div className="dash-empty-text">Aucun médecin assigné</div>
                        </div>
                    )}
                </div>

                <div className="dash-section" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 190 }}>
                    <div className="dash-section-header">
                        <span className="dash-section-title">Actions rapides</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <Link href="/clients/new" className="dash-action-btn"
                            style={{ flexDirection: 'row', gap: '0.6rem', padding: '0.75rem 1rem', justifyContent: 'flex-start' }}>
                            <div className="dash-action-icon" style={{ background: '#dbeafe', width: 32, height: 32, fontSize: '0.9rem' }}>➕</div>
                            <span style={{ fontSize: '0.8rem' }}>Nouveau patient</span>
                        </Link>
                        <Link href="/clients" className="dash-action-btn"
                            style={{ flexDirection: 'row', gap: '0.6rem', padding: '0.75rem 1rem', justifyContent: 'flex-start' }}>
                            <div className="dash-action-icon" style={{ background: '#d1fae5', width: 32, height: 32, fontSize: '0.9rem' }}>👥</div>
                            <span style={{ fontSize: '0.8rem' }}>Tous les patients</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent clients */}
            <div className="dash-section">
                <div className="dash-section-header">
                    <span className="dash-section-title">👥 Dossiers récents</span>
                    <Link href="/clients" className="dash-section-link">Voir tous →</Link>
                </div>
                {clients.length === 0 ? (
                    <div className="dash-empty">
                        <span className="dash-empty-icon">📁</span>
                        <div className="dash-empty-text">Aucun dossier créé</div>
                        <Link href="/clients/new" className="dash-action-btn"
                            style={{ display: 'inline-flex', marginTop: '0.75rem', padding: '0.5rem 1.25rem' }}>
                            ➕ Créer le premier patient
                        </Link>
                    </div>
                ) : (
                    <div className="dash-list">
                        {clients.slice(0, 8).map(c => (
                            <div key={c.id} className="dash-item">
                                <Link href={`/clients/${c.id}`} className="dash-item-left" style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                    <div className="dash-item-avatar">
                                        {c.prenom?.[0]}{c.nom?.[0]}
                                    </div>
                                    <div>
                                        <div className="dash-item-name">{c.prenom} {c.nom}</div>
                                        <div className="dash-item-meta">
                                            {c.sexe === 'M' ? 'Homme' : c.sexe === 'F' ? 'Femme' : '—'}
                                            {c.telephone ? ` · ${c.telephone}` : ''}
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    className="dash-item-edit-btn"
                                    onClick={() => setEditingClient(c)}
                                    title="Modifier"
                                >
                                    ✏️
                                </button>
                                <span className="dash-item-chevron">›</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editingClient && (
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
        </>
    )
}

// =============================================================================
// Admin Dashboard
// =============================================================================

function AdminDashboard({ token }: { token: string }) {
    const [users,    setUsers]    = useState<UserOut[]>([])
    const [loading,  setLoading]  = useState(true)
    const [toggling, setToggling] = useState<string | null>(null)

    useEffect(() => {
        listAllUsers(token)
            .then(setUsers)
            .finally(() => setLoading(false))
    }, [token])

    const handleToggle = useCallback(async (userId: string) => {
        setToggling(userId)
        try {
            const updated = await toggleUserActive(token, userId)
            setUsers(prev => prev.map(u => u.id === userId ? updated : u))
        } finally {
            setToggling(null)
        }
    }, [token])

    const doctors     = users.filter(u => u.role === 'doctor')
    const secretaries = users.filter(u => u.role === 'secretary')
    const active      = users.filter(u => u.is_active)

    if (loading) return (
        <div className="dash-section">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="dash-skeleton dash-skeleton-row" />
            ))}
        </div>
    )

    return (
        <>
            <div className="dash-stats">
                <StatCard icon="👥" value={users.length}
                    label="Total utilisateurs"
                    accent="linear-gradient(90deg, #2563eb, #7c3aed)" />
                <StatCard icon="🩺" value={doctors.length}
                    label="Médecins"
                    accent="linear-gradient(90deg, #059669, #10b981)" />
                <StatCard icon="📋" value={secretaries.length}
                    label="Secrétaires"
                    accent="linear-gradient(90deg, #7c3aed, #a855f7)" />
                <StatCard icon="✅" value={active.length}
                    label="Comptes actifs"
                    accent="linear-gradient(90deg, #0891b2, #06b6d4)" />
            </div>

            <div className="dash-section">
                <div className="dash-section-header">
                    <span className="dash-section-title">Gestion des utilisateurs</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="dash-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Spécialité</th>
                                <th>Statut</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                        {u.full_name}
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '0.78rem' }}>{u.email}</td>
                                    <td>
                                        <span className={`dash-user-role dash-user-role--${u.role}`}>
                                            {u.role === 'admin' ? '🔧' : u.role === 'doctor' ? '🩺' : '📋'}
                                            {' '}{u.role}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '0.78rem' }}>
                                        {u.specialite ?? '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span className={`dash-status-dot dash-status-dot--${u.is_active ? 'active' : 'inactive'}`} />
                                            <span style={{ fontSize: '0.78rem', color: u.is_active ? '#16a34a' : '#94a3b8', fontWeight: 500 }}>
                                                {u.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className={`dash-toggle-btn dash-toggle-btn--${u.is_active ? 'active' : 'inactive'}`}
                                            onClick={() => handleToggle(u.id)}
                                            disabled={toggling === u.id}
                                        >
                                            {toggling === u.id ? '…' : u.is_active ? 'Désactiver' : 'Activer'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

// =============================================================================
// Main Dashboard Page
// =============================================================================

export default function DashboardPage() {
    const { user, token, isLoading, isAuthenticated, logout } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.replace('/login')
    }, [isLoading, isAuthenticated, router])

    if (isLoading || !user || !token) {
        return (
            <div className="dash-loading">
                <div className="dash-loading-spinner" />
                <div className="dash-loading-text">Chargement…</div>
            </div>
        )
    }

    const greetings: Record<string, string> = {
        admin:     'Tableau de bord Admin',
        doctor:    `Bonjour, Dr. ${user.full_name.split(' ').slice(-1)[0]}`,
        secretary: `Bonjour, ${user.full_name.split(' ')[0]}`,
    }

    const subtitles: Record<string, string> = {
        admin:     'Gestion complète de la plateforme StrokeAI',
        doctor:    'Gérez vos patients et consultez vos rapports IA',
        secretary: 'Gérez les dossiers patients de votre médecin',
    }

    return (
        <div className="dash-root">
            <AppTopbar />

            {/* Body */}
            <div className="dash-body">
                <div className="dash-header">
                    <h1 className="dash-greeting">{greetings[user.role] ?? 'Tableau de bord'}</h1>
                    <p className="dash-subtitle">{subtitles[user.role]}</p>
                </div>

                {user.role === 'doctor'    && <DoctorDashboard    token={token} />}
                {user.role === 'secretary' && <SecretaryDashboard token={token} />}
                {user.role === 'admin'     && <AdminDashboard     token={token} />}
            </div>
        </div>
    )
}
