'use client'

// =============================================================================
// components/axe2/ResultAxe2.tsx — Axe 2 : Résultat Sévérité AVC
// Affiche : sévérité (léger/modéré/sévère), probabilités 3 classes,
//           résumé déficits, recommandation clinique IST
// =============================================================================

import '@/styles/result-card.css'
import '@/styles/axe2/result-axe2.css'
import { Axe2Output } from '@/lib/api'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type Severity = 'leger' | 'modere' | 'severe'

interface ResultAxe2Props {
    result:    Axe2Output
    onRestart: () => void
}

// --------------------------------------------------------------------------
// Config visuelle par niveau de sévérité
// --------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<Severity, {
    icon:    string
    eyebrow: string
    verdict: string
    sub:     string
    reco:    string
}> = {
    leger: {
        icon:    '✅',
        eyebrow: 'Sévérité légère',
        verdict: 'AVC à sévérité légère',
        sub:     'Le profil neurologique indique un déficit limité. Prise en charge standard recommandée.',
        reco:    'AVC léger confirmé. Admission en unité neurovasculaire pour observation. Bilan étiologique à initier (ECG, échographie cardiaque, Doppler des troncs supra-aortiques). Prévention secondaire selon le type OCSP. Réévaluation neurologique dans les 24 h.',
    },
    modere: {
        icon:    '⚠️',
        eyebrow: 'Sévérité modérée',
        verdict: 'AVC à sévérité modérée',
        sub:     'Déficits neurologiques significatifs détectés. Surveillance rapprochée et rééducation précoce recommandées.',
        reco:    'AVC modéré. Admission en unité de soins intensifs neurovasculaires recommandée. Surveillance des paramètres vitaux et état neurologique toutes les 4 h. Initiation précoce de la rééducation (kinésithérapie, orthophonie). Bilan étiologique urgent et anticoagulation discutée selon STYPE.',
    },
    severe: {
        icon:    '🚨',
        eyebrow: 'Sévérité élevée — Urgence',
        verdict: 'AVC sévère — prise en charge urgente',
        sub:     'Profil de déficits neurologiques majeurs détecté. Évaluation et prise en charge intensives nécessaires immédiatement.',
        reco:    'AVC sévère. Transfert immédiat en unité de soins intensifs neurovasculaires. Évaluation thrombolyse IV / thrombectomie mécanique si critères remplis (délai, imagerie). Monitoring cardio-respiratoire continu. Mobilisation précoce contre-indiquée dans les premières 24 h. Réanimation si trouble de conscience.',
    },
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatPct(v: number): string {
    return `${Math.round(v * 100)} %`
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

export default function ResultAxe2({ result, onRestart }: ResultAxe2Props) {
    const sev    = result.severity as Severity
    const config = SEVERITY_CONFIG[sev]

    const probas = [
        { key: 'severe', label: 'Sévère', value: result.probability_severe },
        { key: 'modere', label: 'Modéré', value: result.probability_modere },
        { key: 'leger',  label: 'Léger',  value: result.probability_leger  },
    ]

    return (
        <div className="a2-result-page">

            {/* ── Hero card ── */}
            <div className="a2-result-hero">
                <div className={`a2-hero-banner a2-hero-banner--${sev}`}>
                    <div className="a2-hero-left">
                        <span className={`a2-eyebrow a2-eyebrow--${sev}`}>{config.eyebrow}</span>
                        <h2 className={`a2-verdict a2-verdict--${sev}`}>{config.verdict}</h2>
                        <p className={`a2-verdict-sub a2-verdict-sub--${sev}`}>{config.sub}</p>
                    </div>
                    <span className="a2-hero-icon">{config.icon}</span>
                </div>

                {/* ── Probabilités 3 classes ── */}
                <div className="a2-proba-section">
                    <div className="a2-proba-title">Probabilités par classe</div>
                    <div className="a2-proba-bars">
                        {probas.map(({ key, label, value }) => (
                            <div key={key} className="a2-proba-row">
                                <span className="a2-proba-label">{label}</span>
                                <div className="a2-proba-bar-wrap">
                                    <div
                                        className={`a2-proba-bar-fill a2-proba-bar-fill--${key}`}
                                        style={{ width: `${Math.round(value * 100)}%` }}
                                    />
                                </div>
                                <span className={`a2-proba-pct a2-proba-pct--${key}`}>
                                    {formatPct(value)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="a2-proba-info-row">
                        <span className="a2-proba-info-label">Seuil décision (sévère) :</span>
                        <span className={`a2-proba-badge a2-proba-badge--${sev}`}>
                            {result.threshold}
                        </span>
                    </div>

                    <div className="a2-proba-info-row">
                        <span className="a2-proba-info-label">Classe prédite :</span>
                        <span className={`a2-proba-badge a2-proba-badge--${sev}`}>
                            {result.severity_label} — classe {result.prediction}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Résumé déficits ── */}
            <div className="a2-deficit-card">
                <div className="a2-deficit-header">
                    <div className="a2-deficit-header-icon">🧠</div>
                    <div>
                        <div className="a2-deficit-header-title">Résumé des déficits neurologiques</div>
                        <div className="a2-deficit-header-sub">Calculé à partir des RDEF1–8 soumis (logique IST)</div>
                    </div>
                </div>
                <div className="a2-deficit-body">
                    <div className="a2-deficit-stat">
                        <span className="a2-deficit-stat-value a2-deficit-stat-value--confirmed">
                            {result.deficit_summary.n_confirmed}
                        </span>
                        <span className="a2-deficit-stat-label">Confirmés</span>
                    </div>
                    <div className="a2-deficit-stat">
                        <span className="a2-deficit-stat-value a2-deficit-stat-value--uncertain">
                            {result.deficit_summary.n_uncertain}
                        </span>
                        <span className="a2-deficit-stat-label">Incertains</span>
                    </div>
                    <div className="a2-deficit-stat">
                        <span className="a2-deficit-stat-value a2-deficit-stat-value--ratio">
                            {Math.round(result.deficit_summary.deficit_ratio * 100)} %
                        </span>
                        <span className="a2-deficit-stat-label">Ratio confirmés</span>
                    </div>
                </div>
            </div>

            {/* ── Recommandation clinique ── */}
            <div className="a2-reco-card">
                <div className="a2-reco-header">
                    <div className={`a2-reco-icon a2-reco-icon--${sev}`}>💊</div>
                    <div className="a2-reco-title">Recommandation clinique</div>
                </div>
                <div className="a2-reco-body">
                    <p className="a2-reco-text">{config.reco}</p>
                    <div className="a2-reco-disclaimer">
                        <span>⚠️</span>
                        <span>
                            Résultat fourni à titre indicatif uniquement. Ne remplace pas un avis médical professionnel.
                            Modèle CalibratedClassifierCV · Données IST · Seuil sévère : {result.threshold} · P(sévère) : {formatPct(result.probability_severe)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Actions ── */}
            <div className="a2-result-actions">
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
                        a.download = `stroke-axe2-${Date.now()}.json`
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
