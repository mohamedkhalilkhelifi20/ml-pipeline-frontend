'use client'

// =============================================================================
// app/axe3/page.tsx — Wizard Axe 3 : Mortalité AVC (IST)
// 3 étapes : Profil & Admission → Neurologie → Traitement
// Modèle : CalibratedClassifierCV (Logistic Regression) — 2 endpoints parallèles
//   · FDEAD — décès à 6 mois  (threshold 0.25)
//   · DDEAD — décès à 14 jours (threshold 0.20)
// =============================================================================

import '@/styles/wizard.css'
import { useState, useEffect, useCallback } from 'react'

import ProgressBarAxe3  from '@/components/axe3/ProgressBarAxe3'
import StepProfilAxe3   from '@/components/axe3/StepProfilAxe3'
import StepNeurologie   from '@/components/axe3/StepNeurologie'
import StepTraitement   from '@/components/axe3/StepTraitement'
import ResultAxe3       from '@/components/axe3/ResultAxe3'

import MenuButton from '@/components/MenuButton'

import {
    Axe3Input,
    Axe3Results,
    AXE3_DEFAULTS,
    predictAxe3,
    checkHealth,
} from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type WizardStep = 1 | 2 | 3
type PageState  = 'wizard' | 'loading' | 'result' | 'error'

const LOADING_STEPS = [
    'Préparation des features IST (profil + neurologie + traitement)',
    'Encodage RCONSC, STYPE, RXHEP — feature engineering',
    'Inférence FDEAD — décès à 6 mois (Logistic Regression)',
    'Inférence DDEAD — décès à 14 jours · fusion des prédictions',
]

// --------------------------------------------------------------------------
// Sous-composant : Loading
// --------------------------------------------------------------------------

function LoadingView({ step }: { step: number }) {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner" />
            <div className="loading-title">Analyse en cours…</div>
            <div className="loading-sub">
                Les deux modèles IST évaluent le risque de mortalité en parallèle
            </div>
            <div className="loading-steps">
                {LOADING_STEPS.map((label, i) => (
                    <div
                        key={i}
                        className={[
                            'loading-step',
                            i < step   ? 'loading-step--done'   : '',
                            i === step ? 'loading-step--active' : '',
                        ].join(' ').trim()}
                    >
                        <div className="loading-step-dot" />
                        {i < step ? `✓ ${label}` : label}
                    </div>
                ))}
            </div>
        </div>
    )
}

// --------------------------------------------------------------------------
// Sous-composant : Erreur
// --------------------------------------------------------------------------

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="error-card step-enter">
            <span className="error-icon">⚠️</span>
            <div>
                <div className="error-title">Erreur de connexion au backend</div>
                <pre className="error-message" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {message}
                </pre>
                <button className="btn-retry" onClick={onRetry}>Réessayer</button>
            </div>
        </div>
    )
}

// --------------------------------------------------------------------------
// Page principale
// --------------------------------------------------------------------------

export default function Axe3Page() {
    const [formData,      setFormData]      = useState<Axe3Input>(AXE3_DEFAULTS)
    const [currentStep,   setCurrentStep]   = useState<WizardStep>(1)
    const [pageState,     setPageState]     = useState<PageState>('wizard')
    const [loadingStep,   setLoadingStep]   = useState(0)
    const [result,        setResult]        = useState<Axe3Results | null>(null)
    const [errorMsg,      setErrorMsg]      = useState<string>('')
    const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

    // Health check toutes les 30 s
    useEffect(() => {
        checkHealth().then(setBackendOnline)
        const id = setInterval(() => checkHealth().then(setBackendOnline), 30_000)
        return () => clearInterval(id)
    }, [])

    // Gestionnaire de modification générique pour les types mixtes (string | number)
    const handleChange = useCallback(
        (field: keyof Axe3Input, value: Axe3Input[keyof Axe3Input]) =>
            setFormData(prev => ({ ...prev, [field]: value } as Axe3Input)),
        [],
    )

    const goNext = useCallback(() =>
        setCurrentStep(s => Math.min(3, s + 1) as WizardStep), [])

    const goBack = useCallback(() =>
        setCurrentStep(s => Math.max(1, s - 1) as WizardStep), [])

    const handleSubmit = useCallback(async () => {
        setPageState('loading')
        setLoadingStep(0)
        setErrorMsg('')

        const id = setInterval(() =>
            setLoadingStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s), 700)

        try {
            const output = await predictAxe3(formData)
            clearInterval(id)
            setResult(output)
            setPageState('result')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            clearInterval(id)
            setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
            setPageState('error')
        }
    }, [formData])

    const handleRestart = useCallback(() => {
        setFormData(AXE3_DEFAULTS)
        setCurrentStep(1)
        setResult(null)
        setErrorMsg('')
        setPageState('wizard')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const showProgress = pageState === 'wizard' || pageState === 'loading'

    return (
        <div className="wizard-page">

            {/* ── Navbar ── */}
            <nav className="wizard-nav">
                <div className="wizard-nav-left">
                    <MenuButton />
                    <div className="wizard-nav-logo">🧠</div>
                    <span className="wizard-nav-title">
                        Stroke<span>AI</span>
                    </span>
                    <div className="wizard-nav-sep" />
                    <span className="wizard-nav-axe">Axe 3 — Mortalité AVC</span>
                </div>
                <div className="wizard-nav-right">
                    <div className={`wizard-status ${
                        backendOnline ? 'wizard-status--online' : 'wizard-status--offline'
                    }`}>
                        <span className="wizard-status-dot" />
                        {backendOnline === null ? 'Connexion…'
                            : backendOnline ? 'Backend actif'
                                : 'Backend hors ligne'}
                    </div>
                </div>
            </nav>

            {/* ── ProgressBar ── */}
            {showProgress && (
                <div className="wizard-progress">
                    <ProgressBarAxe3 currentStep={currentStep} />
                </div>
            )}

            {/* ── Contenu ── */}
            <main className="wizard-main">

                {/* Étapes du wizard */}
                {pageState === 'wizard' && (
                    <>
                        {currentStep === 1 && (
                            <div className="step-enter" key="s1">
                                <StepProfilAxe3
                                    data={{
                                        AGE:    formData.AGE,
                                        SEX:    formData.SEX,
                                        RSBP:   formData.RSBP,
                                        RDELAY: formData.RDELAY,
                                    }}
                                    onChange={handleChange}
                                    onNext={goNext}
                                />
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="step-enter" key="s2">
                                <StepNeurologie
                                    data={{
                                        RDEF_SCORE: formData.RDEF_SCORE,
                                        RCONSC:     formData.RCONSC,
                                        RATRIAL:    formData.RATRIAL,
                                        STYPE:      formData.STYPE,
                                    }}
                                    onChange={handleChange}
                                    onNext={goNext}
                                    onBack={goBack}
                                />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="step-enter" key="s3">
                                <StepTraitement
                                    data={{
                                        RXASP: formData.RXASP,
                                        RXHEP: formData.RXHEP,
                                    }}
                                    onChange={handleChange}
                                    onSubmit={handleSubmit}
                                    onBack={goBack}
                                />
                            </div>
                        )}
                    </>
                )}

                {pageState === 'loading' && <LoadingView step={loadingStep} />}

                {pageState === 'result' && result && (
                    <div className="step-enter">
                        <ResultAxe3 results={result} onRestart={handleRestart} />
                    </div>
                )}

                {pageState === 'error' && (
                    <ErrorView message={errorMsg} onRetry={handleSubmit} />
                )}

            </main>
        </div>
    )
}
