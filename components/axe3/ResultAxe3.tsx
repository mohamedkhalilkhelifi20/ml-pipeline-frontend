'use client'

// =============================================================================
// components/axe3/ResultAxe3.tsx — Axe 3 : Résultat Mortalité AVC
// Affiche les deux prédictions en parallèle :
//   · DDEAD — décès à 14 jours (threshold 0.20)
//   · FDEAD — décès à 6 mois  (threshold 0.25)
// =============================================================================

import '@/styles/result-card.css'
import '@/styles/axe3/result-axe3.css'
import { Axe3Output, Axe3Results } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type RiskLevel = 'low' | 'medium' | 'high'

interface ResultAxe3Props {
    results:   Axe3Results
    onRestart: () => void
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function toRiskLevel(riskLabel: string): RiskLevel {
    if (riskLabel === 'Faible')  return 'low'
    if (riskLabel === 'Modéré')  return 'medium'
    return 'high'
}

function formatPct(v: number): string {
    return `${Math.round(v * 100)} %`
}

// Positionne l'aiguille sur la barre tricolore
function needleLeft(prob: number, threshold: number): string {
    let pct: number
    if (prob < threshold) {
        pct = 4 + (prob / threshold) * 61
    } else {
        pct = 67 + ((prob - threshold) / (1 - threshold)) * 29
    }
    return `${Math.round(Math.min(96, Math.max(4, pct)))}%`
}

// --------------------------------------------------------------------------
// Icônes
// --------------------------------------------------------------------------

function RestartIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 7.5A5.5 5.5 0 1 1 7.5 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M2 4v3.5H5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

function ExportIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1v8M4 5.5L7.5 2l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 10v3h11v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

// --------------------------------------------------------------------------
// Sub-composant : card individuelle DDEAD ou FDEAD
// --------------------------------------------------------------------------

function MortalityCard({
    label,
    timeframe,
    result,
}: {
    label:     string
    timeframe: string
    result:    Axe3Output
}) {
    const level   = toRiskLevel(result.risk_level)
    const isDeath = result.prediction === 1

    return (
        <div className="a3-result-card">
            <div className={`a3-card-banner a3-card-banner--${level}`}>
                <span className="a3-card-icon">{isDeath ? '💀' : '💚'}</span>
                <div className="a3-card-timeframe">{timeframe}</div>
                <div className={`a3-card-verdict a3-card-verdict--${level}`}>
                    {label}
                </div>
            </div>

            <div className="a3-card-body">
                {/* Probabilité */}
                <div className="a3-proba-header">
                    <span className="a3-proba-label-sm">Probabilité de décès</span>
                    <span className={`a3-proba-value a3-proba-value--${level}`}>
                        {formatPct(result.probability)}
                    </span>
                </div>

                {/* Barre de risque avec aiguille */}
                <div className="a3-risk-track">
                    <div
                        className="a3-risk-needle"
                        style={{ left: needleLeft(result.probability, result.threshold) }}
                    />
                    <div
                        className="a3-risk-threshold"
                        style={{ left: `${Math.round(result.threshold * 100)}%` }}
                    />
                </div>

                {/* Infos */}
                <div className="a3-info-row">
                    <span className="a3-info-label">Niveau de risque</span>
                    <span className={`a3-risk-badge a3-risk-badge--${level}`}>
                        {result.risk_level}
                    </span>
                </div>

                <div className="a3-info-row">
                    <span className="a3-info-label">Seuil de décision</span>
                    <span className="a3-threshold-badge">{result.threshold}</span>
                </div>
            </div>
        </div>
    )
}

// --------------------------------------------------------------------------
// Recommandations selon combinaison DDEAD + FDEAD
// --------------------------------------------------------------------------

function getRecommendation(ddead: Axe3Output, fdead: Axe3Output): string {
    const dLevel = toRiskLevel(ddead.risk_level)
    const fLevel = toRiskLevel(fdead.risk_level)

    if (dLevel === 'high' || fdead.prediction === 1) {
        return 'Risque de mortalité élevé détecté sur les deux horizons temporels. Admission immédiate en unité de soins intensifs neurovasculaires recommandée. Surveillance cardio-respiratoire continue. Discussion interdisciplinaire (neurologie, cardiologie, réanimation) pour optimisation du traitement. Évaluation de la capacité décisionnelle et information de la famille.'
    }
    if (dLevel === 'medium' || fLevel === 'high') {
        return 'Profil à risque intermédiaire. Hospitalisation en unité neurovasculaire avec monitoring. Réévaluation neurologique toutes les 6 h les premières 24 h. Optimisation du traitement antiplaquettaire et anticoagulant selon le type d\'AVC. Bilan cardiaque et rééducation précoce à planifier.'
    }
    return 'Risque de mortalité faible sur les deux horizons. Poursuite de la prise en charge standard en unité neurovasculaire. Bilan étiologique complet, prévention secondaire (antiplaquettaires ou anticoagulants selon étiologie), contrôle des facteurs de risque cardiovasculaires. Rééducation précoce et suivi ambulatoire.'
}

// --------------------------------------------------------------------------
// Composant principal
// --------------------------------------------------------------------------

export default function ResultAxe3({ results, onRestart }: ResultAxe3Props) {
    const { ddead, fdead } = results

    const dLevel = toRiskLevel(ddead.risk_level)
    const fLevel = toRiskLevel(fdead.risk_level)
    const overallLevel: RiskLevel = dLevel === 'high' || fLevel === 'high'
        ? 'high'
        : dLevel === 'medium' || fLevel === 'medium'
            ? 'medium'
            : 'low'

    const reco = getRecommendation(ddead, fdead)

    const compareRows = [
        { label: '14 jours', result: ddead, level: dLevel },
        { label: '6 mois',   result: fdead, level: fLevel },
    ]

    return (
        <div className="a3-result-page">

            {/* ── En-tête contextuel ── */}
            <div className="a3-result-header">
                <div className="a3-result-header-left">
                    <span className="a3-result-header-tag">Axe 3 · Mortalité AVC</span>
                    <div className="a3-result-header-title">Prédiction de mortalité</div>
                    <div className="a3-result-header-sub">
                        Deux modèles IST en parallèle · CalibratedClassifierCV (Logistic Regression)
                    </div>
                </div>
                <span className="a3-result-header-icon">
                    {overallLevel === 'high' ? '🚨' : overallLevel === 'medium' ? '⚠️' : '✅'}
                </span>
            </div>

            {/* ── Double résultat DDEAD + FDEAD ── */}
            <div className="a3-dual-grid">
                <MortalityCard
                    label={ddead.verdict}
                    timeframe="DDEAD — 14 jours"
                    result={ddead}
                />
                <MortalityCard
                    label={fdead.verdict}
                    timeframe="FDEAD — 6 mois"
                    result={fdead}
                />
            </div>

            {/* ── Comparatif probabilités ── */}
            <div className="a3-timeline-card">
                <div className="a3-timeline-header">
                    <div className="a3-timeline-header-icon">📊</div>
                    <div>
                        <div className="a3-timeline-header-title">Comparatif probabilités de mortalité</div>
                        <div className="a3-timeline-header-sub">Court terme (14 j) vs moyen terme (6 mois)</div>
                    </div>
                </div>
                <div className="a3-timeline-body">
                    <div className="a3-compare-rows">
                        {compareRows.map(({ label, result, level }) => (
                            <div key={label} className="a3-compare-row">
                                <span className="a3-compare-timeframe">{label}</span>
                                <div className="a3-compare-bar-wrap">
                                    <div
                                        className={`a3-compare-bar-fill a3-compare-bar-fill--${level}`}
                                        style={{ width: `${Math.round(result.probability * 100)}%` }}
                                    />
                                </div>
                                <span className={`a3-compare-pct`} style={{
                                    color: level === 'high' ? '#dc2626' : level === 'medium' ? '#d97706' : '#16a34a',
                                }}>
                                    {formatPct(result.probability)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Recommandation clinique ── */}
            <div className="a3-reco-card">
                <div className="a3-reco-header">
                    <div className="a3-reco-icon">🏥</div>
                    <div className="a3-reco-title">Recommandation clinique</div>
                </div>
                <div className="a3-reco-body">
                    <p className="a3-reco-text">{reco}</p>
                    <div className="a3-reco-disclaimer">
                        <span>⚠️</span>
                        <span>
                            Résultats fournis à titre indicatif uniquement. Ne remplacent pas un avis médical.
                            DDEAD : seuil {ddead.threshold} · P(décès 14j) {formatPct(ddead.probability)} —
                            FDEAD : seuil {fdead.threshold} · P(décès 6m) {formatPct(fdead.probability)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Actions ── */}
            <div className="a3-result-actions">
                <button className="btn-restart" onClick={onRestart}>
                    <RestartIcon />
                    Nouvelle évaluation
                </button>
                <button
                    className="btn-export"
                    onClick={() => {
                        const blob = new Blob(
                            [JSON.stringify(results, null, 2)],
                            { type: 'application/json' },
                        )
                        const url = URL.createObjectURL(blob)
                        const a   = document.createElement('a')
                        a.href     = url
                        a.download = `stroke-axe3-${Date.now()}.json`
                        a.click()
                        URL.revokeObjectURL(url)
                    }}
                >
                    <ExportIcon />
                    Exporter le rapport
                </button>
            </div>

        </div>
    )
}
