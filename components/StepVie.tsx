'use client'

// =============================================================================
// components/StepVie.tsx — Étape 2 : Mode de Vie & Habitudes
// Champs :
//   smoke              → toggle (0/1)
//   alcohol            → toggle (0/1)
//   sleep disorder     → toggle (1=oui / 2=non)
//   sleep time         → slider  (1–14 h)
//   Minutes sedentary  → number input (0–1200 min)
// Styles : @/styles/step-vie.css + @/styles/step-profil.css (layout partagé)
// =============================================================================

import '@/styles/step-profil.css'
import '@/styles/step-vie.css'
import { useCallback } from 'react'
import { Axe1RawInput } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type StepVieData = Pick<
    Axe1RawInput,
    'smoke' | 'alcohol' | 'sleep disorder' | 'sleep time' | 'Minutes sedentary activity'
>

interface StepVieProps {
    data: StepVieData
    onChange: (field: keyof Axe1RawInput, value: number) => void
    onNext: () => void
    onBack: () => void
}

// --------------------------------------------------------------------------
// Config toggles
// --------------------------------------------------------------------------

const TOGGLES = [
    {
        field: 'smoke'         as const,
        icon:  '🚬',
        label: 'Tabagisme',
        desc:  'Consommation actuelle ou passée de tabac',
        activeValue: 1,
        inactiveValue: 0,
    },
    {
        field: 'alcohol'       as const,
        icon:  '🍷',
        label: 'Consommation d\'alcool',
        desc:  'Consommation régulière ou occasionnelle',
        activeValue: 1,
        inactiveValue: 0,
    },
    {
        field: 'sleep disorder' as const,
        icon:  '😴',
        label: 'Trouble du sommeil',
        desc:  'Insomnie, apnée, hypersomnie…',
        activeValue: 1,   // 1 = oui (encodage NHANES)
        inactiveValue: 2, // 2 = non (encodage NHANES)
    },
]

// --------------------------------------------------------------------------
// Icônes SVG
// --------------------------------------------------------------------------

function ArrowLeft() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function ArrowRight() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Calcule le % de remplissage du slider pour le gradient CSS */
function sliderFillPct(value: number, min: number, max: number) {
    return `${((value - min) / (max - min)) * 100}%`
}

/** Label dynamique pour le temps de sommeil */
function sleepLabel(h: number): string {
    if (h < 6)  return 'Insuffisant — risque élevé'
    if (h <= 9) return 'Normal — dans la norme clinique'
    return 'Excessif — à surveiller'
}

function sleepDotClass(h: number): string {
    if (h < 6 || h > 9) return 'range-indicator-dot range-indicator-dot--warn'
    return 'range-indicator-dot'
}

/** Label dynamique pour l'activité sédentaire */
function sedentaryLabel(min: number): string {
    if (min < 300)  return 'Actif — moins de 5h assis/jour'
    if (min < 600)  return 'Modéré — entre 5h et 10h'
    return 'Sédentaire — plus de 10h/jour'
}

function sedentaryDotClass(min: number): string {
    return min >= 600
        ? 'range-indicator-dot range-indicator-dot--warn'
        : 'range-indicator-dot'
}

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function StepVie({ data, onChange, onNext, onBack }: StepVieProps) {

    const sleepMin = 1
    const sleepMax = 14

    // Validation : sleep time et sedentary activity doivent être > 0
    const isValid =
        data['sleep time'] > 0 &&
        data['Minutes sedentary activity'] >= 0

    // Handler slider avec style dynamique
    const handleSlider = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = Number(e.target.value)
            e.target.style.setProperty(
                '--fill-pct',
                sliderFillPct(val, sleepMin, sleepMax),
            )
            onChange('sleep time', val)
        },
        [onChange],
    )

    return (
        <div className="step-container">

            {/* ── En-tête ── */}
            <div className="step-header">
                <div className="step-header-icon">🌿</div>
                <div className="step-header-content">
                    <span className="step-header-tag">Étape 2 · Mode de vie</span>
                    <h2 className="step-header-title">Habitudes & comportements</h2>
                    <p className="step-header-desc">
                        Les habitudes de vie sont parmi les facteurs de risque les plus
                        déterminants dans la prédiction du risque d&apos;AVC.
                    </p>
                </div>
            </div>

            {/* ── Corps ── */}
            <div className="step-body">

                {/* ── Facteurs de risque comportementaux ── */}
                <div className="field-group">
                    <span className="section-label">Facteurs comportementaux</span>
                    <div className="toggle-group">
                        {TOGGLES.map(({ field, icon, label, desc, activeValue, inactiveValue }) => {
                            const isOn = data[field] === activeValue
                            return (
                                <label
                                    key={field}
                                    className={`toggle-item ${isOn ? 'toggle-item--active' : ''}`}
                                >
                                    <div className="toggle-item-left">
                                        <div className="toggle-item-icon">{icon}</div>
                                        <div className="toggle-item-content">
                                            <span className="toggle-item-label">{label}</span>
                                            <span className="toggle-item-desc">{desc}</span>
                                        </div>
                                    </div>

                                    {/* Switch */}
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isOn}
                                            onChange={() =>
                                                onChange(field, isOn ? inactiveValue : activeValue)
                                            }
                                        />
                                        <div className="toggle-switch-track" />
                                        <div className="toggle-switch-thumb" />
                                    </div>
                                </label>
                            )
                        })}
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Temps de sommeil ── */}
                <div className="field-group">
                    <label className="field-label">
                        Durée de sommeil quotidienne
                        <span className="field-label-required">*</span>
                    </label>
                    <div className="slider-field-wrapper">
                        <div className="slider-top">
              <span className="slider-top-label">
                <span className="slider-top-icon">🌙</span>
                Heures de sommeil
              </span>
                            <div className="slider-value-badge">
                                <span className="slider-value-num">{data['sleep time']}</span>
                                <span className="slider-value-unit">h / nuit</span>
                            </div>
                        </div>

                        <input
                            type="range"
                            className="slider-input"
                            min={sleepMin}
                            max={sleepMax}
                            step={0.5}
                            value={data['sleep time']}
                            onChange={handleSlider}
                            style={{
                                '--fill-pct': sliderFillPct(data['sleep time'], sleepMin, sleepMax),
                            } as React.CSSProperties}
                        />

                        <div className="slider-ticks">
                            {[1, 4, 7, 9, 11, 14].map((v) => (
                                <span key={v} className="slider-tick">{v}h</span>
                            ))}
                        </div>

                        <div className="range-indicator">
                            <span className={sleepDotClass(data['sleep time'])} />
                            {sleepLabel(data['sleep time'])}
                        </div>
                    </div>
                </div>

                <hr className="field-divider" />

                {/* ── Activité sédentaire ── */}
                <div className="field-group">
                    <label className="field-label" htmlFor="sedentary-input">
                        Activité sédentaire quotidienne
                        <span className="field-label-required">*</span>
                    </label>
                    <p className="field-hint">
                        Temps total passé assis (travail, transport, loisirs) · plage NHANES : 0 – 1 200 min
                    </p>
                    <div className="number-field-wrapper">
                        <span className="number-field-icon">🪑</span>
                        <div className="number-field-content">
                            <div className="number-field-top">Minutes par jour</div>
                            <input
                                id="sedentary-input"
                                type="number"
                                className="number-input"
                                min={0}
                                max={1200}
                                step={10}
                                placeholder="ex : 480"
                                value={data['Minutes sedentary activity'] || ''}
                                onChange={(e) =>
                                    onChange('Minutes sedentary activity', Number(e.target.value))
                                }
                            />
                        </div>
                        <span className="number-field-unit">min / j</span>
                    </div>

                    {data['Minutes sedentary activity'] > 0 && (
                        <div className="range-indicator">
                            <span className={sedentaryDotClass(data['Minutes sedentary activity'])} />
                            {sedentaryLabel(data['Minutes sedentary activity'])}
                        </div>
                    )}
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
