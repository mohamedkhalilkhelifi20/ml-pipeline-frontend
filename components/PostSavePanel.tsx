'use client'

// =============================================================================
// components/PostSavePanel.tsx
// Success state shown after saving a rapport — offers next-step shortcuts
// =============================================================================

import Link from 'next/link'

interface Props {
    rapportId:    string
    clientId:     string
    clientName:   string
    currentAxe:   1 | 2 | 3
    onNewPredict: () => void   // restart wizard with same client
}

const AXE_META = [
    { axe: 1, icon: '🎯', label: 'Axe 1 — Risque AVC' },
    { axe: 2, icon: '📊', label: 'Axe 2 — Sévérité AVC' },
    { axe: 3, icon: '💀', label: 'Axe 3 — Mortalité AVC' },
] as const

export default function PostSavePanel({ rapportId, clientId, clientName, currentAxe, onNewPredict }: Props) {
    const otherAxes = AXE_META.filter(m => m.axe !== currentAxe)

    return (
        <div style={{
            margin: '1.5rem auto', maxWidth: 560,
            background: '#ffffff', border: '1.5px solid #dcfce7',
            borderRadius: 16, padding: '1.5rem 1.75rem',
            boxShadow: '0 4px 20px rgba(22,163,74,0.1)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0,
                }}>✓</div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#15803d' }}>
                        Rapport enregistré avec succès
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                        Patient : {clientName}
                    </div>
                </div>
            </div>

            {/* Primary actions */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <Link
                    href={`/history/${rapportId}`}
                    style={{
                        flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.4rem', padding: '0.6rem 1rem',
                        background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                        color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: '0.82rem',
                        textDecoration: 'none', transition: 'opacity 0.15s',
                    }}
                >
                    📄 Voir ce rapport
                </Link>
                <Link
                    href={`/clients/${clientId}`}
                    style={{
                        flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.4rem', padding: '0.6rem 1rem',
                        background: '#f1f5f9', color: '#334155',
                        borderRadius: 10, fontWeight: 600, fontSize: '0.82rem',
                        textDecoration: 'none', border: '1px solid #e2e8f0',
                    }}
                >
                    👤 Dossier patient
                </Link>
            </div>

            {/* New prediction shortcuts */}
            <div style={{
                borderTop: '1px solid #f1f5f9', paddingTop: '1.1rem',
            }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>
                    Nouvelle prédiction pour {clientName}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={onNewPredict}
                        style={{
                            padding: '0.5rem 0.85rem', borderRadius: 8, border: '1.5px solid #2563eb',
                            background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.78rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                        }}
                    >
                        🔄 Même axe
                    </button>
                    {otherAxes.map(({ axe, icon, label }) => (
                        <Link
                            key={axe}
                            href={`/axe${axe}?client=${clientId}`}
                            style={{
                                padding: '0.5rem 0.85rem', borderRadius: 8, border: '1.5px solid #e2e8f0',
                                background: '#f8fafc', color: '#334155', fontWeight: 600, fontSize: '0.78rem',
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem',
                            }}
                        >
                            {icon} {label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
