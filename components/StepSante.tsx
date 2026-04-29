'use client'

// =============================================================================
// components/StepSante.tsx — Étape 3 : Santé & Antécédents Médicaux
// Champs :
//   hypertension          → checkbox card (0/1)
//   diabetes              → checkbox card (0/1)
//   high cholesterol      → checkbox card (0/1)
//   Coronary Heart Disease→ checkbox card (0/1)
//   General health cond.  → select (1=excellent → 5=poor)
//   depression            → radio pills (1/2/3)
//   Health Insurance      → toggle (1=oui / 2=non)
//   Body Mass Index       → segmented 4 niveaux (1–4)
// Styles : @/styles/step-profil.css + @/styles/step-sante.css
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/step-sante.css'
import { Axe1RawInput } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type StepSanteData = Pick<
    Axe1RawInput,
    | 'hypertension'
    | 'diabetes'
    | 'high cholesterol'
    | 'Coronary Heart Disease'
    | 'General health condition'
    | 'depression'
    | 'Health Insurance'
    | 'Body Mass Index'
>

interface StepSanteProps {
    data: StepSanteData
    onChange: (field: keyof Axe1RawInput, value: number) => void
    onNext: () => void
    onBack: () => void
}

// --------------------------------------------------------------------------
// Données statiques
// --------------------------------------------------------------------------

const CONDITIONS = [
    {
        field: 'hypertension'         as const,
        icon:  '🩸',
        label: 'Hypertension artérielle',
        desc:  'Pression artérielle ≥ 140/90 mmHg diagnostiquée',
    },
    {
        field: 'diabetes'             as const,
        icon:  '🍬',
        label: 'Diabète',
        desc:  'Diabète de type 1, 2 ou gestationnel',
    },
    {
        field: 'high cholesterol'     as const,
        icon:  '🧪',
        label: 'Hypercholestérolémie',
        desc:  'LDL élevé ou cholestérol total > 2 g/L',
    },
    {
        field: 'Coronary Heart Disease' as const,
        icon:  '❤️',
        label: 'Coronaropathie',
        desc:  'Maladie coronarienne ou antécédent d\'infarctus',
    },
]

const HEALTH_OPTIONS = [
    { value: 1, label: 'Excellente',  emoji: '🌟' },
    { value: 2, label: 'Très bonne',  emoji: '😊' },
    { value: 3, label: 'Bonne',       emoji: '🙂' },
    { value: 4, label: 'Passable',    emoji: '😐' },
    { value: 5, label: 'Mauvaise',    emoji: '😔' },
]

const DEPRESSION_OPTIONS = [
    { value: 1, label: 'Jamais',              sub: 'Aucun symptôme'     },
    { value: 2, label: 'Quelques jours',      sub: 'Symptômes légers'   },
    { value: 3, label: 'Plus de la moitié',   sub: 'Symptômes fréquents'},
]

const BMI_OPTIONS = [
    { value: 1, emoji: '🪶', label: 'Insuffisance',  range: '< 18.5',  bmi: '1' },
    { value: 2, emoji: '✅', label: 'Normal',         range: '18.5–25', bmi: '2' },
    { value: 3, emoji: '⚠️', label: 'Surpoids',       range: '25–30',   bmi: '3' },
    { value: 4, emoji: '🔴', label: 'Obésité',        range: '> 30',    bmi: '4' },
]

// --------------------------------------------------------------------------
// Icônes SVG partagées
// --------------------------------------------------------------------------

function CheckIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function ChevronIcon() {
    return (
        <svg className="select-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="#64748b"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function ArrowLeft() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function ArrowRight() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function StepSante({ data, onChange, onNext, onBack }: StepSanteProps) {

    // Validation : tous les champs doivent être renseignés
    const isValid =
        data['General health condition'] > 0 &&
        data.depression > 0 &&
        data['Body Mass Index'] > 0

    const insuranceOn = data['Health Insurance'] === 1

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">🩺</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 3 · Santé</span>
                    <h2 className="step-header-title">Antécédents médicaux</h2>
                    <p className="step-header-desc">
                        Les pathologies chroniques et l&apos;état de santé général constituent
                        les principaux prédicteurs du risque cardiovasculaire dans le modèle NHANES.
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* ── Conditions médicales ── */}
                <div className="field-group">
                    <label className="field-label">
                        Antécédents pathologiques
                    </label>
                    <p className="field-hint">
                        Cochez toutes les conditions diagnostiquées par un médecin
                    </p>
                    <div className="condition-grid">
                        {CONDITIONS.map(({ field, icon, label, desc }) => {
                            const checked = data[field] === 1
                            return (
                                <label key={field} className="condition-card">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onChange(field, checked ? 0 : 1)}
                                    />
                                    <div className="condition-card-inner">
                                        <div className="condition-card-top">
                                            <div className="condition-card-icon">{icon}</div>
                                            <div className="condition-checkbox">
                                                <svg className="condition-check-svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                    <path d="M1.5 5l2.5 2.5 4.5-5" stroke="white"
                                                          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        </div>
                                        <span className="condition-card-label">{label}</span>
                                        <span className="condition-card-desc">{desc}</span>
                                    </div>
                                </label>
                            )
                        })}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── État de santé général ── */}
                <div className="field-group">
                    <label className="field-label" htmlFor="health-select">
                        État de santé général perçu
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">
                        Auto-évaluation du patient — encodage NHANES (1 = Excellente, 5 = Mauvaise)
                    </p>
                    <div className="select-icon-wrapper">
            <span className="select-icon-left">
              {HEALTH_OPTIONS.find(o => o.value === data['General health condition'])?.emoji || '🏥'}
            </span>
                        <select
                            id="health-select"
                            className="select-field-icon"
                            value={data['General health condition']}
                            onChange={(e) => onChange('General health condition', Number(e.target.value))}
                        >
                            <option value={0} disabled>Sélectionner un état de santé…</option>
                            {HEALTH_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronIcon />
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Dépression ── */}
                <div className="field-group">
                    <label className="field-label">
                        Fréquence des symptômes dépressifs
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">
                        Sur les 2 dernières semaines — échelle PHQ-2 (NHANES)
                    </p>
                    <div className="pill-group">
                        {DEPRESSION_OPTIONS.map((opt) => (
                            <label key={opt.value} className="pill-option">
                                <input
                                    type="radio"
                                    name="depression"
                                    value={opt.value}
                                    checked={data.depression === opt.value}
                                    onChange={() => onChange('depression', opt.value)}
                                />
                                <div className="pill-inner">
                                    <span className="pill-dot" />
                                    <span className="pill-label">{opt.label}</span>
                                    <span className="pill-sub">{opt.sub}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Assurance santé ── */}
                <div className="field-group">
                    <label className="field-label">Couverture santé</label>
                    <label
                        className={`toggle-row ${insuranceOn ? 'on' : ''}`}
                    >
                        <div className="toggle-row-left">
                            <div className="toggle-row-icon">🏥</div>
                            <div>
                                <div className="toggle-row-name">Assuré(e)</div>
                                <div className="toggle-row-desc">
                                    Couverture maladie active (NHANES : 1 = oui, 2 = non)
                                </div>
                            </div>
                        </div>

                        {/* Switch vert */}
                        <div className="toggle-switch sw-green">
                            <input
                                type="checkbox"
                                checked={insuranceOn}
                                onChange={() =>
                                    onChange('Health Insurance', insuranceOn ? 2 : 1)
                                }
                            />
                            <div className="toggle-switch-track" />
                            <div className="toggle-switch-thumb" />
                        </div>
                    </label>
                </div>

                <hr className="field-divider" />

                {/* ── IMC ── */}
                <div className="field-group">
                    <label className="field-label">
                        Indice de Masse Corporelle (IMC)
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">
                        Catégorie selon l&apos;OMS — encodage NHANES (1–4)
                    </p>
                    <div className="bmi-grid">
                        {BMI_OPTIONS.map((opt) => (
                            <label key={opt.value} className="bmi-card" data-bmi={opt.bmi}>
                                <input
                                    type="radio"
                                    name="bmi"
                                    value={opt.value}
                                    checked={data['Body Mass Index'] === opt.value}
                                    onChange={() => onChange('Body Mass Index', opt.value)}
                                />
                                <div className="bmi-inner">
                                    <span className="bmi-emoji">{opt.emoji}</span>
                                    <span className="bmi-label">{opt.label}</span>
                                    <span className="bmi-range">{opt.range}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── Footer navigation ── */}
            <div className="step-footer">
                <button className="btn-back" onClick={onBack}>
                    <ArrowLeft />
                    Retour
                </button>

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
