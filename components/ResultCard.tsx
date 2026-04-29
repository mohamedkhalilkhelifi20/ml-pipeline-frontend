'use client'

// =============================================================================
// components/ResultCard.tsx — Résultat Axe 1
// Aligné sur Axe1Output réel :
//   { probability, prediction, threshold, verdict, engineered_features }
// =============================================================================

import '@/styles/result-card.css'
import { Axe1Output, getRiskLevel } from '@/lib/api'

interface ResultCardProps {
    result: Axe1Output
    onRestart: () => void
}

type RiskLevel = 'low' | 'medium' | 'high'

// --------------------------------------------------------------------------
// Config visuelle par niveau de risque
// --------------------------------------------------------------------------

const RISK_CONFIG: Record<RiskLevel, {
    icon:    string
    eyebrow: string
    verdict: string
    sub:     string
}> = {
    low: {
        icon:    '✅',
        eyebrow: 'Risque faible détecté',
        verdict: 'Profil à faible risque d\'AVC',
        sub:     'Le modèle LightGBM ne détecte pas de signal clinique préoccupant sur la base des données fournies.',
    },
    medium: {
        icon:    '⚠️',
        eyebrow: 'Risque modéré détecté',
        verdict: 'Vigilance recommandée',
        sub:     'Certains facteurs de risque sont identifiés. Un suivi médical régulier est conseillé.',
    },
    high: {
        icon:    '🚨',
        eyebrow: 'Risque élevé détecté',
        verdict: 'Consultation médicale urgente',
        sub:     'Le modèle détecte un profil à risque significatif. Une évaluation clinique approfondie est fortement recommandée.',
    },
}

// Labels FR pour les features engineered
const FEATURE_LABELS: Record<string, string> = {
    pulse_pressure:        'Pression pulsée',
    cardio_risk_score:     'Score risque cardio.',
    age_CHD:               'Âge × Coronaropathie',
    depression_insurance:  'Dépression × Assurance',
    fat_ratio:             'Ratio gras sat./insaturé',
    fiber_cholesterol:     'Fibres × Cholestérol',
    smoke_hypertension:    'Tabac × Hypertension',
    smoke_diabetes:        'Tabac × Diabète',
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatPct(v: number): string {
    return `${Math.round(v * 100)}%`
}

/**
 * Positionne l'aiguille en tenant compte du threshold comme frontière réelle.
 * prob < threshold  → zone gauche  [4%,  65%]
 * prob >= threshold → zone droite  [67%, 96%]
 */
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
// Composant principal
// --------------------------------------------------------------------------

export default function ResultCard({ result, onRestart }: ResultCardProps) {
    const level  = getRiskLevel(result.probability, result.threshold)
    const config = RISK_CONFIG[level]
    const prob   = result.probability

    // Features engineered triées par valeur absolue décroissante
    const topFeatures = Object.entries(result.engineered_features)
        .map(([key, val]) => ({ key, abs: Math.abs(val), val }))
        .sort((a, b) => b.abs - a.abs)
        .slice(0, 6)

    const maxVal = topFeatures[0]?.abs ?? 1

    return (
        <div className="result-page">

            {/* ── Hero card ── */}
            <div className="result-hero">
                <div className={`result-hero-banner result-hero-banner--${level}`}>
                    <div className="result-hero-left">
            <span className={`result-eyebrow result-eyebrow--${level}`}>
              {config.eyebrow}
            </span>
                        <h2 className={`result-verdict result-verdict--${level}`}>
                            {result.verdict}
                        </h2>
                        <p className={`result-sub result-sub--${level}`}>
                            {config.sub}
                        </p>
                    </div>
                    <span className="result-hero-icon">{config.icon}</span>
                </div>

                {/* Jauge probabilité */}
                <div className="result-gauge-section">
                    <div className="result-gauge-header">
                        <span className="result-gauge-title">Probabilité de risque d&apos;AVC</span>
                        <span className={`result-gauge-pct result-gauge-pct--${level}`}>
              {formatPct(prob)}
            </span>
                    </div>

                    {/* Barre segmentée avec aiguille + marqueur threshold */}
                    <div className="risk-track">
                        <div className="risk-needle" style={{ left: needleLeft(prob, result.threshold) }} />
                        {/* Marqueur threshold — frontière de décision du modèle */}
                        <div
                            className="risk-threshold-marker"
                            style={{ left: `${Math.round(result.threshold * 100)}%` }}
                            title={`Threshold : ${result.threshold}`}
                        />
                    </div>
                    <div className="risk-labels">
                        <span className="risk-label risk-label--low">Faible</span>
                        <span className="risk-label risk-label--medium">Modéré</span>
                        <span className="risk-label risk-label--high">Élevé</span>
                    </div>

                    {/* Seuil de décision */}
                    <div className="confidence-row">
            <span className="confidence-label">
              Seuil de décision (threshold) :
            </span>
                        <div className="confidence-badge confidence-badge--high">
                            {result.threshold}
                        </div>
                    </div>

                    {/* Prédiction brute */}
                    <div className="confidence-row">
            <span className="confidence-label">
              Prédiction brute :&nbsp;
                <strong style={{ color: result.prediction === 1 ? '#dc2626' : '#16a34a' }}>
                {result.prediction === 1 ? 'Risque élevé (1)' : 'Faible risque (0)'}
              </strong>
            </span>
                    </div>
                </div>
            </div>

            {/* ── Features engineered ── */}
            {topFeatures.length > 0 && (
                <div className="features-card">
                    <div className="features-card-header">
                        <div className="features-card-icon">⚙️</div>
                        <div>
                            <div className="features-card-title">Features calculées (feature engineering)</div>
                            <div className="features-card-sub">
                                Variables dérivées utilisées par le modèle LightGBM
                            </div>
                        </div>
                    </div>
                    <div className="features-list">
                        {topFeatures.map(({ key, abs, val }, i) => {
                            const barPct = Math.round((abs / maxVal) * 100)
                            const barCls = [
                                'feature-bar-fill',
                                i === 1 ? 'feature-bar-fill--2' : '',
                                i === 2 ? 'feature-bar-fill--3' : '',
                                i >= 3  ? 'feature-bar-fill--other' : '',
                            ].join(' ').trim()

                            return (
                                <div key={key} className="feature-row">
                                    <div className={`feature-rank ${i < 3 ? 'feature-rank--top' : ''}`}>
                                        {i + 1}
                                    </div>
                                    <span className="feature-name" title={key}>
                    {FEATURE_LABELS[key] ?? key}
                  </span>
                                    <div className="feature-bar-wrap">
                                        <div className={barCls} style={{ width: `${barPct}%` }} />
                                    </div>
                                    <span className="feature-value">
                    {val > 0 ? '+' : ''}{val.toFixed(2)}
                  </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Recommandation clinique ── */}
            <div className="reco-card">
                <div className="reco-card-header">
                    <div className="reco-card-icon">💊</div>
                    <div className="reco-card-title">Recommandation clinique</div>
                </div>
                <div className="reco-card-body">
                    <p className="reco-text">
                        {result.prediction === 0
                            ? 'Aucun signal de risque élevé détecté. Maintenir un suivi préventif régulier et conserver de bonnes habitudes de vie (alimentation équilibrée, activité physique, contrôle de la tension artérielle).'
                            : 'Profil à risque identifié par le modèle. Une consultation cardiologique est recommandée pour évaluation approfondie. Contrôle de la pression artérielle, de la glycémie et du bilan lipidique conseillé en priorité.'
                        }
                    </p>
                    <div className="reco-disclaimer">
                        <span>⚠️</span>
                        <span>
              Ce résultat est fourni à titre indicatif uniquement.
              Il ne remplace pas un avis médical professionnel.
              Modèle LightGBM entraîné sur NHANES (Ping Wang, 2024 — DOI: 10.17632/xggs239bnw.1).
              Threshold : {result.threshold} · Probabilité : {formatPct(prob)}
            </span>
                    </div>
                </div>
            </div>

            {/* ── Actions ── */}
            <div className="result-actions">
                <button className="btn-restart" onClick={onRestart}>
                    <RestartIcon />
                    Nouvelle évaluation
                </button>
                <button
                    className="btn-export"
                    onClick={() => {
                        const blob = new Blob(
                            [JSON.stringify(result, null, 2)],
                            { type: 'application/json' },
                        )
                        const url = URL.createObjectURL(blob)
                        const a   = document.createElement('a')
                        a.href     = url
                        a.download = `stroke-axe1-${Date.now()}.json`
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
