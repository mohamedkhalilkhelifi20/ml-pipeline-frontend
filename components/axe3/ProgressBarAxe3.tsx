'use client'

// =============================================================================
// components/axe3/ProgressBarAxe3.tsx — Progress bar 3 étapes Axe 3
// =============================================================================

import '@/styles/progressbar.css'

interface ProgressBarAxe3Props {
    currentStep: number  // 1 à 3
}

const STEPS = [
    { label: 'Profil',      sublabel: 'Admission',    icon: '👤' },
    { label: 'Neurologie',  sublabel: 'Déficits',     icon: '🧠' },
    { label: 'Traitement',  sublabel: 'Thérapeutique', icon: '💊' },
]

export default function ProgressBarAxe3({ currentStep }: ProgressBarAxe3Props) {
    const totalSteps  = 3
    const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100

    return (
        <div className="progress-wrapper">

            <div className="progress-header">
                <span className="progress-title">Prédiction de mortalité après AVC</span>
                <div className="progress-badge">
                    <span className="progress-badge-dot" />
                    Logistic Regression · 2 modèles
                </div>
            </div>

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
