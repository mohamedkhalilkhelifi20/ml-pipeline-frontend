'use client'

// =============================================================================
// components/axe3/StepTraitement.tsx — Axe 3 : Étape 3 Traitement
// Champs : RXASP (Y/N — aspirine) + RXHEP (H/L/M/N — héparine)
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/step-vie.css'
import '@/styles/axe3/step-traitement.css'
import { Axe3Input, RxhepType, BinaryYN } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ChangeHandler = (field: keyof Axe3Input, value: Axe3Input[keyof Axe3Input]) => void

interface StepTraitementProps {
    data:     Pick<Axe3Input, 'RXASP' | 'RXHEP'>
    onChange: ChangeHandler
    onSubmit: () => void
    onBack:   () => void
}

// --------------------------------------------------------------------------
// Données statiques
// --------------------------------------------------------------------------

const RXHEP_OPTIONS: { value: RxhepType; icon: string; code: string; label: string; sub: string }[] = [
    { value: 'N', icon: '🚫', code: 'Aucune', label: 'Pas d\'héparine',  sub: 'No heparin administered' },
    { value: 'L', icon: '💉', code: 'Faible', label: 'Faible dose',      sub: 'Low dose heparin' },
    { value: 'M', icon: '💉', code: 'Moyenne', label: 'Dose moyenne',    sub: 'Medium dose heparin' },
    { value: 'H', icon: '💉', code: 'Haute',  label: 'Haute dose',       sub: 'High dose heparin' },
]

// --------------------------------------------------------------------------
// Icônes
// --------------------------------------------------------------------------

function CheckIcon() {
    return (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5l2 2 4-4" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function SendIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l12-5-5 12-2-5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function StepTraitement({ data, onChange, onSubmit, onBack }: StepTraitementProps) {
    const aspActive = data.RXASP === 'Y'

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">💊</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 3 · Traitement</span>
                    <h2 className="step-header-title">Traitement administré</h2>
                    <p className="step-header-desc">
                        Traitements reçus dans le cadre de l&apos;essai IST (International Stroke Trial) —
                        aspirine et héparine administrés lors de la randomisation.
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* RXASP — Aspirine */}
                <div className="field-group">
                    <label className="field-label">Aspirine (RXASP)</label>
                    <p className="field-hint">Aspirine administrée dans le cadre de la randomisation IST</p>
                    <div
                        className={`toggle-item${aspActive ? ' toggle-item--active' : ''}`}
                        onClick={() => onChange('RXASP', (aspActive ? 'N' : 'Y') as BinaryYN)}
                    >
                        <div className="toggle-item-left">
                            <div className="toggle-item-icon">💊</div>
                            <div className="toggle-item-content">
                                <div className="toggle-item-label">Aspirine administrée</div>
                                <div className="toggle-item-desc">
                                    {aspActive ? 'Oui — aspirine incluse dans le traitement' : 'Non — pas d\'aspirine'}
                                </div>
                            </div>
                        </div>
                        <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={aspActive}
                                onChange={() => onChange('RXASP', (aspActive ? 'N' : 'Y') as BinaryYN)}
                            />
                            <span className="toggle-switch-track" />
                            <span className="toggle-switch-thumb" />
                        </label>
                    </div>
                </div>

                <hr className="field-divider" />

                {/* RXHEP — Héparine */}
                <div className="field-group">
                    <label className="field-label">
                        Héparine (RXHEP)
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">Dose d&apos;héparine administrée — H=Haute, L=Faible, M=Moyenne, N=Aucune</p>
                    <div className="rxhep-grid">
                        {RXHEP_OPTIONS.map((opt) => (
                            <label key={opt.value} className={`rxhep-card rxhep-card--${opt.value.toLowerCase()}`}>
                                <input
                                    type="radio"
                                    name="RXHEP"
                                    value={opt.value}
                                    checked={data.RXHEP === opt.value}
                                    onChange={() => onChange('RXHEP', opt.value as RxhepType)}
                                />
                                <div className="rxhep-inner">
                                    <div className="rxhep-dose-icon">{opt.icon}</div>
                                    <div className="rxhep-info">
                                        <span className="rxhep-code">{opt.code}</span>
                                        <span className="rxhep-label">{opt.label}</span>
                                        <span className="rxhep-sub">{opt.sub}</span>
                                    </div>
                                </div>
                                <div className="rxhep-check"><CheckIcon /></div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Récapitulatif traitement */}
                <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    color: '#64748b',
                    display: 'flex',
                    gap: '1.5rem',
                    flexWrap: 'wrap' as const,
                }}>
                    <span>
                        💊 Aspirine :&nbsp;
                        <strong style={{ color: aspActive ? '#16a34a' : '#dc2626' }}>
                            {aspActive ? 'Oui' : 'Non'}
                        </strong>
                    </span>
                    <span>
                        💉 Héparine :&nbsp;
                        <strong style={{ color: '#0f172a' }}>
                            {RXHEP_OPTIONS.find(o => o.value === data.RXHEP)?.label ?? data.RXHEP}
                        </strong>
                    </span>
                </div>

            </div>

            {/* ── Footer ── */}
            <div className="step-footer">
                <button className="btn-back" onClick={onBack}>
                    <ArrowLeft />
                    Retour
                </button>
                <button className="btn-next" onClick={onSubmit}>
                    Prédire la mortalité
                    <SendIcon />
                </button>
            </div>

        </div>
    )
}
