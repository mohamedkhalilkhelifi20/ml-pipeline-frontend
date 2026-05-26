'use client'

// =============================================================================
// app/axe2/page.tsx — Wizard Axe 2 : Sévérité AVC (IST)
// 3 étapes : Démographie → Déficits neurologiques → Variables cliniques
// Modèle : CalibratedClassifierCV (Logistic Regression) — 3 classes
// =============================================================================

import '@/styles/wizard.css'
import { useState, useEffect, useCallback } from 'react'

import ProgressBarAxe2 from '@/components/axe2/ProgressBarAxe2'
import StepDemographie from '@/components/axe2/StepDemographie'
import StepDeficits    from '@/components/axe2/StepDeficits'
import StepClinique    from '@/components/axe2/StepClinique'
import ResultAxe2      from '@/components/axe2/ResultAxe2'
import RapportIA       from '@/components/RapportIA'
import NoteBlock       from '@/components/NoteBlock'
import MenuButton      from '@/components/MenuButton'
import ClientPicker    from '@/components/ClientPicker'
import PostSavePanel   from '@/components/PostSavePanel'
import { useAuth }     from '@/contexts/AuthContext'
import { toast }       from 'sonner'

import {
    Axe2Input, Axe2Output, AXE2_DEFAULTS,
    predictAxe2, checkHealth, saveMLRapport, updateRapportNote,
    getClient, ClientOut,
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
    const { user, token } = useAuth()

    const [formData,      setFormData]      = useState<Axe2Input>(AXE2_DEFAULTS)
    const [currentStep,   setCurrentStep]   = useState<WizardStep>(1)
    const [pageState,     setPageState]     = useState<PageState>('wizard')
    const [loadingStep,   setLoadingStep]   = useState(0)
    const [result,        setResult]        = useState<Axe2Output | null>(null)
    const [errorMsg,      setErrorMsg]      = useState<string>('')
    const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
    const [clientId,      setClientId]      = useState<string | null>(null)
    const [client,        setClient]        = useState<ClientOut | null>(null)
    const [saving,        setSaving]        = useState(false)
    const [savedId,       setSavedId]       = useState<string | null>(null)
    const [note,          setNote]          = useState('')

    useEffect(() => {
        const cid = new URLSearchParams(window.location.search).get('client')
        if (cid) { setClientId(cid); if (token) getClient(token, cid).then(setClient).catch(() => {}) }
    }, [token])

    useEffect(() => {
        checkHealth().then(setBackendOnline)
        const id = setInterval(() => checkHealth().then(setBackendOnline), 30_000)
        return () => clearInterval(id)
    }, [])

    const handleSaveML = useCallback(async () => {
        if (!token || !clientId || !result) return
        setSaving(true)
        try {
            const { rapport_id } = await saveMLRapport(token, 2, clientId, formData as unknown as Record<string, unknown>, result as unknown as Record<string, unknown>)
            if (note.trim()) await updateRapportNote(token, rapport_id, note)
            setSavedId(rapport_id)
        } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.') }
        finally { setSaving(false) }
    }, [token, clientId, result, formData, note])

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
        setFormData(AXE2_DEFAULTS); setCurrentStep(1); setResult(null)
        setSavedId(null); setErrorMsg(''); setPageState('wizard')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const showProgress = pageState === 'wizard' || pageState === 'loading'
    const isDoctor  = user?.role === 'doctor'
    const clientName = client ? `${client.prenom} ${client.nom}` : ''

    return (
        <div className="wizard-page">
            <nav className="wizard-nav">
                <div className="wizard-nav-left">
                    <MenuButton />
                    <div className="wizard-nav-logo">🧠</div>
                    <span className="wizard-nav-title">Stroke<span>AI</span></span>
                    <div className="wizard-nav-sep" />
                    <span className="wizard-nav-axe">Axe 2 — Sévérité de l&apos;AVC</span>
                </div>
                <div className="wizard-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {client && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8' }}>
                            👤 {clientName}
                        </div>
                    )}
                    <div className={`wizard-status ${backendOnline ? 'wizard-status--online' : 'wizard-status--offline'}`}>
                        <span className="wizard-status-dot" />
                        {backendOnline === null ? 'Connexion…' : backendOnline ? 'Backend actif' : 'Backend hors ligne'}
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

                        {savedId && clientId && client ? (
                            <PostSavePanel rapportId={savedId} clientId={clientId} clientName={clientName} currentAxe={2} onNewPredict={handleRestart} />
                        ) : isDoctor && !savedId && (
                            <div style={{ margin: '1.25rem auto', maxWidth: 560 }}>
                                {!clientId && token && (
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                                            Sélectionner un patient pour enregistrer
                                        </div>
                                        <ClientPicker token={token} onSelect={c => { setClient(c); setClientId(c.id) }} />
                                    </div>
                                )}
                                {clientId && (
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button onClick={handleSaveML} disabled={saving} style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', border: 'none', borderRadius: 12, padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, width: '100%' }}>
                                            {saving ? '⏳ Enregistrement…' : `💾 Enregistrer dans le dossier${client ? ` de ${clientName}` : ''}`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <RapportIA axe={2} patient={formData as unknown as Record<string, unknown>} prediction={result as unknown as Record<string, unknown>} token={token ?? undefined} clientId={clientId ?? undefined} onSaved={id => setSavedId(id)} />
                        {isDoctor && <NoteBlock rapportId={savedId} token={token} note={note} onChange={setNote} />}
                    </div>
                )}

                {pageState === 'error' && (
                    <ErrorView message={errorMsg} onRetry={handleSubmit} />
                )}

            </main>
        </div>
    )
}
