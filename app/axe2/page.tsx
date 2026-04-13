'use client'

// =============================================================================
// app/axe2/page.tsx — Wizard Axe 2 : Sévérité AVC (IST)
// 3 étapes : Démographie → Déficits neurologiques → Variables cliniques
// Modèle : CalibratedClassifierCV (Logistic Regression) — 3 classes
// =============================================================================

import '@/styles/wizard.css'
import { useState, useEffect, useCallback } from 'react'

import ProgressBarAxe2  from '@/components/axe2/ProgressBarAxe2'
import StepDemographie  from '@/components/axe2/StepDemographie'
import StepDeficits     from '@/components/axe2/StepDeficits'
import StepClinique     from '@/components/axe2/StepClinique'
import ResultAxe2       from '@/components/axe2/ResultAxe2'

import MenuButton from '@/components/MenuButton'

import {
    Axe2Input,
    Axe2Output,
    AXE2_DEFAULTS,
    predictAxe2,
    checkHealth,
} from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type WizardStep = 1 | 2 | 3
type PageState  = 'wizard' | 'loading' | 'result' | 'error'

const LOADING_STEPS = [
    'Préparation des 18 features brutes IST',
    'Feature engineering (RDEF_v2, uncertain, deficit_ratio…)',
    'Inférence CalibratedClassifierCV — 3 classes',
    'Application du seuil prioritaire (sévère ≥ 0.30)',
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
                Le modèle évalue la sévérité de l&apos;AVC selon le profil IST
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

export default function Axe2Page() {
    const [formData,      setFormData]      = useState<Axe2Input>(AXE2_DEFAULTS)
    const [currentStep,   setCurrentStep]   = useState<WizardStep>(1)
    const [pageState,     setPageState]     = useState<PageState>('wizard')
    const [loadingStep,   setLoadingStep]   = useState(0)
    const [result,        setResult]        = useState<Axe2Output | null>(null)
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
        (field: keyof Axe2Input, value: Axe2Input[keyof Axe2Input]) =>
            setFormData(prev => ({ ...prev, [field]: value } as Axe2Input)),
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
            setLoadingStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s), 600)

        try {
            const output = await predictAxe2(formData)
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
        setFormData(AXE2_DEFAULTS)
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
                    <span className="wizard-nav-axe">Axe 2 — Sévérité de l&apos;AVC</span>
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
                    <ProgressBarAxe2 currentStep={currentStep} />
                </div>
            )}

            {/* ── Contenu ── */}
            <main className="wizard-main">

                {/* Étapes du wizard */}
                {pageState === 'wizard' && (
                    <>
                        {currentStep === 1 && (
                            <div className="step-enter" key="s1">
                                <StepDemographie
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
                                <StepDeficits
                                    data={{
                                        RDEF1: formData.RDEF1,
                                        RDEF2: formData.RDEF2,
                                        RDEF3: formData.RDEF3,
                                        RDEF4: formData.RDEF4,
                                        RDEF5: formData.RDEF5,
                                        RDEF6: formData.RDEF6,
                                        RDEF7: formData.RDEF7,
                                        RDEF8: formData.RDEF8,
                                    }}
                                    onChange={handleChange}
                                    onNext={goNext}
                                    onBack={goBack}
                                />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="step-enter" key="s3">
                                <StepClinique
                                    data={{
                                        STYPE:   formData.STYPE,
                                        RSLEEP:  formData.RSLEEP,
                                        RATRIAL: formData.RATRIAL,
                                        RCT:     formData.RCT,
                                        RVISINF: formData.RVISINF,
                                        RHEP24:  formData.RHEP24,
                                        RASP3:   formData.RASP3,
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
                        <ResultAxe2 result={result} onRestart={handleRestart} />
                    </div>
                )}

                {pageState === 'error' && (
                    <ErrorView message={errorMsg} onRetry={handleSubmit} />
                )}

            </main>
        </div>
    )
}
