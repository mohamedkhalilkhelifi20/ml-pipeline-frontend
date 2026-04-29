'use client'

// =============================================================================
// components/Sidebar.tsx — Sidebar de navigation partagée aux 3 axes
// =============================================================================

import '@/styles/sidebar.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'

// --------------------------------------------------------------------------
// Données de navigation
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function Sidebar() {
    const { isOpen, close } = useSidebar()
    const pathname = usePathname()

    return (
        <>
            {/* Backdrop */}
            <div
                className={`sidebar-backdrop${isOpen ? ' sidebar-backdrop--visible' : ''}`}
                onClick={close}
            />

            {/* Panel */}
            <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>

                {/* ── En-tête ── */}
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
                    <button className="sidebar-close" onClick={close} aria-label="Fermer le menu">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="sidebar-nav">
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

                    {/* Lien accueil */}
                    <Link
                        href="/"
                        className="sidebar-item sidebar-item--axe1"
                        onClick={close}
                        style={{ opacity: 0.6 }}
                    >
                        <div className="sidebar-item-icon" style={{ fontSize: '0.9rem' }}>🏠</div>
                        <div className="sidebar-item-content">
                            <div className="sidebar-item-title">
                                <span className="sidebar-item-axe">Accueil</span>
                            </div>
                        </div>
                    </Link>
                </nav>

                {/* ── Pied de page ── */}
                <div className="sidebar-footer">
                    <div className="sidebar-footer-badge">
                        <span>ML Pipeline v1.0</span>
                        <span className="sidebar-footer-dot">·</span>
                        <span>FastAPI Backend</span>
                        <span className="sidebar-footer-dot">·</span>
                        <span>Next.js</span>
                    </div>
                </div>

            </aside>
        </>
    )
}
