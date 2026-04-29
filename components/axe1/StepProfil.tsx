'use client'

// =============================================================================
// components/StepProfil.tsx — Étape 1 : Profil Patient
// Champs : age (radio), Race (select)
// gender et Marital status ont été retirés car absents de Axe1RawInput
// et du modèle pipeline_final.pkl
// =============================================================================

import '@/styles/step-profil.css'
import { Axe1RawInput } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface StepProfilProps {
    data:     Pick<Axe1RawInput, 'age' | 'Race'>
    onChange: (field: keyof Axe1RawInput, value: number) => void
    onNext:   () => void
}

// --------------------------------------------------------------------------
// Données statiques
// --------------------------------------------------------------------------

const AGE_OPTIONS = [
    { value: 1, label: '20 – 39 ans', sub: 'Adulte jeune', emoji: '🧑' },
    { value: 2, label: '40 – 59 ans', sub: 'Adulte',       emoji: '🧔' },
    { value: 3, label: '60 ans +',    sub: 'Sénior',       emoji: '🧓' },
]

const RACE_OPTIONS = [
    { value: 1, label: 'Américain mexicain'   },
    { value: 2, label: 'Autre hispanique'     },
    { value: 3, label: 'Blanc non hispanique' },
    { value: 4, label: 'Noir non hispanique'  },
    { value: 5, label: 'Autre'               },
]

// --------------------------------------------------------------------------
// Icônes SVG
// --------------------------------------------------------------------------

function CheckIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
                d="M1.5 5l2.5 2.5 4.5-5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function ChevronIcon() {
    return (
        <svg className="select-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M4 6l4 4 4-4"
                stroke="#64748b"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function ArrowRight() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function StepProfil({ data, onChange, onNext }: StepProfilProps) {

    // Race a toujours une valeur >= 1 (pas de placeholder vide)
    // Seul age est obligatoire à sélectionner manuellement
    const isValid = data.age > 0 && data.Race > 0

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">👤</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 1 · Profil</span>
                    <h2 className="step-header-title">Informations démographiques</h2>
                    <p className="step-header-desc">
                        Ces données permettent de contextualiser le profil du patient
                        selon les données épidémiologiques NHANES (4 603 patients).
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* ── Tranche d'âge ── */}
                <div className="field-group">
                    <label className="field-label">
                        Tranche d&apos;âge
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">
                        Encodage NHANES : 3 catégories standardisées
                    </p>
                    <div className="radio-card-group radio-card-group--3">
                        {AGE_OPTIONS.map((opt) => (
                            <label key={opt.value} className="radio-card">
                                <input
                                    type="radio"
                                    name="age"
                                    value={opt.value}
                                    checked={data.age === opt.value}
                                    onChange={() => onChange('age', opt.value)}
                                />
                                <div className="radio-card-inner">
                                    <span className="radio-card-emoji">{opt.emoji}</span>
                                    <span className="radio-card-text">{opt.label}</span>
                                    <span className="radio-card-sub">{opt.sub}</span>
                                </div>
                                <div className="radio-card-check">
                                    <CheckIcon />
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Origine ethnique ── */}
                <div className="field-group">
                    <label className="field-label" htmlFor="race-select">
                        Origine ethnique
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">
                        Classification NHANES — utilisée pour l&apos;ajustement épidémiologique
                    </p>
                    <div className="select-wrapper">
                        <select
                            id="race-select"
                            className="select-field"
                            value={data.Race}
                            onChange={(e) => onChange('Race', Number(e.target.value))}
                        >
                            {RACE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronIcon />
                    </div>
                </div>

            </div>

            {/* ── Footer navigation ── */}
            <div className="step-footer">
                <span className="step-footer-info">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.2"/>
                        <path d="M6.5 6v3M6.5 4v.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    Sélectionnez votre tranche d&apos;âge pour continuer
                </span>

                <button
                    className="btn-next"
                    onClick={onNext}
                    disabled={!isValid}
                >
                    Continuer
                    <ArrowRight />
                </button>
            </div>

        </div>
    )
}
