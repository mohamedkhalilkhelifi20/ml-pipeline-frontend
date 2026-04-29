'use client'

// =============================================================================
// components/StepBiologie.tsx — Étape 4 : Données Biologiques & Nutritionnelles
// Aligné sur Axe1Input (schemas/axe1.py) — tous les champs requis
//
// Champs biologiques :
//   Systolic blood pressure / Diastolic blood pressure
//   Low-density lipoprotein (LDL) / Fasting Glucose
//   Potassium / Sodium
//
// Champs nutritionnels :
//   energy / protein / Carbohydrate
//   Total fat / Dietary fiber
//   Total saturated fatty acids
//   Total monounsaturated fatty acids
//   Total polyunsaturated fatty acids
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/step-biologie.css'
import { Axe1RawInput } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type StepBiologieData = Pick<
    Axe1RawInput,
    | 'Systolic blood pressure'
    | 'Diastolic blood pressure'
    | 'Low-density lipoprotein'
    | 'Fasting Glucose'
    | 'Potassium'
    | 'Sodium'
    | 'energy'
    | 'protein'
    | 'Carbohydrate'
    | 'Total fat'
    | 'Dietary fiber'
    | 'Total saturated fatty acids'
    | 'Total monounsaturated fatty acids'
    | 'Total polyunsaturated fatty acids'
>

interface StepBiologieProps {
    data: StepBiologieData
    onChange: (field: keyof Axe1RawInput, value: number) => void
    onSubmit: () => void
    onBack: () => void
    isLoading?: boolean
}

// --------------------------------------------------------------------------
// Config champs — alignés sur Axe1Input aliases
// --------------------------------------------------------------------------

interface BioFieldConfig {
    field: keyof StepBiologieData
    icon: string
    label: string
    unit: string
    placeholder: string
    min: number
    max: number
    normalMin: number
    normalMax: number
}

const CARDIO_FIELDS: BioFieldConfig[] = [
    {
        field: 'Low-density lipoprotein',
        icon: '🔴', label: 'LDL — Lipoprotéines basse densité', unit: 'mg/dL',
        placeholder: '100', min: 0, max: 300, normalMin: 0, normalMax: 130,
    },
    {
        field: 'Fasting Glucose',
        icon: '🍬', label: 'Glycémie à jeun', unit: 'mg/dL',
        placeholder: '90', min: 0, max: 500, normalMin: 70, normalMax: 100,
    },
    {
        field: 'Potassium',
        icon: '🍌', label: 'Potassium', unit: 'mg',
        placeholder: '3000', min: 0, max: 8000, normalMin: 2600, normalMax: 3400,
    },
    {
        field: 'Sodium',
        icon: '🧂', label: 'Sodium', unit: 'mg',
        placeholder: '2500', min: 0, max: 6000, normalMin: 1500, normalMax: 2300,
    },
]

const MACRO_FIELDS: BioFieldConfig[] = [
    {
        field: 'energy',
        icon: '⚡', label: 'Énergie totale', unit: 'kcal',
        placeholder: '2000', min: 0, max: 5000, normalMin: 1600, normalMax: 2500,
    },
    {
        field: 'protein',
        icon: '🥩', label: 'Protéines', unit: 'g/j',
        placeholder: '70', min: 0, max: 300, normalMin: 46, normalMax: 56,
    },
    {
        field: 'Carbohydrate',
        icon: '🍞', label: 'Glucides', unit: 'g/j',
        placeholder: '250', min: 0, max: 700, normalMin: 130, normalMax: 300,
    },
]

const LIPID_FIELDS: BioFieldConfig[] = [
    {
        field: 'Total fat',
        icon: '🥑', label: 'Lipides totaux', unit: 'g/j',
        placeholder: '70', min: 0, max: 300, normalMin: 44, normalMax: 77,
    },
    {
        field: 'Total saturated fatty acids',
        icon: '🧈', label: 'Acides gras saturés', unit: 'g/j',
        placeholder: '25', min: 0, max: 150, normalMin: 0, normalMax: 22,
    },
    {
        field: 'Total monounsaturated fatty acids',
        icon: '🫒', label: 'Acides gras monoinsaturés', unit: 'g/j',
        placeholder: '20', min: 0, max: 150, normalMin: 10, normalMax: 35,
    },
    {
        field: 'Total polyunsaturated fatty acids',
        icon: '🐟', label: 'Acides gras polyinsaturés', unit: 'g/j',
        placeholder: '15', min: 0, max: 100, normalMin: 10, normalMax: 30,
    },
    {
        field: 'Dietary fiber',
        icon: '🌾', label: 'Fibres alimentaires', unit: 'g/j',
        placeholder: '15', min: 0, max: 100, normalMin: 25, normalMax: 38,
    },
]

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

type RangeStatus = 'normal' | 'warn' | 'danger'

function getRangeStatus(value: number, cfg: BioFieldConfig): RangeStatus | null {
    if (!value || value <= 0) return null
    if (value >= cfg.normalMin && value <= cfg.normalMax) return 'normal'
    const dev = value < cfg.normalMin
        ? (cfg.normalMin - value) / (cfg.normalMin || 1)
        : (value - cfg.normalMax) / (cfg.normalMax || 1)
    return dev > 0.5 ? 'danger' : 'warn'
}

function getRangeLabel(value: number, cfg: BioFieldConfig): string {
    const s = getRangeStatus(value, cfg)
    if (!s) return ''
    if (s === 'normal') return `Normal (${cfg.normalMin}–${cfg.normalMax} ${cfg.unit})`
    if (s === 'warn')   return 'Légèrement hors norme'
    return 'Hors plage normale'
}

function getRangePct(value: number, cfg: BioFieldConfig): number {
    if (!value || value <= 0) return 0
    return Math.min(100, Math.round((value / cfg.max) * 100))
}

// --------------------------------------------------------------------------
// Sous-composant BioField
// --------------------------------------------------------------------------

function BioField({
                      config, value, onChange,
                  }: {
    config: BioFieldConfig
    value: number
    onChange: (field: keyof Axe1RawInput, value: number) => void
}) {
    const status = getRangeStatus(value, config)
    const label  = getRangeLabel(value, config)
    const pct    = getRangePct(value, config)

    const dotColor =
        status === 'normal' ? '#22c55e' :
            status === 'warn'   ? '#f59e0b' :
                status === 'danger' ? '#ef4444' : 'transparent'

    return (
        <div>
            <div className="bio-field">
                <div className="bio-field-icon">{config.icon}</div>
                <div className="bio-field-body">
                    <span className="bio-field-label">{config.label}</span>
                    <input
                        type="number"
                        className="bio-input"
                        min={config.min}
                        max={config.max}
                        step={0.1}
                        placeholder={config.placeholder}
                        value={value || ''}
                        onChange={(e) =>
                            onChange(config.field as keyof Axe1RawInput, Number(e.target.value))
                        }
                    />
                </div>
                <div className="bio-field-unit">{config.unit}</div>
            </div>

            {value > 0 && status && (
                <>
                    <div className="bio-range-bar">
                        <div
                            className={`bio-range-fill bio-range-fill--${status}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="bio-range-label">
                        <span className="bio-range-dot" style={{ background: dotColor }} />
                        {label}
                    </div>
                </>
            )}
        </div>
    )
}

// --------------------------------------------------------------------------
// Icônes
// --------------------------------------------------------------------------

function ArrowLeft() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function SpinnerIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
             style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
            <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
    )
}

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function StepBiologie({
                                         data, onChange, onSubmit, onBack, isLoading = false,
                                     }: StepBiologieProps) {

    const sys = data['Systolic blood pressure']
    const dia = data['Diastolic blood pressure']
    const pulsePressure = sys && dia ? sys - dia : null

    const pulseCls =
        pulsePressure === null ? '' :
            pulsePressure < 40    ? 'bp-pulse--warn' :
                pulsePressure > 60    ? 'bp-pulse--high' :
                    'bp-pulse--normal'

    // Tous les champs requis
    const requiredFields: (keyof StepBiologieData)[] = [
        'Systolic blood pressure', 'Diastolic blood pressure',
        'Low-density lipoprotein', 'Fasting Glucose',
        'Potassium', 'Sodium',
        'energy', 'protein', 'Carbohydrate',
        'Total fat', 'Dietary fiber',
        'Total saturated fatty acids',
        'Total monounsaturated fatty acids',
        'Total polyunsaturated fatty acids',
    ]

    const filledCount = requiredFields.filter(f => (data[f] ?? 0) > 0).length
    const isValid     = filledCount === requiredFields.length

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">🔬</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 4 · Biologie</span>
                    <h2 className="step-header-title">Données biologiques & nutritionnelles</h2>
                    <p className="step-header-desc">
                        Ces marqueurs permettent au modèle de calculer les features engineered :
                        pression pulsée, fat_ratio, cardio_risk_score, fiber_cholesterol.
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* ── Tension artérielle ── */}
                <div className="field-group">
                    <label className="field-label">
                        Tension artérielle <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">Utilisée pour calculer la pression pulsée (systolique − diastolique)</p>
                    <div className="bio-pair">
                        <div className="bp-card">
                            <div className="bp-card-top">
                                <span className="bp-card-name">Systolique</span>
                                <span className="bp-card-icon">⬆️</span>
                            </div>
                            <div className="bp-input-row">
                                <input type="number" className="bp-input" min={60} max={300}
                                       placeholder="120" value={sys || ''}
                                       onChange={(e) => onChange('Systolic blood pressure', Number(e.target.value))}
                                />
                                <span className="bp-unit">mmHg</span>
                            </div>
                        </div>
                        <div className="bp-card">
                            <div className="bp-card-top">
                                <span className="bp-card-name">Diastolique</span>
                                <span className="bp-card-icon">⬇️</span>
                            </div>
                            <div className="bp-input-row">
                                <input type="number" className="bp-input" min={40} max={200}
                                       placeholder="80" value={dia || ''}
                                       onChange={(e) => onChange('Diastolic blood pressure', Number(e.target.value))}
                                />
                                <span className="bp-unit">mmHg</span>
                            </div>
                        </div>
                    </div>
                    {pulsePressure !== null && (
                        <div className={`bp-pulse ${pulseCls}`}>
                            ⚡ Pression pulsée : {pulsePressure} mmHg
                            {pulseCls === 'bp-pulse--normal' && ' — Normal'}
                            {pulseCls === 'bp-pulse--warn'   && ' — Faible'}
                            {pulseCls === 'bp-pulse--high'   && ' — Élevée'}
                        </div>
                    )}
                </div>

                <hr className="field-divider" />

                {/* ── Bilan lipidique & glycémie ── */}
                <div className="field-group">
                    <label className="field-label">
                        Bilan lipidique & glycémie <span className="field-label-required">*</span>
                    </label>
                    <div className="bio-section">
                        {CARDIO_FIELDS.map(cfg => (
                            <BioField key={cfg.field} config={cfg}
                                      value={data[cfg.field] ?? 0} onChange={onChange} />
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Macronutriments ── */}
                <div className="field-group">
                    <label className="field-label">
                        Apports énergétiques <span className="field-label-required">*</span>
                    </label>
                    <div className="bio-section">
                        {MACRO_FIELDS.map(cfg => (
                            <BioField key={cfg.field} config={cfg}
                                      value={data[cfg.field] ?? 0} onChange={onChange} />
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Lipides détaillés ── */}
                <div className="field-group">
                    <label className="field-label">
                        Profil lipidique alimentaire <span className="field-label-required">*</span>
                    </label>
                    <div className="nutrition-header">
                        <span className="nutrition-header-icon">ℹ️</span>
                        <div className="nutrition-header-text">
                            <strong>Feature engineering :</strong> fat_ratio = saturés ÷ polyinsaturés ·
                            fiber_cholesterol = fibres × cholestérol élevé
                        </div>
                    </div>
                    <div className="bio-section">
                        {LIPID_FIELDS.map(cfg => (
                            <BioField key={cfg.field} config={cfg}
                                      value={data[cfg.field] ?? 0} onChange={onChange} />
                        ))}
                    </div>
                </div>

                {/* ── Bannière complétion ── */}
                {isValid && (
                    <div className="completion-banner">
                        <span className="completion-icon">✅</span>
                        <div>
                            <div className="completion-text">Formulaire complet — prêt pour l&apos;analyse</div>
                            <div className="completion-sub">
                                {filledCount}/{requiredFields.length} champs · LightGBM · threshold 0.25
                            </div>
                        </div>
                    </div>
                )}

                {/* Progression si incomplet */}
                {!isValid && filledCount > 0 && (
                    <p className="field-hint" style={{ textAlign: 'right' }}>
                        {filledCount} / {requiredFields.length} champs remplis
                    </p>
                )}

            </div>

            {/* ── Footer ── */}
            <div className="step-footer">
                <button className="btn-back" onClick={onBack} disabled={isLoading}>
                    <ArrowLeft />
                    Retour
                </button>
                <button
                    className="btn-submit"
                    onClick={onSubmit}
                    disabled={!isValid || isLoading}
                >
                    {isLoading ? (
                        <><SpinnerIcon /> Analyse en cours…</>
                    ) : (
                        <>🧠 Analyser le risque</>
                    )}
                </button>
            </div>

        </div>
    )
}
