'use client'

// =============================================================================
// components/axe2/StepDeficits.tsx — Axe 2 : Étape 2 Déficits Neurologiques
// 8 déficits RDEF1–8 avec sélecteur 3 états : Y (Oui) / N (Non) / C (Incertain)
// Logique IST : Y→confirmed, N→absent, C→cannot assess
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/axe2/step-deficits.css'
import { Axe2Input, RdefStatus } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type RdefKey = 'RDEF1' | 'RDEF2' | 'RDEF3' | 'RDEF4' | 'RDEF5' | 'RDEF6' | 'RDEF7' | 'RDEF8'

type ChangeHandler = (field: keyof Axe2Input, value: Axe2Input[keyof Axe2Input]) => void

interface StepDeficitsProps {
    data:     Pick<Axe2Input, RdefKey>
    onChange: ChangeHandler
    onNext:   () => void
    onBack:   () => void
}

// --------------------------------------------------------------------------
// Données statiques
// --------------------------------------------------------------------------

const DEFICITS: { key: RdefKey; label: string }[] = [
    { key: 'RDEF1', label: 'Paralysie faciale'      },
    { key: 'RDEF2', label: 'Faiblesse bras'          },
    { key: 'RDEF3', label: 'Faiblesse jambe'         },
    { key: 'RDEF4', label: 'Dysphasie (langage)'     },
    { key: 'RDEF5', label: 'Hémianopsie (vision)'    },
    { key: 'RDEF6', label: 'Trouble déglutition'     },
    { key: 'RDEF7', label: 'Trouble de conscience'   },
    { key: 'RDEF8', label: 'Autre déficit neuro.'    },
]

const OPTIONS: { value: RdefStatus; label: string; activeClass: string }[] = [
    { value: 'Y', label: 'Oui', activeClass: 'rdef-btn--y-active' },
    { value: 'N', label: 'Non', activeClass: 'rdef-btn--n-active' },
    { value: 'C', label: '?',   activeClass: 'rdef-btn--c-active' },
]

// --------------------------------------------------------------------------
// Icônes
// --------------------------------------------------------------------------

function ArrowRight() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function ArrowLeft() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function StepDeficits({ data, onChange, onNext, onBack }: StepDeficitsProps) {
    const nConfirmed = DEFICITS.filter(d => data[d.key] === 'Y').length
    const nUncertain = DEFICITS.filter(d => data[d.key] === 'C').length
    const nAbsent    = DEFICITS.filter(d => data[d.key] === 'N').length

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">🧠</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 2 · Déficits neurologiques</span>
                    <h2 className="step-header-title">Déficits à l&apos;admission (RDEF 1–8)</h2>
                    <p className="step-header-desc">
                        Pour chaque déficit, indiquez le statut IST :
                        <strong> Oui</strong> (présent), <strong> Non</strong> (absent),
                        <strong> ?</strong> (cannot assess / incertain).
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                <div className="rdef-list">
                    {DEFICITS.map((def, i) => {
                        const val    = data[def.key]
                        const itemCls = val === 'Y'
                            ? 'rdef-item--confirmed'
                            : val === 'C'
                                ? 'rdef-item--uncertain'
                                : ''

                        return (
                            <div key={def.key} className={`rdef-item ${itemCls}`}>
                                <div className="rdef-item-left">
                                    <div className="rdef-num">{i + 1}</div>
                                    <span className="rdef-name">{def.label}</span>
                                </div>
                                <div className="rdef-options">
                                    {OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            className={`rdef-btn${val === opt.value ? ` ${opt.activeClass}` : ''}`}
                                            onClick={() => onChange(def.key, opt.value as Axe2Input[typeof def.key])}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Résumé live */}
                <div className="rdef-summary">
                    <div className="rdef-summary-item">
                        <span className="rdef-summary-dot rdef-summary-dot--confirmed" />
                        <span className="rdef-summary-count">{nConfirmed}</span>
                        <span className="rdef-summary-label">confirmé{nConfirmed !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="rdef-summary-item">
                        <span className="rdef-summary-dot rdef-summary-dot--uncertain" />
                        <span className="rdef-summary-count">{nUncertain}</span>
                        <span className="rdef-summary-label">incertain{nUncertain !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="rdef-summary-item">
                        <span className="rdef-summary-dot rdef-summary-dot--absent" />
                        <span className="rdef-summary-count">{nAbsent}</span>
                        <span className="rdef-summary-label">absent{nAbsent !== 1 ? 's' : ''}</span>
                    </div>
                </div>

            </div>

            {/* ── Footer ── */}
            <div className="step-footer">
                <button className="btn-back" onClick={onBack}>
                    <ArrowLeft />
                    Retour
                </button>
                <button className="btn-next" onClick={onNext}>
                    Continuer
                    <ArrowRight />
                </button>
            </div>

        </div>
    )
}
