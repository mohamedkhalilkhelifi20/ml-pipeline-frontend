'use client'

// =============================================================================
// components/axe2/StepClinique.tsx — Axe 2 : Étape 3 Variables Cliniques
// Champs : STYPE (5 options OCSP) + 6 variables binaires Y/N
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/step-vie.css'
import '@/styles/axe2/step-clinique.css'
import { Axe2Input, StrokeType, BinaryYN } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type BinaryKey = 'RSLEEP' | 'RATRIAL' | 'RCT' | 'RVISINF' | 'RHEP24' | 'RASP3'

type ChangeHandler = (field: keyof Axe2Input, value: Axe2Input[keyof Axe2Input]) => void

interface StepCliniqueProps {
    data:     Pick<Axe2Input, 'STYPE' | BinaryKey>
    onChange: ChangeHandler
    onSubmit: () => void
    onBack:   () => void
}

// --------------------------------------------------------------------------
// Données statiques
// --------------------------------------------------------------------------

const STYPE_OPTIONS: { value: StrokeType; code: string; name: string; pct: string }[] = [
    { value: 'LACS', code: 'LACS', name: 'Lacunaire',      pct: '24 %'  },
    { value: 'PACS', code: 'PACS', name: 'Ant. partiel',   pct: '40 %'  },
    { value: 'TACS', code: 'TACS', name: 'Ant. total',     pct: '24 %'  },
    { value: 'POCS', code: 'POCS', name: 'Postérieur',     pct: '12 %'  },
    { value: 'OTH',  code: 'OTH',  name: 'Autre',          pct: '—'     },
]

const BINARY_FIELDS: { key: BinaryKey; icon: string; label: string; desc: string }[] = [
    { key: 'RSLEEP',  icon: '😴', label: 'AVC nocturne',            desc: 'Survenu pendant le sommeil' },
    { key: 'RATRIAL', icon: '💓', label: 'Fibrillation auriculaire', desc: 'FA présente à l\'admission' },
    { key: 'RCT',     icon: '🩻', label: 'Scanner cérébral réalisé', desc: 'CT scan effectué à l\'admission' },
    { key: 'RVISINF', icon: '🔍', label: 'Infarctus visible (CT)',   desc: 'Infarctus visible au scanner' },
    { key: 'RHEP24',  icon: '💉', label: 'Héparine 24 h avant',     desc: 'Héparine avant la randomisation' },
    { key: 'RASP3',   icon: '💊', label: 'Aspirine 3 j avant',      desc: 'Aspirine avant la randomisation' },
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

export default function StepClinique({ data, onChange, onSubmit, onBack }: StepCliniqueProps) {
    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">🏥</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 3 · Variables cliniques</span>
                    <h2 className="step-header-title">Type d&apos;AVC &amp; antécédents</h2>
                    <p className="step-header-desc">
                        Classification OCSP (Oxfordshire Community Stroke Project) et variables
                        thérapeutiques relevées à l&apos;admission dans l&apos;essai IST.
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* ── STYPE ── */}
                <div className="field-group">
                    <label className="field-label">
                        Type d&apos;AVC (STYPE)
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">Classification OCSP — prévalences IST indiquées</p>
                    <div className="stype-grid">
                        {STYPE_OPTIONS.map((opt) => (
                            <label key={opt.value} className="stype-card">
                                <input
                                    type="radio"
                                    name="STYPE"
                                    value={opt.value}
                                    checked={data.STYPE === opt.value}
                                    onChange={() => onChange('STYPE', opt.value as StrokeType)}
                                />
                                <div className="stype-inner">
                                    <span className="stype-code">{opt.code}</span>
                                    <span className="stype-name">{opt.name}</span>
                                    <span className="stype-pct">{opt.pct}</span>
                                </div>
                                <div className="stype-check"><CheckIcon /></div>
                            </label>
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Variables binaires ── */}
                <div className="field-group">
                    <label className="field-label">Variables thérapeutiques &amp; circonstances</label>
                    <p className="field-hint">Activez les éléments présents au moment de la randomisation</p>
                    <div className="binary-list">
                        {BINARY_FIELDS.map((field) => {
                            const isActive = data[field.key] === 'Y'
                            const toggle   = () =>
                                onChange(field.key, (isActive ? 'N' : 'Y') as BinaryYN)

                            return (
                                <div
                                    key={field.key}
                                    className={`binary-row${isActive ? ' binary-row--active' : ''}`}
                                    onClick={toggle}
                                >
                                    <div className="binary-row-left">
                                        <div className="binary-row-icon">{field.icon}</div>
                                        <div className="binary-row-info">
                                            <span className="binary-row-label">{field.label}</span>
                                            <span className="binary-row-desc">{field.desc}</span>
                                        </div>
                                    </div>

                                    {/* Toggle switch — styles dans step-vie.css */}
                                    <label
                                        className="toggle-switch"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={toggle}
                                        />
                                        <span className="toggle-switch-track" />
                                        <span className="toggle-switch-thumb" />
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* ── Footer ── */}
            <div className="step-footer">
                <button className="btn-back" onClick={onBack}>
                    <ArrowLeft />
                    Retour
                </button>
                <button className="btn-next" onClick={onSubmit}>
                    Analyser la sévérité
                    <SendIcon />
                </button>
            </div>

        </div>
    )
}
