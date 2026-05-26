'use client'

import '@/styles/dashboard.css'
import Link        from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth }    from '@/contexts/AuthContext'
import MenuButton     from '@/components/MenuButton'

const NAV = {
    doctor: [
        { href: '/dashboard',  label: 'Dashboard' },
        { href: '/clients',    label: 'Patients' },
        { href: '/history',    label: 'Historique' },
        { href: '/rendezvous', label: 'Agenda' },
    ],
    secretary: [
        { href: '/dashboard',   label: 'Dashboard' },
        { href: '/clients',     label: 'Patients' },
        { href: '/rendezvous',  label: 'Agenda' },
        { href: '/clients/new', label: '+ Nouveau' },
    ],
    admin: [
        { href: '/dashboard', label: 'Admin' },
        { href: '/clients',   label: 'Patients' },
        { href: '/history',   label: 'Historique' },
    ],
} as const

export default function AppTopbar() {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const router   = useRouter()

    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function onOutside(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onOutside)
        return () => document.removeEventListener('mousedown', onOutside)
    }, [])

    if (!user) return null

    const links = NAV[user.role as keyof typeof NAV] ?? []

    return (
        <div className="dash-topbar">
            <div className="dash-topbar-left">
                <MenuButton />
                <Link href="/dashboard" className="dash-topbar-logo">
                    Stroke<span>AI</span>
                </Link>

                <nav className="topbar-nav">
                    {links.map(l => {
                        const exactOnly = l.href === '/dashboard' || l.href === '/clients/new'
                        const isActive  = exactOnly
                            ? pathname === l.href
                            : pathname === l.href || pathname.startsWith(l.href + '/')
                        return (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`topbar-nav-link${isActive ? ' topbar-nav-link--active' : ''}`}
                            >
                                {l.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="dash-topbar-right">
                <span className="dash-user-name">{user.full_name}</span>

                {/* Avatar + dropdown */}
                <div ref={wrapRef} className="topbar-avatar-wrap">
                    <button
                        className={`topbar-avatar${open ? ' topbar-avatar--open' : ''}`}
                        onClick={() => setOpen(p => !p)}
                        title="Mon compte"
                    >
                        {user.full_name[0]?.toUpperCase()}
                    </button>

                    {open && (
                        <div className="topbar-dropdown">
                            <div className="topbar-dropdown-user">
                                <div className="topbar-dropdown-name">{user.full_name}</div>
                                <div className="topbar-dropdown-email">{user.email ?? ''}</div>
                            </div>
                            <div className="topbar-dropdown-divider" />
                            <Link
                                href="/profile"
                                className="topbar-dropdown-item"
                                onClick={() => setOpen(false)}
                            >
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                                    <path d="M1.5 11.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                                Mon profil
                            </Link>
                            <Link
                                href="/profile#password"
                                className="topbar-dropdown-item"
                                onClick={() => setOpen(false)}
                            >
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <rect x="2" y="5.5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                                    <path d="M4.5 5.5V3.5a2 2 0 114 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                                Modifier le mot de passe
                            </Link>
                            <div className="topbar-dropdown-divider" />
                            <button
                                className="topbar-dropdown-item topbar-dropdown-item--danger"
                                onClick={() => { logout(); router.push('/login') }}
                            >
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path d="M4.5 2.5H2a1 1 0 00-1 1v6a1 1 0 001 1h2.5M8.5 9.5l3-3-3-3M11.5 6.5H5"
                                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
