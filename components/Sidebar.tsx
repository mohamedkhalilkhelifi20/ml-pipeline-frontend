'use client'

import '@/styles/sidebar.css'
import Link        from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth }    from '@/contexts/AuthContext'

// ── Navigation data ───────────────────────────────────────────────────────────

const AXES = [
    {
        href:        '/axe1',
        icon:        '🎯',
        title:       'Axe 1',
        subtitle:    'Risque d\'AVC',
        description: 'LightGBM · 37 features NHANES',
        color:       'axe1',
    },
    {
        href:        '/axe2',
        icon:        '📊',
        title:       'Axe 2',
        subtitle:    'Sévérité de l\'AVC',
        description: 'Logistic Regression · 3 classes IST',
        color:       'axe2',
    },
    {
        href:        '/axe3',
        icon:        '💀',
        title:       'Axe 3',
        subtitle:    'Mortalité AVC',
        description: 'Logistic Regression · 2 modèles IST',
        color:       'axe3',
    },
]

// Role-specific workspace links — each role sees only what they can access
const WORKSPACE_ITEMS = {
    doctor: [
        { href: '/dashboard',  icon: '🏥', label: 'Dashboard',   desc: 'Vue d\'ensemble' },
        { href: '/clients',    icon: '👥', label: 'Patients',    desc: 'Mes dossiers patients' },
        { href: '/history',    icon: '📂', label: 'Historique',  desc: 'Mes rapports IA' },
        { href: '/rendezvous', icon: '📅', label: 'Agenda',      desc: 'Mes rendez-vous' },
        { href: '/profile',    icon: '👤', label: 'Mon profil',  desc: 'Modifier mon compte' },
    ],
    secretary: [
        { href: '/dashboard',   icon: '🏥', label: 'Dashboard',      desc: 'Vue d\'ensemble' },
        { href: '/clients',     icon: '👥', label: 'Patients',        desc: 'Gérer les dossiers' },
        { href: '/clients/new', icon: '➕', label: 'Nouveau patient', desc: 'Créer un dossier' },
        { href: '/rendezvous',  icon: '📅', label: 'Agenda',          desc: 'Rendez-vous patients' },
        { href: '/profile',     icon: '👤', label: 'Mon profil',      desc: 'Modifier mon compte' },
    ],
    admin: [
        { href: '/dashboard', icon: '🔧', label: 'Admin',      desc: 'Gestion de la plateforme' },
        { href: '/clients',   icon: '👥', label: 'Patients',   desc: 'Tous les dossiers' },
        { href: '/history',   icon: '📂', label: 'Historique', desc: 'Tous les rapports' },
        { href: '/profile',   icon: '👤', label: 'Mon profil', desc: 'Modifier mon compte' },
    ],
} as const

// Roles that can access the ML prediction axes
const CAN_USE_AXES: ReadonlyArray<string> = ['doctor', 'admin']

const ROLE_SECTION_LABEL: Record<string, string> = {
    admin:     'Administration',
    doctor:    'Espace de travail',
    secretary: 'Espace de travail',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
    const { isOpen, close } = useSidebar()
    const { user, isAuthenticated, logout } = useAuth()
    const pathname = usePathname()
    const router   = useRouter()

    const workspaceItems = user
        ? (WORKSPACE_ITEMS[user.role as keyof typeof WORKSPACE_ITEMS] ?? [])
        : []

    const showAxes = user != null && CAN_USE_AXES.includes(user.role)

    function handleLogout() {
        logout()
        close()
        router.push('/login')
    }

    const roleLabel: Record<string, string> = {
        doctor:    'Médecin',
        secretary: 'Secrétaire',
        admin:     'Administrateur',
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`sidebar-backdrop${isOpen ? ' sidebar-backdrop--visible' : ''}`}
                onClick={close}
            />

            {/* Panel */}
            <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>

                {/* ── Header ── */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🧠</div>
                        <div className="sidebar-logo-text">
                            <span className="sidebar-logo-title">
                                Stroke<span>AI</span>
                            </span>
                            <span className="sidebar-logo-sub">Pipeline ML — IST &amp; NHANES</span>
                        </div>
                    </div>
                    <button className="sidebar-close" onClick={close} aria-label="Fermer">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="sidebar-nav">

                    {/* Workspace section */}
                    {isAuthenticated && user && workspaceItems.length > 0 && (
                        <>
                            <div className="sidebar-nav-label">
                                {ROLE_SECTION_LABEL[user.role] ?? 'Navigation'}
                            </div>

                            {workspaceItems.map(item => {
                                // Exact match for short routes that are prefixes of others
                                const isExactOnly = item.href === '/dashboard' || item.href === '/clients/new'
                                const isActive = isExactOnly
                                    ? pathname === item.href
                                    : pathname === item.href || pathname.startsWith(item.href + '/')
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`sidebar-item sidebar-item--workspace${isActive ? ' sidebar-item--ws-active' : ''}`}
                                        onClick={close}
                                    >
                                        <div className="sidebar-item-icon sidebar-item-icon--ws">
                                            {item.icon}
                                        </div>
                                        <div className="sidebar-item-content">
                                            <div className="sidebar-item-title">
                                                <span className="sidebar-item-axe">{item.label}</span>
                                            </div>
                                            <div className="sidebar-item-desc">{item.desc}</div>
                                        </div>
                                        {isActive && <div className="sidebar-item-dot sidebar-item-dot--ws" />}
                                    </Link>
                                )
                            })}

                            <div className="sidebar-divider" />
                        </>
                    )}

                    {/* Prediction axes — doctors and admins only */}
                    {showAxes && (
                        <>
                            <div className="sidebar-nav-label">Axes de prédiction</div>

                            {AXES.map((ax) => {
                                const isActive = pathname.startsWith(ax.href)
                                return (
                                    <Link
                                        key={ax.href}
                                        href={ax.href}
                                        className={`sidebar-item sidebar-item--${ax.color}${isActive ? ' sidebar-item--active' : ''}`}
                                        onClick={close}
                                    >
                                        <div className="sidebar-item-icon">{ax.icon}</div>
                                        <div className="sidebar-item-content">
                                            <div className="sidebar-item-title">
                                                <span className="sidebar-item-axe">{ax.title}</span>
                                                <span className="sidebar-item-sub">— {ax.subtitle}</span>
                                            </div>
                                            <div className="sidebar-item-desc">{ax.description}</div>
                                        </div>
                                        {isActive && <div className="sidebar-item-dot" />}
                                    </Link>
                                )
                            })}

                            <div className="sidebar-divider" />
                        </>
                    )}

                    {/* Auth links when not logged in */}
                    {!isAuthenticated && (
                        <>
                            <div className="sidebar-nav-label">Accès</div>
                            <Link href="/login"    className="sidebar-item sidebar-item--workspace" onClick={close}>
                                <div className="sidebar-item-icon sidebar-item-icon--ws">🔑</div>
                                <div className="sidebar-item-content">
                                    <div className="sidebar-item-title"><span className="sidebar-item-axe">Connexion</span></div>
                                </div>
                            </Link>
                            <Link href="/register" className="sidebar-item sidebar-item--workspace" onClick={close}>
                                <div className="sidebar-item-icon sidebar-item-icon--ws">📝</div>
                                <div className="sidebar-item-content">
                                    <div className="sidebar-item-title"><span className="sidebar-item-axe">Inscription</span></div>
                                </div>
                            </Link>
                        </>
                    )}
                </nav>

                {/* ── Footer ── */}
                <div className="sidebar-footer">
                    {isAuthenticated && user ? (
                        <div className="sidebar-user">
                            <div className="sidebar-user-info">
                                <div className="sidebar-user-avatar">
                                    {user.full_name[0]?.toUpperCase()}
                                </div>
                                <div className="sidebar-user-text">
                                    <div className="sidebar-user-name">{user.full_name}</div>
                                    <div className="sidebar-user-role">
                                        {roleLabel[user.role] ?? user.role}
                                    </div>
                                </div>
                            </div>
                            <button
                                className="sidebar-logout"
                                onClick={handleLogout}
                                title="Déconnexion"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M9 10l3-3-3-3M12 7H5"
                                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    ) : null}

                    <div className="sidebar-footer-badge" style={{ marginTop: isAuthenticated ? '0.6rem' : '0.75rem' }}>
                        <span>ML Pipeline v2.0</span>
                        <span className="sidebar-footer-dot">·</span>
                        <span>FastAPI</span>
                        <span className="sidebar-footer-dot">·</span>
                        <span>Next.js 16</span>
                    </div>
                </div>

            </aside>
        </>
    )
}
