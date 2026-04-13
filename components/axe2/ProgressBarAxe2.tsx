'use client'

// =============================================================================
// components/axe2/ProgressBarAxe2.tsx — Progress bar 3 étapes Axe 2
// Réutilise progressbar.css — seule la data STEPS change
// =============================================================================

import '@/styles/progressbar.css'

interface ProgressBarAxe2Props {
    currentStep: number  // 1 à 3
}

const STEPS = [
    { label: 'Démographie', sublabel: 'Admission',  icon: '👤' },
    { label: 'Déficits',    sublabel: 'Neurologie', icon: '🧠' },
    { label: 'Clinique',    sublabel: 'Variables',  icon: '🏥' },
]

export default function ProgressBarAxe2({ currentStep }: ProgressBarAxe2Props) {
    const totalSteps  = 3
    const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100

    return (
        <div className="progress-wrapper">

            {/* En-tête */}
            <div className="progress-header">
                <span className="progress-title">Évaluation de la sévérité de l&apos;AVC</span>
                <div className="progress-badge">
                    <span className="progress-badge-dot" />
                    Logistic Regression · Prêt
                </div>
            </div>

            {/* Étapes */}
            <div className="progress-track">
                {STEPS.map((step, i) => {
                    const num       = i + 1
                    const isDone    = num < currentStep
                    const isActive  = num === currentStep
                    const isPending = num > currentStep

                    return (
                        <div key={num} className="step-item">
                            <div className={[
                                'step-bubble',
                                isDone    ? 'step-bubble--done'    : '',
                                isActive  ? 'step-bubble--active'  : '',
                                isPending ? 'step-bubble--pending' : '',
                            ].join(' ').trim()}>
                                {isDone ? (
                                    <svg className="step-check" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                        <path d="M2.5 7.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : isActive ? (
                                    <span className="step-icon">{step.icon}</span>
                                ) : (
                                    <span className="step-number">{num}</span>
                                )}
                            </div>

                            <div className="step-info">
                                <span className={[
                                    'step-label',
                                    isDone   ? 'step-label--done'   : '',
                                    isActive ? 'step-label--active' : '',
                                ].join(' ').trim()}>
                                    {step.label}
                                </span>
                                <span className={`step-sublabel ${isActive ? 'step-sublabel--active' : ''}`}>
                                    {step.sublabel}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Barre linéaire + compteur */}
            <div className="progress-linear">
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="progress-counter">
                    <span>{currentStep}</span> / {totalSteps}
                </span>
            </div>

        </div>
    )
}
