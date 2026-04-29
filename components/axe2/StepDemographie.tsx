'use client'

// =============================================================================
// components/axe2/StepDemographie.tsx — Axe 2 : Étape 1 Démographie
// Champs : AGE (16-99), SEX (M/F), RSBP (60-300 mmHg), RDELAY (0-48 h)
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/axe2/step-demographie.css'
import { Axe2Input } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ChangeHandler = (field: keyof Axe2Input, value: Axe2Input[keyof Axe2Input]) => void

interface StepDemographieProps {
    data:     Pick<Axe2Input, 'AGE' | 'SEX' | 'RSBP' | 'RDELAY'>
    onChange: ChangeHandler
    onNext:   () => void
}

// --------------------------------------------------------------------------
// Helpers cliniques
// --------------------------------------------------------------------------

function getRsbpStatus(v: number): 'normal' | 'warn' | 'danger' {
    if (v < 140) return 'normal'
    if (v < 180) return 'warn'
    return 'danger'
}

function getRsbpLabel(v: number): string {
    if (v < 140) return 'Normal (< 140 mmHg)'
    if (v < 180) return 'Élevé (140–180 mmHg)'
    return 'Très élevé (≥ 180 mmHg)'
}

function getDelayStatus(v: number): 'normal' | 'warn' | 'danger' {
    if (v <= 4.5) return 'normal'
    if (v <= 12)  return 'warn'
    return 'danger'
}

// --------------------------------------------------------------------------
// Icônes SVG
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

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function StepDemographie({ data, onChange, onNext }: StepDemographieProps) {
    const rsbpStatus  = getRsbpStatus(data.RSBP)
    const rsbpLabel   = getRsbpLabel(data.RSBP)
    const delayStatus = getDelayStatus(data.RDELAY)

    const isValid = (
        data.AGE   >= 16  && data.AGE   <= 99  &&
        data.RSBP  >= 60  && data.RSBP  <= 300 &&
        data.RDELAY >= 0  && data.RDELAY <= 48
    )

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">👤</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 1 · Démographie</span>
                    <h2 className="step-header-title">Données d&apos;admission</h2>
                    <p className="step-header-desc">
                        Caractéristiques démographiques et hémodynamiques à l&apos;admission —
                        International Stroke Trial (IST, 17 000 patients).
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* ── Sexe ── */}
                <div className="field-group">
                    <label className="field-label">
                        Sexe
                        <span className="field-label-required">*</span>
                    </label>
                    <div className="a2-sex-grid">
                        {([
                            { value: 'M' as const, icon: '♂', label: 'Homme', sub: 'Male' },
                            { value: 'F' as const, icon: '♀', label: 'Femme', sub: 'Female' },
                        ] as const).map((opt) => (
                            <label key={opt.value} className="a2-sex-card">
                                <input
                                    type="radio"
                                    name="SEX"
                                    value={opt.value}
                                    checked={data.SEX === opt.value}
                                    onChange={() => onChange('SEX', opt.value)}
                                />
                                <div className="a2-sex-inner">
                                    <span className="a2-sex-icon">{opt.icon}</span>
                                    <div className="a2-sex-info">
                                        <span className="a2-sex-label">{opt.label}</span>
                                        <span className="a2-sex-sub">{opt.sub}</span>
                                    </div>
                                </div>
                                <div className="a2-sex-check"><CheckIcon /></div>
                            </label>
                        ))}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Âge ── */}
                <div className="field-group">
                    <label className="field-label">
                        Âge
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">Plage IST : 16 – 99 ans</p>
                    <div className="a2-num-field">
                        <div className="a2-num-label">Âge en années</div>
                        <div className="a2-num-row">
                            <input
                                className="a2-num-input"
                                type="number"
                                min={16}
                                max={99}
                                placeholder="65"
                                value={data.AGE || ''}
                                onChange={(e) => onChange('AGE', Number(e.target.value))}
                            />
                            <span className="a2-num-unit">ans</span>
                        </div>
                        <div className="a2-num-status">
                            <span className={`a2-status-dot a2-status-dot--${data.AGE >= 16 && data.AGE <= 99 ? 'normal' : 'warn'}`} />
                            <span className="a2-status-text">Plage : 16 – 99</span>
                        </div>
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── RSBP + RDELAY ── */}
                <div className="field-group">
                    <label className="field-label">Paramètres cliniques</label>
                    <p className="field-hint">Tension artérielle systolique et délai d&apos;admission</p>
                    <div className="a2-num-grid">

                        {/* RSBP */}
                        <div className={`a2-num-field${rsbpStatus !== 'normal' ? ` a2-num-field--${rsbpStatus}` : ''}`}>
                            <div className="a2-num-label">Tension systolique</div>
                            <div className="a2-num-row">
                                <input
                                    className="a2-num-input"
                                    type="number"
                                    min={60}
                                    max={300}
                                    placeholder="150"
                                    value={data.RSBP || ''}
                                    onChange={(e) => onChange('RSBP', Number(e.target.value))}
                                />
                                <span className="a2-num-unit">mmHg</span>
                            </div>
                            <div className="a2-num-status">
                                <span className={`a2-status-dot a2-status-dot--${rsbpStatus}`} />
                                <span className={`a2-status-text--${rsbpStatus}`}>{rsbpLabel}</span>
                            </div>
                        </div>

                        {/* RDELAY */}
                        <div className="a2-num-field">
                            <div className="a2-num-label">Délai AVC → Admission</div>
                            <div className="a2-num-row">
                                <input
                                    className="a2-num-input"
                                    type="number"
                                    min={0}
                                    max={48}
                                    step={0.5}
                                    placeholder="6"
                                    value={data.RDELAY !== 0 ? data.RDELAY : ''}
                                    onChange={(e) => onChange('RDELAY', Number(e.target.value))}
                                />
                                <span className="a2-num-unit">h</span>
                            </div>
                            <div className="a2-num-status">
                                <span className={`a2-status-dot a2-status-dot--${delayStatus}`} />
                                <span className="a2-status-text">Plage : 0 – 48 h</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* ── Footer ── */}
            <div className="step-footer">
                <span className="step-footer-info">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.2"/>
                        <path d="M6.5 6v3M6.5 4v.5" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    Remplissez tous les champs pour continuer
                </span>
                <button className="btn-next" onClick={onNext} disabled={!isValid}>
                    Continuer
                    <ArrowRight />
                </button>
            </div>

        </div>
    )
}
