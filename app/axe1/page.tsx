'use client'

// =============================================================================
// app/axe1/page.tsx — Wizard Axe 1 : Risque d'AVC
// =============================================================================

import '@/styles/wizard.css'
import { useState, useEffect, useCallback } from 'react'

import ProgressBar   from '@/components/axe1/ProgressBar'
import StepProfil    from '@/components/axe1/StepProfil'
import StepVie       from '@/components/axe1/StepVie'
import StepSante     from '@/components/axe1/StepSante'
import StepBiologie  from '@/components/axe1/StepBiologie'
import ResultCard    from '@/components/axe1/ResultCard'
import RapportIA     from '@/components/RapportIA'
import NoteBlock     from '@/components/NoteBlock'
import MenuButton    from '@/components/MenuButton'
import ClientPicker  from '@/components/ClientPicker'
import PostSavePanel from '@/components/PostSavePanel'
import { useAuth }   from '@/contexts/AuthContext'
import { toast }     from 'sonner'

import {
    Axe1RawInput, Axe1Output, AXE1_DEFAULTS,
    predictStroke, checkHealth, saveMLRapport, updateRapportNote,
    getClient, ClientOut,
} from '@/lib/api'

type WizardStep = 1 | 2 | 3 | 4
type PageState  = 'wizard' | 'loading' | 'result' | 'error'

const LOADING_STEPS = [
    'Préparation du payload (37 features)',
    'Feature engineering (pulse_pressure, fat_ratio…)',
    'Inférence LightGBM (threshold 0.25)',
    'Récupération du résultat',
]

function LoadingView({ step }: { step: number }) {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner" />
            <div className="loading-title">Analyse en cours…</div>
            <div className="loading-sub">Le modèle LightGBM évalue le profil clinique du patient</div>
            <div className="loading-steps">
                {LOADING_STEPS.map((label, i) => (
                    <div key={i} className={['loading-step', i < step ? 'loading-step--done' : '', i === step ? 'loading-step--active' : ''].join(' ').trim()}>
                        <div className="loading-step-dot" />
                        {i < step ? `✓ ${label}` : label}
                    </div>
                ))}
            </div>
        </div>
    )
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="error-card step-enter">
            <span className="error-icon">⚠️</span>
            <div>
                <div className="error-title">Erreur de connexion au backend</div>
                <pre className="error-message" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{message}</pre>
                <button className="btn-retry" onClick={onRetry}>Réessayer</button>
            </div>
        </div>
    )
}

export default function Axe1Page() {
    const { user, token } = useAuth()

    const [formData,      setFormData]      = useState<Axe1RawInput>(AXE1_DEFAULTS)
    const [currentStep,   setCurrentStep]   = useState<WizardStep>(1)
    const [pageState,     setPageState]     = useState<PageState>('wizard')
    const [loadingStep,   setLoadingStep]   = useState(0)
    const [result,        setResult]        = useState<Axe1Output | null>(null)
    const [errorMsg,      setErrorMsg]      = useState('')
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
            const { rapport_id } = await saveMLRapport(
                token, 1, clientId,
                formData as unknown as Record<string, unknown>,
                result   as unknown as Record<string, unknown>,
            )
            if (note.trim()) await updateRapportNote(token, rapport_id, note)
            setSavedId(rapport_id)
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
        } finally {
            setSaving(false)
        }
    }, [token, clientId, result, formData, note])

    const handleChange = useCallback(
        (field: keyof Axe1RawInput, value: number) =>
            setFormData(prev => ({ ...prev, [field]: value })),
        [],
    )

    const goNext = useCallback(() => setCurrentStep(s => Math.min(4, s + 1) as WizardStep), [])
    const goBack = useCallback(() => setCurrentStep(s => Math.max(1, s - 1) as WizardStep), [])

    const handleSubmit = useCallback(async () => {
        setPageState('loading'); setLoadingStep(0); setErrorMsg('')
        const id = setInterval(() => setLoadingStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s), 600)
        try {
            const output = await predictStroke(formData)
            clearInterval(id); setResult(output); setPageState('result')
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            clearInterval(id)
            setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
            setPageState('error')
        }
    }, [formData])

    const handleRestart = useCallback(() => {
        setFormData(AXE1_DEFAULTS); setCurrentStep(1); setResult(null)
        setSavedId(null); setErrorMsg(''); setPageState('wizard')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const showProgress = pageState === 'wizard' || pageState === 'loading'
    const isDoctor = user?.role === 'doctor'
    const clientName = client ? `${client.prenom} ${client.nom}` : ''

    return (
        <div className="wizard-page">
            <nav className="wizard-nav">
                <div className="wizard-nav-left">
                    <MenuButton />
                    <div className="wizard-nav-logo">🧠</div>
                    <span className="wizard-nav-title">Stroke<span>AI</span></span>
                    <div className="wizard-nav-sep" />
                    <span className="wizard-nav-axe">Axe 1 — Risque d&apos;AVC</span>
                </div>
                <div className="wizard-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Client badge in nav when selected */}
                    {client && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: '#eff6ff', border: '1px solid #bfdbfe',
                            borderRadius: 8, padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8',
                        }}>
                            👤 {clientName}
                        </div>
                    )}
                    <div className={`wizard-status ${backendOnline ? 'wizard-status--online' : 'wizard-status--offline'}`}>
                        <span className="wizard-status-dot" />
                        {backendOnline === null ? 'Connexion…' : backendOnline ? 'Backend actif' : 'Backend hors ligne'}
                    </div>
                </div>
            </nav>

            {showProgress && <div className="wizard-progress"><ProgressBar currentStep={currentStep} totalSteps={4} /></div>}

            <main className="wizard-main">
                {pageState === 'wizard' && (
                    <>
                        {currentStep === 1 && <div className="step-enter" key="s1"><StepProfil data={{ age: formData.age, Race: formData.Race }} onChange={handleChange} onNext={goNext} /></div>}
                        {currentStep === 2 && <div className="step-enter" key="s2"><StepVie data={{ smoke: formData.smoke, alcohol: formData.alcohol, 'sleep disorder': formData['sleep disorder'], 'sleep time': formData['sleep time'], 'Minutes sedentary activity': formData['Minutes sedentary activity'] }} onChange={handleChange} onNext={goNext} onBack={goBack} /></div>}
                        {currentStep === 3 && <div className="step-enter" key="s3"><StepSante data={{ hypertension: formData.hypertension, diabetes: formData.diabetes, 'high cholesterol': formData['high cholesterol'], 'Coronary Heart Disease': formData['Coronary Heart Disease'], 'General health condition': formData['General health condition'], depression: formData.depression, 'Health Insurance': formData['Health Insurance'], 'Body Mass Index': formData['Body Mass Index'] }} onChange={handleChange} onNext={goNext} onBack={goBack} /></div>}
                        {currentStep === 4 && <div className="step-enter" key="s4"><StepBiologie data={{ 'Systolic blood pressure': formData['Systolic blood pressure'], 'Diastolic blood pressure': formData['Diastolic blood pressure'], 'Low-density lipoprotein': formData['Low-density lipoprotein'], 'Fasting Glucose': formData['Fasting Glucose'], Potassium: formData.Potassium, Sodium: formData.Sodium, energy: formData.energy, protein: formData.protein, Carbohydrate: formData.Carbohydrate, 'Total fat': formData['Total fat'], 'Dietary fiber': formData['Dietary fiber'], 'Total saturated fatty acids': formData['Total saturated fatty acids'], 'Total monounsaturated fatty acids': formData['Total monounsaturated fatty acids'], 'Total polyunsaturated fatty acids': formData['Total polyunsaturated fatty acids'] }} onChange={handleChange} onSubmit={handleSubmit} onBack={goBack} isLoading={false} /></div>}
                    </>
                )}

                {pageState === 'loading' && <LoadingView step={loadingStep} />}

                {pageState === 'result' && result && (
                    <div className="step-enter">
                        <ResultCard result={result} onRestart={handleRestart} />

                        {/* Post-save panel replaces the basic save button */}
                        {savedId && clientId && client ? (
                            <PostSavePanel
                                rapportId={savedId}
                                clientId={clientId}
                                clientName={clientName}
                                currentAxe={1}
                                onNewPredict={handleRestart}
                            />
                        ) : isDoctor && !savedId && (
                            <div style={{ margin: '1.25rem auto', maxWidth: 560 }}>
                                {/* Client picker when no client pre-selected */}
                                {!clientId && token && (
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                                            Sélectionner un patient pour enregistrer
                                        </div>
                                        <ClientPicker
                                            token={token}
                                            onSelect={c => { setClient(c); setClientId(c.id) }}
                                        />
                                    </div>
                                )}
                                {clientId && (
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button
                                            onClick={handleSaveML}
                                            disabled={saving}
                                            style={{
                                                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                                                color: '#fff', border: 'none', borderRadius: 12,
                                                padding: '0.75rem 2rem', fontWeight: 700, fontSize: '0.9rem',
                                                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                                                width: '100%',
                                            }}
                                        >
                                            {saving ? '⏳ Enregistrement…' : `💾 Enregistrer dans le dossier${client ? ` de ${clientName}` : ''}`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <RapportIA
                            axe={1}
                            patient={formData as unknown as Record<string, unknown>}
                            prediction={result as unknown as Record<string, unknown>}
                            patientNom={client?.prenom ?? 'Inconnu'}
                            patientPrenom={client?.nom ?? ''}
                            token={token ?? undefined}
                            clientId={clientId ?? undefined}
                            onSaved={id => setSavedId(id)}
                        />
                        {isDoctor && (
                            <NoteBlock rapportId={savedId} token={token} note={note} onChange={setNote} />
                        )}
                    </div>
                )}

                {pageState === 'error' && <ErrorView message={errorMsg} onRetry={handleSubmit} />}
            </main>
        </div>
    )
}
