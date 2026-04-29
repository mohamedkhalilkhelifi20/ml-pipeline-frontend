'use client'

// =============================================================================
// components/axe3/StepNeurologie.tsx — Axe 3 : Étape 2 Neurologie
// Champs : RDEF_SCORE (0–8 entier), RCONSC (F/D/U), RATRIAL (Y/N), STYPE
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/step-vie.css'
import '@/styles/axe2/step-clinique.css'
import '@/styles/axe3/step-neurologie.css'
import { Axe3Input, RconscType, StrokeType, BinaryYN } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ChangeHandler = (field: keyof Axe3Input, value: Axe3Input[keyof Axe3Input]) => void

interface StepNeurologieProps {
    data:     Pick<Axe3Input, 'RDEF_SCORE' | 'RCONSC' | 'RATRIAL' | 'STYPE'>
    onChange: ChangeHandler
    onNext:   () => void
    onBack:   () => void
}

// --------------------------------------------------------------------------
// Données statiques
// --------------------------------------------------------------------------

const RCONSC_OPTIONS: { value: RconscType; icon: string; code: string; label: string; sub: string }[] = [
    { value: 'F', icon: '😊', code: 'Alerte',     label: 'Fully conscious', sub: 'Fully conscious' },
    { value: 'D', icon: '😴', code: 'Somnolent',  label: 'Drowsy',          sub: 'Drowsy / confused' },
    { value: 'U', icon: '😵', code: 'Inconscient', label: 'Unconscious',    sub: 'Coma / unresponsive' },
]

const STYPE_OPTIONS: { value: StrokeType; code: string; name: string; pct: string }[] = [
    { value: 'LACS', code: 'LACS', name: 'Lacunaire',    pct: '24 %' },
    { value: 'PACS', code: 'PACS', name: 'Ant. partiel', pct: '40 %' },
    { value: 'TACS', code: 'TACS', name: 'Ant. total',   pct: '24 %' },
    { value: 'POCS', code: 'POCS', name: 'Postérieur',   pct: '12 %' },
    { value: 'OTH',  code: 'OTH',  name: 'Autre',        pct: '—'    },
]

// Sévérité et label du score RDEF
function getScoreSeverity(s: number): { level: 'none' | 'low' | 'medium' | 'high' | 'severe'; label: string } {
    if (s === 0) return { level: 'none',   label: 'Aucun déficit neurologique' }
    if (s <= 2)  return { level: 'low',    label: 'Déficits légers (1–2)' }
    if (s <= 4)  return { level: 'medium', label: 'Déficits modérés (3–4)' }
    if (s <= 6)  return { level: 'high',   label: 'Déficits importants (5–6)' }
    return             { level: 'severe',  label: 'Déficits sévères (7–8)' }
}

function getScoreBtnClass(value: number, selected: number): string {
    if (value !== selected) return 'score-btn'
    if (value <= 2)  return 'score-btn score-btn--active-0'
    if (value <= 4)  return 'score-btn score-btn--active-3'
    if (value <= 6)  return 'score-btn score-btn--active-5'
    return                  'score-btn score-btn--active-7'
}

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

export default function StepNeurologie({ data, onChange, onNext, onBack }: StepNeurologieProps) {
    const scoreSev = getScoreSeverity(data.RDEF_SCORE)

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">🧠</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 2 · Neurologie</span>
                    <h2 className="step-header-title">Bilan neurologique à l&apos;admission</h2>
                    <p className="step-header-desc">
                        Score de déficits RDEF (0–8), état de conscience, fibrillation auriculaire
                        et type d&apos;AVC selon la classification OCSP.
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* RDEF_SCORE */}
                <div className="field-group">
                    <label className="field-label">
                        Score de déficits neurologiques (RDEF)
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">Somme des 8 déficits IST présents — 0 = aucun, 8 = tous</p>
                    <div className="score-selector">
                        {Array.from({ length: 9 }, (_, i) => i).map((val) => (
                            <button
                                key={val}
                                className={getScoreBtnClass(val, data.RDEF_SCORE)}
                                onClick={() => onChange('RDEF_SCORE', val)}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                    <div className="score-legend">
                        <span className="score-legend-label score-legend-label--low">0 — Aucun</span>
                        <span className="score-legend-label score-legend-label--high">8 — Tous</span>
                    </div>
                    <div className={`score-severity score-severity--${scoreSev.level}`}>
                        <span>●</span>
                        <span>{scoreSev.label}</span>
                    </div>
                </div>

                <hr className="field-divider" />

                {/* RCONSC */}
                <div className="field-group">
                    <label className="field-label">
                        État de conscience (RCONSC)
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">Niveau de vigilance à l&apos;admission</p>
                    <div className="rconsc-grid">
                        {RCONSC_OPTIONS.map((opt) => (
                            <label key={opt.value} className={`rconsc-card rconsc-card--${opt.value.toLowerCase()}`}>
                                <input
                                    type="radio"
                                    name="RCONSC"
                                    value={opt.value}
                                    checked={data.RCONSC === opt.value}
                                    onChange={() => onChange('RCONSC', opt.value as RconscType)}
                                />
                                <div className="rconsc-inner">
                                    <span className="rconsc-icon">{opt.icon}</span>
                                    <span className="rconsc-code">{opt.code}</span>
                                    <span className="rconsc-label">{opt.label}</span>
                                    <span className="rconsc-sub">{opt.sub}</span>
                                </div>
                                <div className="rconsc-check"><CheckIcon /></div>
                            </label>
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* RATRIAL */}
                <div className="field-group">
                    <label className="field-label">Fibrillation auriculaire (RATRIAL)</label>
                    <p className="field-hint">Présence de FA à l&apos;admission</p>
                    <div className="binary-list">
                        {([
                            { value: 'Y' as BinaryYN, label: 'FA présente', desc: 'Fibrillation auriculaire confirmée', icon: '💓' },
                            { value: 'N' as BinaryYN, label: 'Pas de FA',   desc: 'Rythme sinusal ou autre',           icon: '❤️' },
                        ]).map((opt) => (
                            <div
                                key={opt.value}
                                className={`binary-row${data.RATRIAL === opt.value ? ' binary-row--active' : ''}`}
                                onClick={() => onChange('RATRIAL', opt.value)}
                            >
                                <div className="binary-row-left">
                                    <div className="binary-row-icon">{opt.icon}</div>
                                    <div className="binary-row-info">
                                        <span className="binary-row-label">{opt.label}</span>
                                        <span className="binary-row-desc">{opt.desc}</span>
                                    </div>
                                </div>
                                <div style={{
                                    width: 16, height: 16,
                                    borderRadius: '50%',
                                    border: `2px solid ${data.RATRIAL === opt.value ? '#1d4ed8' : '#e2e8f0'}`,
                                    background: data.RATRIAL === opt.value ? '#1d4ed8' : 'transparent',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                }} />
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* STYPE */}
                <div className="field-group">
                    <label className="field-label">
                        Type d&apos;AVC (STYPE)
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">Classification OCSP — prévalences IST</p>
                    <div className="stype-grid">
                        {STYPE_OPTIONS.map((opt) => (
                            <label key={opt.value} className="stype-card">
                                <input
                                    type="radio"
                                    name="STYPE_axe3"
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
