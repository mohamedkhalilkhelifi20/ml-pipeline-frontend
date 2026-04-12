'use client'

// =============================================================================
// app/page.tsx — Landing page principale
// Route : http://localhost:3000/
// Redirige vers /axe1 ou affiche une page d'accueil avec les 4 axes
// =============================================================================

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
    const router = useRouter()

    // Redirection automatique vers axe1
    useEffect(() => {
        router.push('/axe1')
    }, [router])

    // Écran de transition pendant la redirection
    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
            }}>
                {/* Logo */}
                <div style={{
                    width: '52px',
                    height: '52px',
                    background: '#1d4ed8',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                }}>
                    🧠
                </div>

                {/* Titre */}
                <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '-0.01em',
                }}>
                    Stroke<span style={{ color: '#1d4ed8' }}>AI</span>
                </div>

                {/* Spinner */}
                <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2.5px solid #e2e8f0',
                    borderTopColor: '#1d4ed8',
                    borderRadius: '50%',
                    animation: 'spin 0.75s linear infinite',
                }} />

                <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

                <span style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                }}>
          Chargement…
        </span>
            </div>
        </div>
    )
}
